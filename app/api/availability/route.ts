import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function addDaysToStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00"); // noon avoids any DST edge
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// GET - fetch available slots for a 14-day window (public-facing, server-side)
// ?week_start=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const supabase = getAdminClient();
  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get("week_start");

  if (!weekStart) {
    return NextResponse.json({ error: "week_start is required" }, { status: 400 });
  }

  const endDate = addDaysToStr(weekStart, 13);

  // Fetch admin-marked available slots
  const { data: availableSlots, error } = await supabase
    .from("availability_slots")
    .select("date, time_window")
    .gte("date", weekStart)
    .lte("date", endDate)
    .eq("is_available", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!availableSlots || availableSlots.length === 0) {
    return NextResponse.json({ slots: [] });
  }

  // Only admin-confirmed bookings block a slot for other users
  const { data: confirmedBookings } = await supabase
    .from("bookings")
    .select("preferred_date, preferred_time")
    .gte("preferred_date", weekStart)
    .lte("preferred_date", endDate)
    .eq("status", "confirmed");

  const confirmedSet = new Set<string>(
    (confirmedBookings || []).map(
      (b: { preferred_date: string; preferred_time: string }) =>
        `${b.preferred_date}|${b.preferred_time}`
    )
  );

  // Remove slots that have a confirmed booking
  const slots = availableSlots.filter(
    (s) => !confirmedSet.has(`${s.date}|${s.time_window}`)
  );

  return NextResponse.json({ slots });
}
