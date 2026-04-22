import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient(useAdmin = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = useAdmin
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// GET - active specials for public; all specials when ?all=true (admin)
export async function GET(request: NextRequest) {
  const supabase = getClient(true);
  const all = new URL(request.url).searchParams.get("all") === "true";

  let query = supabase.from("specials").select("*").order("display_order");
  if (!all) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// PUT - create special (admin)
export async function PUT(request: NextRequest) {
  const supabase = getClient(true);
  const body = await request.json();

  const { data, error } = await supabase
    .from("specials")
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH - update special (admin)
export async function PATCH(request: NextRequest) {
  const supabase = getClient(true);
  const { id, ...updates } = await request.json();

  const { data, error } = await supabase
    .from("specials")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE - delete special (admin)
export async function DELETE(request: NextRequest) {
  const supabase = getClient(true);
  const { id } = await request.json();

  const { error } = await supabase.from("specials").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
