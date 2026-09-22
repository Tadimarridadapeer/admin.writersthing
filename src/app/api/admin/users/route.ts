import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  try {
    // Basic auth check (if token is provided in header or cookie)
    // Here we could use createServerClient to get the current session,
    // but assuming middleware or app structure ensures this endpoint is protected.
    
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    
    const { count, error: countError } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact" });

    if (countError) return NextResponse.json({ error: "countError", details: countError }, { status: 500 });

    let query = supabaseAdmin
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: publicUsers, error: usersError } = await query;
    if (usersError) return NextResponse.json({ error: "usersError", details: usersError }, { status: 500 });

    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) return NextResponse.json({ error: "authError", details: authError }, { status: 500 });

    const authMap = new Map();
    authUsers.forEach(u => {
      authMap.set(u.id, u);
    });

    // Fetch library for last read data
    const { data: libraryData, error: libraryError } = await supabaseAdmin
      .from("library")
      .select("user_id, last_read, books(title)")
      .order("last_read", { ascending: false });
      
    const libraryMap = new Map();
    libraryData?.forEach(l => {
      // Only keep the most recent last_read per user
      if (!libraryMap.has(l.user_id)) {
        libraryMap.set(l.user_id, {
          lastReadAt: l.last_read,
          lastReadTitle: l.books?.title || "Unknown Book"
        });
      }
    });

    const enrichedUsers = publicUsers?.map(u => {
      const authUser = authMap.get(u.id);
      const libraryInfo = libraryMap.get(u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.is_verified_writer ? "Author" : "User",
        joinedAt: u.created_at,
        lastLoginAt: authUser?.last_sign_in_at || null,
        lastReadAt: libraryInfo?.lastReadAt || null,
        lastReadTitle: libraryInfo?.lastReadTitle || null,
        status: authUser?.banned_until ? "inactive" : (
          authUser?.last_sign_in_at && (new Date().getTime() - new Date(authUser.last_sign_in_at).getTime() < 24 * 60 * 60 * 1000)
            ? "active" 
            : "offline"
        )
      };
    }) || [];

    return NextResponse.json({
      users: enrichedUsers,
      totalCount: count
    });
  } catch (error: any) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json({ error: JSON.stringify(error, Object.getOwnPropertyNames(error)) }, { status: 500 });
  }
}
