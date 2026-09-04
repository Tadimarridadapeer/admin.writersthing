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
      failedPaymentsRes,
      failedWithdrawalsRes,
      usersRes,
      booksRes,
      authorsRes
    ] = await Promise.all([
      supabaseAdmin.from("payments").select("*").in("status", ["FAILED", "PENDING"]).order("created_at", { ascending: false }),
      supabaseAdmin.from("withdrawals").select("*").eq("status", "Failed").order("created_at", { ascending: false }),
      supabaseAdmin.from("users").select("id, name, email, active_upi_id"),
      supabaseAdmin.from("books").select("id, title, author_id, upi_id"),
      supabaseAdmin.from("authors").select("id, user_id, upi_id")
    ]);

    return NextResponse.json({
      failedPayments: failedPaymentsRes.data || [],
      failedWithdrawals: failedWithdrawalsRes.data || [],
      users: usersRes.data || [],
      books: booksRes.data || [],
      authors: authorsRes.data || [],
    });
  } catch (error: any) {
    console.error("Support API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
