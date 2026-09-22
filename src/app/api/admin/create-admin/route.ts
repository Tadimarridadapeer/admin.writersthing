import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, phone, department, createdBy } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Create user in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Get Admin Role ID
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("name", "Admin")
      .single();

    if (roleError || !adminRole) {
      // Cleanup auth user if role fetch fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: "Admin role not found." }, { status: 500 });
    }

    // 3. Insert into operations_users
    const { error: insertError } = await supabaseAdmin.from("operations_users").insert({
      id: userId,
      full_name: fullName,
      email,
      phone: phone || null,
      role_id: adminRole.id,
      department: department || null,
      status: "Active",
      requires_password_change: true,
      created_by: createdBy || null,
    });

    if (insertError) {
      // Cleanup auth user if insert fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: authData.user });
  } catch (error: any) {
    console.error("Error creating admin:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
