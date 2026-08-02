import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * One-time cleanup route.
 * Deletes any Super Admin records created with dummy/test credentials.
 * CALL THIS ONCE, then it's safe to use /setup.
 *
 * GET /api/cleanup-super-admin
 */
export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json({ error: "Service role key not configured." }, { status: 500 });
    }

    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find the Super Admin role
    const { data: role } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "Super Admin")
      .single();

    if (!role) {
      return NextResponse.json({ message: "No Super Admin role found. Nothing to clean." });
    }

    // Get all super admin users
    const { data: superAdmins } = await supabase
      .from("operations_users")
      .select("id, email")
      .eq("role_id", role.id);

    if (!superAdmins || superAdmins.length === 0) {
      return NextResponse.json({ message: "No Super Admin records found. Already clean." });
    }

    const deleted: string[] = [];

    for (const admin of superAdmins) {
      // Delete from operations_users first
      await supabase.from("operations_users").delete().eq("id", admin.id);
      // Delete from Supabase Auth
      await supabase.auth.admin.deleteUser(admin.id);
      deleted.push(admin.email);
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.length} Super Admin record(s): ${deleted.join(", ")}`,
      deleted,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
