import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();

  const [totalRes, pendingRes, confirmedRes, revenueRes, recentRes] = await Promise.all([
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
    supabase.from("bookings").select("total"),
    supabase
      .from("bookings")
      .select("id, booking_number, customer_name, customer_email, total, status, created_at, preferred_date")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalRevenue = (revenueRes.data || []).reduce(
    (sum: number, b: { total: number }) => sum + (b.total || 0),
    0
  );

  return NextResponse.json({
    total: totalRes.count ?? 0,
    pending: pendingRes.count ?? 0,
    confirmed: confirmedRes.count ?? 0,
    revenue: totalRevenue,
    recentBookings: recentRes.data || [],
  });
}
