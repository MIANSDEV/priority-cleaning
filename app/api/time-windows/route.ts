import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient(useAdmin = false) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    useAdmin ? process.env.SUPABASE_SERVICE_ROLE_KEY! : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

// GET - public, returns active time windows ordered by display_order
// Uses service role key because anon RLS may not cover all rows
export async function GET() {
  const supabase = getClient(true);
  const { data, error } = await supabase
    .from("time_windows")
    .select("id, label, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ windows: data || [] });
}
