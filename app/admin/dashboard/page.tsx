"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import { CalendarCheck, DollarSign, Clock, CheckCircle, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Booking } from "@/lib/types";

interface Stats {
  total: number;
  pending: number;
  confirmed: number;
  revenue: number;
  recentBookings: Booking[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      // Reuse the existing /api/bookings endpoint (works on Vercel + locally)
      const [allRes, pendingRes, confirmedRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/bookings?status=pending"),
        fetch("/api/bookings?status=confirmed"),
      ]);

      const [allData, pendingData, confirmedData] = await Promise.all([
        allRes.json(),
        pendingRes.json(),
        confirmedRes.json(),
      ]);

      const bookings: Booking[] = allData.bookings || [];
      const revenue = bookings.reduce((sum, b) => sum + (b.total || 0), 0);

      setStats({
        total: allData.total ?? bookings.length,
        pending: pendingData.total ?? 0,
        confirmed: confirmedData.total ?? 0,
        revenue,
        recentBookings: bookings.slice(0, 5),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const statCards = [
    {
      label: "Total Bookings",
      value: stats?.total ?? "—",
      icon: CalendarCheck,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pending",
      value: stats?.pending ?? "—",
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "Confirmed",
      value: stats?.confirmed ?? "—",
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Total Revenue",
      value: stats ? `$${stats.revenue.toFixed(0)}` : "—",
      icon: DollarSign,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={loadStats}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 bg-white border border-gray-200 rounded px-3 py-1.5 shadow-sm disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-lg shadow-sm p-3 sm:p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wide leading-tight pr-1">
                {label}
              </span>
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 ${bg} rounded-full flex items-center justify-center flex-shrink-0`}
              >
                <Icon size={13} className={color} />
              </div>
            </div>
            <div
              className={`text-xl sm:text-2xl font-bold ${color} ${
                loading && !stats ? "animate-pulse text-gray-200" : ""
              }`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Recent Bookings</h2>
          <a href="/admin/dashboard/bookings" className="text-xs text-[#F5A000] hover:underline">
            View all →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-bold">Booking #</th>
                <th className="px-4 py-3 text-left font-bold">Customer</th>
                <th className="px-4 py-3 text-left font-bold hidden md:table-cell">Date</th>
                <th className="px-4 py-3 text-left font-bold">Total</th>
                <th className="px-4 py-3 text-left font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && !stats ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (stats?.recentBookings || []).length > 0 ? (
                (stats?.recentBookings || []).map((b) => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.booking_number}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{b.customer_name}</div>
                      <div className="text-xs text-gray-400 hidden sm:block">{b.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">
                      {b.preferred_date ? new Date(b.preferred_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-800">${b.total?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          STATUS_COLORS[b.status] || ""
                        }`}
                      >
                        {b.status?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
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
