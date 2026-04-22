import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClient(useAdmin = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = useAdmin
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

function generateBookingNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SS-${ts}-${rand}`;
}

// POST - create a new booking
export async function POST(request: NextRequest) {
  const supabase = getClient();
  const body = await request.json();

  const {
    customer_name, customer_email, customer_phone,
    zip_code, service_address, preferred_date, preferred_time,
    selected_services, subtotal, discount_amount,
    promo_code_used, total, notes,
  } = body;

  // Validate required fields
  if (!customer_name || !customer_email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      booking_number: generateBookingNumber(),
      customer_name,
      customer_email,
      customer_phone: customer_phone || null,
      zip_code: zip_code || null,
      service_address: service_address || null,
      preferred_date: preferred_date || null,
      preferred_time: preferred_time || null,
      selected_services,
      subtotal,
      discount_amount: discount_amount || 0,
      promo_code_used: promo_code_used || null,
      total,
      notes: notes || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Increment promo code usage if applied
  if (promo_code_used) {
    await supabase.rpc("increment_promo_usage", { code_val: promo_code_used });
  }

  return NextResponse.json(data, { status: 201 });
}

// GET - list all bookings (admin only)
export async function GET(request: NextRequest) {
  const supabase = getClient(true);
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("bookings")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bookings: data, total: count, page, limit });
}
