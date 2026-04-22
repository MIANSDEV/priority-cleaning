import AdminLayout from "@/components/admin/AdminLayout";
import { createAdminClient } from "@/lib/supabase-admin";
import { CalendarCheck, DollarSign, Clock, CheckCircle } from "lucide-react";

async function getStats() {
  const supabase = createAdminClient();

  const [totalRes, pendingRes, confirmedRes, revenueRes] = await Promise.all([
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
    supabase.from("bookings").select("total"),
  ]);

  const totalRevenue = (revenueRes.data || []).reduce((sum, b) => sum + (b.total || 0), 0);

  return {
    total: totalRes.count || 0,
    pending: pendingRes.count || 0,
    confirmed: confirmedRes.count || 0,
    revenue: totalRevenue,
  };
}

async function getRecentBookings() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("bookings")
    .select("id, booking_number, customer_name, customer_email, total, status, created_at, preferred_date")
    .order("created_at", { ascending: false })
    .limit(5);
  return data || [];
}

export default async function AdminDashboard() {
  const [stats, recentBookings] = await Promise.all([getStats(), getRecentBookings()]);

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Bookings", value: stats.total, icon: CalendarCheck, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Confirmed", value: stats.confirmed, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Revenue", value: `$${stats.revenue.toFixed(0)}`, icon: DollarSign, color: "text-orange-600", bg: "bg-orange-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
              <div className={`w-8 h-8 ${bg} rounded-full flex items-center justify-center`}>
                <Icon size={14} className={color} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Recent Bookings</h2>
          <a href="/admin/dashboard/bookings" className="text-xs text-[#F5A000] hover:underline">
            View all →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-bold">Booking #</th>
                <th className="px-4 py-3 text-left font-bold">Customer</th>
                <th className="px-4 py-3 text-left font-bold">Date</th>
                <th className="px-4 py-3 text-left font-bold">Total</th>
                <th className="px-4 py-3 text-left font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.booking_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{b.customer_name}</div>
                    <div className="text-xs text-gray-400">{b.customer_email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {b.preferred_date
                      ? new Date(b.preferred_date).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-800">${b.total?.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] || ""}`}>
                      {b.status?.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
              {recentBookings.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No bookings yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
