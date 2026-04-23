import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// PATCH - update booking status and/or payment status (admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getAdminClient();
  const { status, payment_status, notes } = await request.json();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  if (payment_status) updates.payment_status = payment_status;
  if (notes !== undefined) updates.notes = notes;

  const { data, error } = await supabase
    .from("bookings")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// GET - single booking
export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
