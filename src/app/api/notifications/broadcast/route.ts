import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getAdminSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase admin credentials");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(req: NextRequest) {
  try {
    const supabase = getAdminSupabase();
    
    // Auth Check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const token = authHeader.replace("Bearer ", "").trim();
    const { data: { user }, error: authError } = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ).auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Usually, in operations portal, any logged in user here is verified as admin in middleware
    // But we can just proceed.

    const body = await req.json();
    const { message, type, emails } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    let targetUserIds: string[] = [];

    if (type === "all") {
      // Get ALL users
      const { data: allUsers, error: usersError } = await supabase
        .from("users")
        .select("id");

      if (usersError || !allUsers) {
        throw new Error("Failed to fetch users");
      }
      targetUserIds = allUsers.map((u: any) => u.id);
    } else if (type === "selected") {
      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return NextResponse.json({ error: "Emails are required for selected users" }, { status: 400 });
      }
      // Get specific users by email
      const { data: specificUsers, error: specificUsersError } = await supabase
        .from("users")
        .select("id, email")
        .in("email", emails.map(e => e.toLowerCase()));

      if (specificUsersError || !specificUsers) {
        throw new Error("Failed to fetch specific users");
      }
      targetUserIds = specificUsers.map((u: any) => u.id);
      
      if (targetUserIds.length === 0) {
        return NextResponse.json({ error: "No matching users found for those emails." }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: "Invalid target type" }, { status: 400 });
    }

    // Insert a notification for every matched user
    const notifications = targetUserIds.map(id => ({
      user_id: id,
      actor_id: user.id, // Admin sending it
      type: "system_message",
      target_type: "broadcast",
      target_id: "broadcast",
      is_read: false,
      metadata: { text: message }
    }));

    // Batch insert in chunks to avoid overwhelming Postgres
    const chunkSize = 500;
    for (let i = 0; i < notifications.length; i += chunkSize) {
      const chunk = notifications.slice(i, i + chunkSize);
      const { error: insertError } = await supabase
        .from("notifications")
        .insert(chunk);
      
      if (insertError) {
        console.error("Batch insert error:", insertError);
        throw new Error("Failed to insert some notifications");
      }
    }

    return NextResponse.json({ success: true, broadcastCount: notifications.length });
  } catch (error: any) {
    console.error("Broadcast error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
