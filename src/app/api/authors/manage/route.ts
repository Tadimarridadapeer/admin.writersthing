import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    const { userId, field, value } = body;

    if (!userId || !field) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (field !== "is_verified_writer" && field !== "available_for_hire") {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    const { error } = await supabase
      .from("users")
      .update({ [field]: value })
      .eq("id", userId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Manage Author API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
