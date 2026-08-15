import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Helper for admin client
const getAdminSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase credentials");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, fullName, actorId } = body;

    if (!email || !fullName) {
      return NextResponse.json({ error: "Email and full name are required" }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    
    // 1. Check for existing pending or accepted invitation
    const { data: existingInvite } = await supabase
      .from("founding_writers")
      .select("status")
      .eq("email_address", email.toLowerCase())
      .maybeSingle();

    if (existingInvite) {
      if (existingInvite.status === "Pending" || existingInvite.status === "Invited") {
        return NextResponse.json({ error: "Founding Writer invitation already pending." }, { status: 400 });
      }
      if (existingInvite.status === "Accepted") {
        return NextResponse.json({ error: "This author is already a Founding Writer." }, { status: 400 });
      }
    }

    // 2. Optimistic Concurrency Control (OCC) to securely find the next gap 1-100
    let assignedNumber = null;
    let inviteId = null;
    let attempts = 0;
    const maxAttempts = 15;

    while (assignedNumber === null && attempts < maxAttempts) {
      attempts++;
      
      // Fetch all currently occupied numbers
      const { data: occupied } = await supabase
        .from("founding_writers")
        .select("founder_number")
        .order("founder_number", { ascending: true });
        
      const occupiedSet = new Set((occupied || []).map(r => r.founder_number));
      let lowestGap = null;
      
      for (let i = 1; i <= 100; i++) {
        if (!occupiedSet.has(i)) {
          lowestGap = i;
          break;
        }
      }

      if (lowestGap === null) {
        return NextResponse.json({ error: "All Founding Writer slots are currently occupied." }, { status: 400 });
      }

      // Try to insert the record with the gap number
      const { data: insertedInvite, error: insertError } = await supabase
        .from("founding_writers")
        .insert({
          founder_number: lowestGap,
          full_name: fullName,
          email_address: email.toLowerCase(),
          status: "Invited",
          invited_by: actorId
        })
        .select("id")
        .single();

      if (!insertError && insertedInvite) {
        assignedNumber = lowestGap;
        inviteId = insertedInvite.id;
        break; // Success!
      } else {
        if (insertError.code === "23505" && insertError.message.includes("founder_number")) {
          // Collision on founder_number, loop will retry and find the next gap
          continue;
        } else if (insertError.code === "23505" && insertError.message.includes("email_address")) {
           return NextResponse.json({ error: "A founding writer with this email already exists." }, { status: 400 });
        } else {
          throw insertError;
        }
      }
    }

    if (assignedNumber === null) {
      return NextResponse.json({ error: "Failed to assign a founding writer slot due to high concurrency. Please try again." }, { status: 500 });
    }

    // 3. Link to user and create notification if the user already exists in public.users
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();
      
    if (!userError && users) {
      const targetUserId = users.id;
      
      // Update invitation to link user_id
      await supabase
        .from("founding_writers")
        .update({ user_id: targetUserId })
        .eq("email_address", email.toLowerCase());
      
      // Insert in-app notification
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: targetUserId,
          type: "founder_invite",
          content: "Writersthing invited you to become a Founding Writer.",
          target_url: "/profile",
          metadata: { invite_id: inviteId },
          is_read: false
        });
        
      if (notifError) console.error("Failed to insert notification:", notifError);
    }

    // 4. Send Email via Resend
    let emailSent = false;
    let emailError = null;

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'hello@writersthing.com';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const acceptUrl = `${appUrl}/profile`;
        const paddedNumber = String(assignedNumber).padStart(5, '0');

        const { data, error } = await resend.emails.send({
          from: `Writer's Thing <${fromEmail}>`,
          to: email,
          subject: "Congratulations! You've Been Invited to the Writer's Thing Founding Writer Program",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #000; text-transform: uppercase;">Writer's Thing</h1>
              <h2>Congratulations, ${fullName}!</h2>
              <p>You have been invited to join the Writer's Thing Founding Writer Program.</p>
              <p>Your invitation gives you the opportunity to become one of Writer's Thing's Founding Writers.</p>
              
              <div style="margin: 30px 0; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center;">
                <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #d97706; font-weight: bold;">Founding Writer</p>
                <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; font-family: monospace;">#${paddedNumber}</p>
              </div>

              <a href="${acceptUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Accept Invitation</a>
              
              <p style="margin-top: 40px; font-size: 14px; color: #6b7280;">Welcome to the next chapter of digital storytelling.</p>
            </div>
          `,
        });

        if (error) {
          console.error("Resend API Error details:", error);
          emailError = error.message;
        } else {
          emailSent = true;
        }
      } catch (err: any) {
        console.error("Resend Exception:", err);
        emailError = err.message;
      }
    } else {
      console.warn("RESEND_API_KEY is not configured. Email was not sent.");
      emailError = "RESEND_API_KEY is not configured";
    }

    return NextResponse.json({ 
      success: true, 
      assignedNumber,
      emailSent,
      emailError,
      message: emailSent 
        ? "Founding Writer invitation sent successfully." 
        : "Invitation created, but email delivery failed."
    });
    
  } catch (error: any) {
    console.error("Invite API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
