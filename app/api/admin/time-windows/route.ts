import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// GET - all time windows including inactive (admin)
export async function GET() {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("time_windows")
    .select("*")
    .order("display_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ windows: data || [] });
}

// POST - create a new time window
export async function POST(request: NextRequest) {
  const supabase = getAdminClient();
  const { label } = await request.json();

  if (!label?.trim()) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("time_windows")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].display_order + 1 : 1;

  const { data, error } = await supabase
    .from("time_windows")
    .insert({ label: label.trim(), display_order: nextOrder, is_active: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH - update a time window by ?id=
// Body: { label?, display_order?, is_active? }
export async function PATCH(request: NextRequest) {
  const supabase = getAdminClient();
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const body = await request.json();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.label !== undefined) updates.label = String(body.label).trim();
  if (body.display_order !== undefined) updates.display_order = Number(body.display_order);
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);

  // Block hiding if active bookings use this window
  if (body.is_active === false) {
    const { data: win } = await supabase
      .from("time_windows")
      .select("label")
      .eq("id", id)
      .single();

    if (win) {
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("preferred_time", win.label)
        .in("status", ["pending", "confirmed"]);

      if ((count ?? 0) > 0) {
        return NextResponse.json(
          { error: `Cannot hide — ${count} active booking(s) use this time window.` },
          { status: 409 }
        );
      }
    }
  }

  const { data, error } = await supabase
    .from("time_windows")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE - delete a time window by ?id=
export async function DELETE(request: NextRequest) {
  const supabase = getAdminClient();
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  // Get label to check bookings
  const { data: win, error: fetchErr } = await supabase
    .from("time_windows")
    .select("label")
    .eq("id", id)
    .single();

  if (fetchErr || !win) {
    return NextResponse.json({ error: "Time window not found" }, { status: 404 });
  }

  // Block delete if active bookings exist
  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("preferred_time", win.label)
    .in("status", ["pending", "confirmed"]);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete — ${count} active booking(s) use this time window. Cancel or complete those bookings first.`,
      },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("time_windows").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
