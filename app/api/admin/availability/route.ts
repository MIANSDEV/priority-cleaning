import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// GET - fetch all slots for a week (admin view, includes unavailable)
// ?week_start=YYYY-MM-DD
// Also purges orphaned time_window rows on each load
export async function GET(request: NextRequest) {
  const supabase = getAdminClient();
  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get("week_start");

  if (!weekStart) {
    return NextResponse.json({ error: "week_start is required" }, { status: 400 });
  }

  // Purge orphaned slots (time_window deleted from time_windows)
  const { data: activeWindows } = await supabase.from("time_windows").select("label");
  const activeLabels = (activeWindows || []).map((w: { label: string }) => w.label);
  if (activeLabels.length > 0) {
    await supabase
      .from("availability_slots")
      .delete()
      .not("time_window", "in", `(${activeLabels.join(",")})`);
  }

  const endDate = addDays(weekStart, 6);

  const { data, error } = await supabase
    .from("availability_slots")
    .select("date, time_window, is_available")
    .gte("date", weekStart)
    .lte("date", endDate);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ slots: data || [] });
}

// POST - upsert availability slots for a week, auto-removes orphaned time_window entries
// Body: { slots: Array<{ date: string, time_window: string, is_available: boolean }> }
export async function POST(request: NextRequest) {
  const supabase = getAdminClient();
  const body = await request.json();
  const { slots } = body;

  if (!Array.isArray(slots) || slots.length === 0) {
    return NextResponse.json({ error: "slots array is required" }, { status: 400 });
  }

  // Remove orphaned slots whose time_window no longer exists in time_windows
  const { data: activeWindows } = await supabase
    .from("time_windows")
    .select("label");
  const activeLabels = (activeWindows || []).map((w: { label: string }) => w.label);
  if (activeLabels.length > 0) {
    // PostgREST "not in" uses the `in` filter negated — pass as tuple string
    await supabase
      .from("availability_slots")
      .delete()
      .not("time_window", "in", `(${activeLabels.join(",")})`);
  }

  const rows = slots.map((s: { date: string; time_window: string; is_available: boolean }) => ({
    date: s.date,
    time_window: s.time_window,
    is_available: s.is_available,
  }));

  const { error } = await supabase
    .from("availability_slots")
    .upsert(rows, { onConflict: "date,time_window" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
