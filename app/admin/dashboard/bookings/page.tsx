"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { Booking } from "@/lib/types";
import { RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadBookings = async () => {
    setLoading(true);
    const url = filter ? `/api/bookings?status=${filter}` : "/api/bookings";
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setBookings(data.bookings || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBookings();
  }, [filter]);

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id);
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadBookings();
    setUpdatingId(null);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Bookings</h1>
        <button
          onClick={loadBookings}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 bg-white border border-gray-200 rounded px-3 py-1.5 shadow-sm"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all
              ${filter === s
                ? "bg-brand text-white border-[#F5A000]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#F5A000]"
              }
            `}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center text-gray-400">No bookings found</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {bookings.map((b) => (
              <div key={b.id}>
                {/* Row */}
                <div
                  className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs text-gray-500">{b.booking_number}</span>
                      <span className="font-bold text-sm text-gray-800">{b.customer_name}</span>
                      <span className="text-xs text-gray-400">{b.customer_email}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(b.created_at).toLocaleString()} •{" "}
                      {b.preferred_date
                        ? `Preferred: ${new Date(b.preferred_date).toLocaleDateString()}`
                        : "No date preference"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <span className="font-bold text-gray-800">${b.total?.toFixed(2)}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] || ""}`}>
                      {b.status?.toUpperCase()}
                    </span>
                    {expandedId === b.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === b.id && (
                  <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
                      {/* Contact */}
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Contact</div>
                        <div className="text-sm space-y-1">
                          <div><span className="text-gray-500">Phone:</span> {b.customer_phone || "—"}</div>
                          <div><span className="text-gray-500">Zip:</span> {b.zip_code || "—"}</div>
                          <div><span className="text-gray-500">Address:</span> {b.service_address || "—"}</div>
                          <div><span className="text-gray-500">Time Pref:</span> {b.preferred_time || "—"}</div>
                        </div>
                      </div>
                      {/* Services */}
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">Services Requested</div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {(b.selected_services || []).map((s, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span className="text-gray-600">{s.item_name} × {s.quantity} ({s.level_name})</span>
                              <span className="font-bold">${s.subtotal?.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        {b.promo_code_used && (
                          <div className="text-xs text-green-600 mt-1">Promo: {b.promo_code_used} (-${b.discount_amount?.toFixed(2)})</div>
                        )}
                        {b.notes && (
                          <div className="text-xs text-gray-500 mt-2 italic">Notes: {b.notes}</div>
                        )}
                      </div>
                    </div>
                    {/* Status change */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                      <span className="text-xs font-bold text-gray-500">Update Status:</span>
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          disabled={b.status === s || updatingId === b.id}
                          onClick={() => handleStatusChange(b.id, s)}
                          className={`text-[11px] font-bold px-2 py-1 rounded border transition-all
                            ${b.status === s
                              ? `${STATUS_COLORS[s]} border-transparent cursor-default`
                              : "bg-white border-gray-200 text-gray-600 hover:border-[#F5A000] hover:text-[#F5A000]"
                            }
                          `}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
