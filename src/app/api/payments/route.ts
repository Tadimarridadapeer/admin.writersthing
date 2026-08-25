import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const [
      paymentsRes,
      withdrawalsRes,
      usersRes,
      booksRes
    ] = await Promise.all([
      supabaseAdmin.from("payments").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("withdrawals").select("*").order("created_at", { ascending: false }),
      supabaseAdmin.from("users").select("id, name, email"),
      supabaseAdmin.from("books").select("id, title")
    ]);

    // Try to fetch purchases and author_earnings (they may not exist yet)
    let purchasesData: any[] = [];
    let earningsData: any[] = [];

    try {
      const purchasesRes = await supabaseAdmin.from("purchases").select("*");
      if (!purchasesRes.error) purchasesData = purchasesRes.data || [];
    } catch (e) { /* table may not exist */ }

    try {
      const earningsRes = await supabaseAdmin.from("author_earnings").select("*");
      if (!earningsRes.error) earningsData = earningsRes.data || [];
    } catch (e) { /* table may not exist */ }

    return NextResponse.json({
      payments: paymentsRes.data || [],
      purchases: purchasesData,
      authorEarnings: earningsData,
      withdrawals: withdrawalsRes.data || [],
      users: usersRes.data || [],
      books: booksRes.data || [],
    });
  } catch (error: any) {
    console.error("Payments API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
