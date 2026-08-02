import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Only the service role key can bypass RLS and use auth.admin API
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase service role key is not configured.");
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── GET /api/setup ── Check if Super Admin already exists ─────────────────────
export async function GET() {
  try {
    const supabase = getAdminClient();

    const { data: superAdminRole } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "Super Admin")
      .single();

    if (!superAdminRole) {
      return NextResponse.json({ exists: false, configured: false });
    }

    const { data: existing, error } = await supabase
      .from("operations_users")
      .select("id")
      .eq("role_id", superAdminRole.id)
      .limit(1);

    if (error) {
      return NextResponse.json({ exists: false, configured: true });
    }

    return NextResponse.json({
      exists: !!(existing && existing.length > 0),
      configured: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}

// ── POST /api/setup ── Create the Super Admin (one-time only) ─────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = getAdminClient();
    const body = await req.json();
    const { fullName, email, password } = body;

    // Validate input
    if (!fullName?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "Full name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    // ── Guard: Ensure Super Admin doesn't already exist ───────────────────────
    const { data: superAdminRole } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "Super Admin")
      .single();

    if (!superAdminRole) {
      return NextResponse.json(
        { error: "Database not configured. Please run the operations schema first." },
        { status: 500 }
      );
    }

    const { data: existing } = await supabase
      .from("operations_users")
      .select("id")
      .eq("role_id", superAdminRole.id)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "A Super Admin account already exists. Setup is locked." },
        { status: 403 }
      );
    }

    // ── Create user in Supabase Auth (email_confirm: true = no verification email) ──
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName.trim() },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // ── Insert into operations_users ───────────────────────────────────────────
    const { error: insertError } = await supabase.from("operations_users").insert({
      id: userId,
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      role_id: superAdminRole.id,
      status: "Active",
      requires_password_change: false,
    });

    if (insertError) {
      // Rollback: delete the auth user we just created
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
