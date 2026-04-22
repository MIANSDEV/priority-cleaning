import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient(useAdmin = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = useAdmin
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// POST - validate a promo code
export async function POST(request: NextRequest) {
  const supabase = getClient();
  const { code, subtotal } = await request.json();

  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });

  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Invalid or expired promo code" }, { status: 404 });
  }

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "This promo code has expired" }, { status: 400 });
  }

  // Check minimum order
  if (subtotal < data.min_order) {
    return NextResponse.json(
      { error: `Minimum order of $${data.min_order.toFixed(2)} required for this code` },
      { status: 400 }
    );
  }

  // Calculate discount
  let discount = 0;
  if (data.discount_type === "percentage") {
    discount = (subtotal * data.discount_value) / 100;
  } else {
    discount = data.discount_value;
  }

  return NextResponse.json({ ...data, calculated_discount: discount });
}

// GET - all promo codes (admin)
export async function GET() {
  const supabase = getClient(true);
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PUT - create promo code (admin)
export async function PUT(request: NextRequest) {
  const supabase = getClient(true);
  const body = await request.json();

  const { data, error } = await supabase
    .from("promo_codes")
    .insert({ ...body, code: body.code.toUpperCase() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH - update promo code (admin)
export async function PATCH(request: NextRequest) {
  const supabase = getClient(true);
  const { id, ...updates } = await request.json();

  const { data, error } = await supabase
    .from("promo_codes")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE - delete promo code (admin)
export async function DELETE(request: NextRequest) {
  const supabase = getClient(true);
  const { id } = await request.json();

  const { error } = await supabase.from("promo_codes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
