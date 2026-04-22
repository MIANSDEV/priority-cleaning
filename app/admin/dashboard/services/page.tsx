"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import { useEffect, useState } from "react";
import { ServiceCategory } from "@/lib/types";
import { Save, ToggleLeft, ToggleRight } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function ServicesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});

  const load = async () => {
    setLoading(true);
    // Fetch ALL categories (including inactive) for admin
    const res = await fetch("/api/services");
    if (res.ok) {
      const data: ServiceCategory[] = await res.json();
      setCategories(data);
      // Initialize prices map
      const p: Record<string, number> = {};
      data.forEach((cat) =>
        cat.items.forEach((item) =>
          item.levels.forEach((lvl) => {
            p[lvl.id] = lvl.price_per_unit;
          })
        )
      );
      setPrices(p);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handlePriceChange = (levelId: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) setPrices((prev) => ({ ...prev, [levelId]: num }));
  };

  const handleSavePrice = async (levelId: string) => {
    setSaving(levelId);
    const res = await fetch("/api/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: levelId, price_per_unit: prices[levelId] }),
    });
    if (res.ok) {
      toast.success("Price updated!");
    } else {
      toast.error("Failed to update price");
    }
    setSaving(null);
  };

  const handleToggleCategory = async (categoryId: string, current: boolean) => {
    const res = await fetch("/api/services/category", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: categoryId, is_active: !current }),
    });
    if (res.ok) {
      setCategories((prev) =>
        prev.map((c) => (c.id === categoryId ? { ...c, is_active: !current } : c))
      );
      toast.success(`Category ${!current ? "enabled" : "disabled"}`);
    }
  };

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Services & Pricing</h1>
      <p className="text-sm text-gray-500 mb-6">
        Edit prices and toggle service categories on/off. Changes apply immediately.
      </p>

      {loading ? (
        <div className="py-16 text-center text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden ${
                !cat.is_active ? "opacity-60" : ""
              }`}
            >
              {/* Category header */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#1A1A1A]">
                <span className="text-white font-bold text-sm">{cat.name}</span>
                <button
                  onClick={() => handleToggleCategory(cat.id, cat.is_active)}
                  className="flex items-center gap-2 text-xs text-gray-300 hover:text-white transition-colors"
                >
                  {cat.is_active ? (
                    <><ToggleRight size={20} className="text-[#F5A000]" /> Enabled</>
                  ) : (
                    <><ToggleLeft size={20} className="text-gray-500" /> Disabled</>
                  )}
                </button>
              </div>

              {/* Items + levels */}
              <div className="divide-y divide-gray-100">
                {cat.items.map((item) => (
                  <div key={item.id} className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-700 mb-2">{item.name}</div>
                    <div className="flex flex-wrap gap-2">
                      {item.levels.map((level) => (
                        <div
                          key={level.id}
                          className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded px-2 py-1.5"
                        >
                          <span className="text-[11px] font-bold text-gray-500 w-20 truncate">{level.name}</span>
                          <span className="text-xs text-gray-400">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={prices[level.id] ?? level.price_per_unit}
                            onChange={(e) => handlePriceChange(level.id, e.target.value)}
                            className="w-16 text-sm border border-gray-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-[#F5A000]"
                          />
                          <button
                            onClick={() => handleSavePrice(level.id)}
                            disabled={saving === level.id}
                            className="p-1 bg-brand rounded text-white disabled:opacity-50 transition-colors"
                            title="Save price"
                          >
                            <Save size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
