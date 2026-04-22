"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { PromoCode } from "@/lib/types";
import { Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const EMPTY_FORM = {
  code: "",
  description: "",
  discount_type: "percentage" as "percentage" | "fixed",
  discount_value: 10,
  min_order: 0,
  expires_at: "",
};

export default function PromoPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/promo");
    if (res.ok) setPromos(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!form.code || !form.discount_value) {
      toast.error("Code and discount value are required");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/promo", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        expires_at: form.expires_at || null,
      }),
    });
    if (res.ok) {
      toast.success("Promo code created!");
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } else {
      const d = await res.json();
      toast.error(d.error || "Failed to create");
    }
    setSaving(false);
  };

  const handleToggle = async (promo: PromoCode) => {
    await fetch("/api/promo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: promo.id, is_active: !promo.is_active }),
    });
    await load();
    toast.success(`Promo ${!promo.is_active ? "activated" : "deactivated"}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promo code?")) return;
    await fetch("/api/promo", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
    toast.success("Deleted");
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Promo Codes</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage discount codes for customers.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-brand text-white font-bold px-4 py-2 rounded text-sm transition-colors"
        >
          <Plus size={15} /> New Code
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="font-bold text-gray-800 mb-4">New Promo Code</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Code *</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="SAVE20"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#F5A000] uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="20% off any order"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#F5A000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Discount Type</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm({ ...form, discount_type: e.target.value as "percentage" | "fixed" })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#F5A000]"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Discount Value *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#F5A000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Minimum Order ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.min_order}
                onChange={(e) => setForm({ ...form, min_order: parseFloat(e.target.value) })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#F5A000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Expires At (optional)</label>
              <input
                type="datetime-local"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#F5A000]"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="bg-brand text-white font-bold px-5 py-2 rounded text-sm disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Code"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="bg-gray-100 text-gray-700 font-bold px-5 py-2 rounded text-sm hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-400">Loading...</div>
        ) : promos.length === 0 ? (
          <div className="py-16 text-center text-gray-400">No promo codes yet. Create one above!</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-bold">Code</th>
                <th className="px-4 py-3 text-left font-bold">Discount</th>
                <th className="px-4 py-3 text-left font-bold">Min Order</th>
                <th className="px-4 py-3 text-left font-bold">Usage</th>
                <th className="px-4 py-3 text-left font-bold">Status</th>
                <th className="px-4 py-3 text-left font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((p) => (
                <tr key={p.id} className="border-b border-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-gray-800">{p.code}</span>
                    {p.description && <div className="text-xs text-gray-400">{p.description}</div>}
                  </td>
                  <td className="px-4 py-3 font-bold text-[#F5A000]">
                    {p.discount_type === "percentage"
                      ? `${p.discount_value}%`
                      : `$${p.discount_value}`}
                  </td>
                  <td className="px-4 py-3 text-gray-600">${p.min_order}</td>
                  <td className="px-4 py-3 text-gray-600">{p.usage_count}×</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(p)} className="flex items-center gap-1.5 text-xs">
                      {p.is_active ? (
                        <><ToggleRight size={18} className="text-[#F5A000]" /><span className="text-green-600 font-bold">Active</span></>
                      ) : (
                        <><ToggleLeft size={18} className="text-gray-400" /><span className="text-gray-400">Inactive</span></>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
