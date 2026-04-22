import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient(useAdmin = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = useAdmin
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// GET - fetch all active service categories with items and levels
export async function GET() {
  const supabase = getClient();

  const { data: categories, error: catError } = await supabase
    .from("service_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  if (catError) return NextResponse.json({ error: catError.message }, { status: 500 });

  const { data: items, error: itemsError } = await supabase
    .from("service_items")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

  const { data: levels, error: levelsError } = await supabase
    .from("service_levels")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  if (levelsError) return NextResponse.json({ error: levelsError.message }, { status: 500 });

  // Assemble nested structure
  const result = categories.map((cat) => ({
    ...cat,
    items: (items || [])
      .filter((item) => item.category_id === cat.id)
      .map((item) => ({
        ...item,
        levels: (levels || []).filter((lvl) => lvl.item_id === item.id),
      })),
  }));

  return NextResponse.json(result);
}

// PATCH - update a service level price (admin only)
export async function PATCH(request: NextRequest) {
  const supabase = getClient(true);
  const body = await request.json();
  const { id, price_per_unit, is_active } = body;

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (price_per_unit !== undefined) updates.price_per_unit = price_per_unit;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data, error } = await supabase
    .from("service_levels")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
