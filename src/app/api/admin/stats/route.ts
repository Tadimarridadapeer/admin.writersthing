import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { startOfDay, startOfWeek, subDays } from "date-fns";

export async function GET() {
  try {
    // 1. Total users
    const { count: totalUsers, error: totalError } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact" });

    if (totalError) return NextResponse.json({ error: "totalError", details: totalError }, { status: 500 });

    // 2. New Users Today
    const today = startOfDay(new Date()).toISOString();
    const { count: usersToday, error: todayError } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact" })
      .gte("created_at", today);

    if (todayError) return NextResponse.json({ error: "todayError", details: todayError }, { status: 500 });

    // 3. New Users This Week
    const thisWeek = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
    const { count: usersThisWeek, error: weekError } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact" })
      .gte("created_at", thisWeek);

    if (weekError) return NextResponse.json({ error: "weekError", details: weekError }, { status: 500 });

    // 4. Logins Today (calculated from auth.users)
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) return NextResponse.json({ error: "authError", details: authError }, { status: 500 });
    
    let loginsToday = 0;
    authUsers.forEach(u => {
      if (u.last_sign_in_at && new Date(u.last_sign_in_at) >= new Date(today)) {
        loginsToday++;
      }
    });

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      newUsersToday: usersToday || 0,
      newUsersThisWeek: usersThisWeek || 0,
      loginsToday
    });
  } catch (error: any) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
