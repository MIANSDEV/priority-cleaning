"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { Booking } from "@/lib/types";
import { RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  stripe: "Online (Stripe)",
  cash: "Cash",
  card: "Card (POS)",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  unpaid: "bg-gray-100 text-gray-600",
  pending: "bg-yellow-100 text-yellow-700",
};

const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"];
const PAYMENT_STATUSES = ["paid", "unpaid", "pending"];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [updatingPaymentId, setUpdatingPaymentId] = useState<string | null>(null);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const url = filter ? `/api/bookings?status=${filter}` : "/api/bookings";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      } else {
        toast.error("Failed to load bookings");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingBookingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success("Booking status updated");
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: status as Booking["status"] } : b))
        );
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const handlePaymentStatusChange = async (id: string, payment_status: string) => {
    setUpdatingPaymentId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status }),
      });
      if (res.ok) {
        toast.success("Payment status updated");
        setBookings((prev) =>
          prev.map((b) =>
            b.id === id ? { ...b, payment_status: payment_status as Booking["payment_status"] } : b
          )
        );
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Failed to update payment status");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setUpdatingPaymentId(null);
    }
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Bookings</h1>
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
        {["", ...BOOKING_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
              filter === s
                ? "bg-brand text-white border-[#F5A000]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#F5A000]"
            }`}
          >
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center text-gray-400">No bookings found</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {bookings.map((b) => (
              <div key={b.id}>
                {/* Row header */}
                <div
                  className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-gray-500">{b.booking_number}</span>
                      <span className="font-bold text-sm text-gray-800">{b.customer_name}</span>
                      <span className="text-xs text-gray-400 hidden sm:inline">{b.customer_email}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(b.created_at).toLocaleString()} •{" "}
                      {b.preferred_date
                        ? `Preferred: ${new Date(b.preferred_date).toLocaleDateString()}`
                        : "No date preference"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <span className="font-bold text-gray-800 text-sm">${b.total?.toFixed(2)}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] || ""}`}>
                      {b.status?.toUpperCase()}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full hidden sm:inline ${PAYMENT_STATUS_COLORS[b.payment_status] || "bg-gray-100 text-gray-600"}`}>
                      {(b.payment_status || "unpaid").toUpperCase()}
                    </span>
                    {expandedId === b.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === b.id && (
                  <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">

                      {/* Contact + Payment */}
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs font-bold text-gray-500 uppercase mb-1.5">Contact</div>
                          <div className="text-sm space-y-1 text-gray-700">
                            <div><span className="text-gray-400">Phone:</span> {b.customer_phone || "—"}</div>
                            <div><span className="text-gray-400">Zip:</span> {b.zip_code || "—"}</div>
                            <div><span className="text-gray-400">Address:</span> {b.service_address || "—"}</div>
                            <div><span className="text-gray-400">Time Pref:</span> {b.preferred_time || "—"}</div>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-gray-500 uppercase mb-1.5">Payment Method</div>
                          <div className="text-sm text-gray-700 mb-2">
                            {PAYMENT_METHOD_LABELS[b.payment_method] || b.payment_method || "—"}
                          </div>
                          <div className="text-xs font-bold text-gray-500 uppercase mb-1.5">Payment Status</div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {PAYMENT_STATUSES.map((ps) => (
                              <button
                                key={ps}
                                disabled={b.payment_status === ps || updatingPaymentId === b.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePaymentStatusChange(b.id, ps);
                                }}
                                className={`text-[11px] font-bold px-3 py-1.5 rounded border transition-all ${
                                  b.payment_status === ps
                                    ? `${PAYMENT_STATUS_COLORS[ps]} border-transparent cursor-default`
                                    : "bg-white border-gray-200 text-gray-600 hover:border-[#F5A000] hover:text-[#F5A000] disabled:opacity-40"
                                }`}
                              >
                                {updatingPaymentId === b.id && b.payment_status !== ps
                                  ? "…"
                                  : ps.charAt(0).toUpperCase() + ps.slice(1)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Services */}
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1.5">Services Requested</div>
                        <div className="space-y-1 max-h-36 overflow-y-auto">
                          {(b.selected_services || []).map((s, i) => (
                            <div key={i} className="flex justify-between text-xs">
                              <span className="text-gray-600">
                                {s.item_name}
                                {!s.is_checkbox && ` × ${s.quantity}`}
                                {s.level_name && ` (${s.level_name})`}
                              </span>
                              <span className="font-bold ml-2">${s.subtotal?.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        {b.promo_code_used && (
                          <div className="text-xs text-green-600 mt-1">
                            Promo: {b.promo_code_used} (−${b.discount_amount?.toFixed(2)})
                          </div>
                        )}
                        {b.notes && (
                          <div className="text-xs text-gray-500 mt-2 italic">Notes: {b.notes}</div>
                        )}
                      </div>
                    </div>

                    {/* Booking status */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200 flex-wrap">
                      <span className="text-xs font-bold text-gray-500">Booking Status:</span>
                      {BOOKING_STATUSES.map((s) => (
                        <button
                          key={s}
                          disabled={b.status === s || updatingBookingId === b.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(b.id, s);
                          }}
                          className={`text-[11px] font-bold px-3 py-1.5 rounded border transition-all ${
                            b.status === s
                              ? `${STATUS_COLORS[s]} border-transparent cursor-default`
                              : "bg-white border-gray-200 text-gray-600 hover:border-[#F5A000] hover:text-[#F5A000] disabled:opacity-40"
                          }`}
                        >
                          {updatingBookingId === b.id && b.status !== s
                            ? "…"
                            : s.charAt(0).toUpperCase() + s.slice(1)}
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
