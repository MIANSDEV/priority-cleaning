"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { Special } from "@/lib/types";
import { Plus, Trash2, ToggleLeft, ToggleRight, GripVertical } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const EMPTY_FORM = {
  title: "",
  description: "",
  badge_text: "SPECIAL",
  promo_code: "",
  display_order: 0,
};

export default function SpecialsPage() {
  const [specials, setSpecials] = useState<Special[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    // Get all specials including inactive for admin
    const res = await fetch("/api/specials");
    if (res.ok) setSpecials(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!form.title) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/specials", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        promo_code: form.promo_code || null,
      }),
    });
    if (res.ok) {
      toast.success("Special created!");
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } else {
      toast.error("Failed to create special");
    }
    setSaving(false);
  };

  const handleToggle = async (special: Special) => {
    await fetch("/api/specials", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: special.id, is_active: !special.is_active }),
    });
    await load();
    toast.success(`Special ${!special.is_active ? "activated" : "deactivated"}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this special?")) return;
    await fetch("/api/specials", {
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
          <h1 className="text-2xl font-bold text-gray-800">Online Specials</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the promotional banners shown in the quote builder sidebar.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#F5A000] hover:bg-[#D48A00] text-white font-bold px-4 py-2 rounded text-sm transition-colors"
        >
          <Plus size={15} /> Add Special
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="font-bold text-gray-800 mb-4">New Special</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="4 Rooms Carpet Cleaned for $199"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#F5A000]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Short description of the offer"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#F5A000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Badge Text</label>
              <input
                value={form.badge_text}
                onChange={(e) => setForm({ ...form, badge_text: e.target.value })}
                placeholder="SPECIAL"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#F5A000]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                Promo Code (auto-applied when clicked)
              </label>
              <input
                value={form.promo_code}
                onChange={(e) => setForm({ ...form, promo_code: e.target.value.toUpperCase() })}
                placeholder="CARPET4"
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#F5A000] uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Display Order</label>
              <input
                type="number"
                min="0"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) })}
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#F5A000]"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="bg-[#F5A000] hover:bg-[#D48A00] text-white font-bold px-5 py-2 rounded text-sm disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Special"}
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

      {/* List */}
      {loading ? (
        <div className="py-16 text-center text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {specials.map((s) => (
            <div
              key={s.id}
              className={`bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden ${
                !s.is_active ? "opacity-60" : ""
              }`}
            >
              <div className="bg-[#F5A000] text-white text-[10px] font-bold px-3 py-1 flex items-center gap-1">
                <GripVertical size={10} />
                {s.badge_text}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-800 text-sm">{s.title}</h3>
                {s.description && <p className="text-xs text-gray-500 mt-1">{s.description}</p>}
                {s.promo_code && (
                  <div className="mt-2 text-xs">
                    <span className="text-gray-400">Promo: </span>
                    <span className="font-mono font-bold text-[#F5A000]">{s.promo_code}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleToggle(s)}
                    className="flex items-center gap-1.5 text-xs flex-1"
                  >
                    {s.is_active ? (
                      <><ToggleRight size={18} className="text-[#F5A000]" /><span className="text-green-600 font-bold">Active</span></>
                    ) : (
                      <><ToggleLeft size={18} className="text-gray-400" /><span className="text-gray-400">Inactive</span></>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-1.5 rounded bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {specials.length === 0 && (
            <div className="col-span-2 py-16 text-center text-gray-400">
              No specials yet. Add one above!
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
