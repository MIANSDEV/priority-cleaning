"use client";

import { ServiceCategory, ServiceItem, ServiceLevel, SelectedService } from "@/lib/types";
import { Plus, Minus, CheckSquare, Square } from "lucide-react";

interface Props {
  category: ServiceCategory;
  selected: SelectedService[];
  onUpdate: (updated: SelectedService[]) => void;
}

export default function ServiceSection({ category, selected, onUpdate }: Props) {
  // Get first active level for an item (default selection)
  const getDefaultLevel = (item: ServiceItem): ServiceLevel | null =>
    item.levels.filter((l) => l.is_active)[0] || null;

  // Find current selection for an item
  const getSelection = (itemId: string): SelectedService | undefined =>
    selected.find((s) => s.item_id === itemId);

  // Handle quantity +/-
  const handleQuantity = (item: ServiceItem, delta: number) => {
    const current = getSelection(item.id);
    const level = current
      ? item.levels.find((l) => l.id === current.level_id) || getDefaultLevel(item)
      : getDefaultLevel(item);

    if (!level) return;

    if (!current && delta > 0) {
      // Add new selection
      const newEntry: SelectedService = {
        category_id: category.id,
        category_name: category.name,
        item_id: item.id,
        item_name: item.name,
        quantity: 1,
        level_id: level.id,
        level_name: level.name,
        price_per_unit: level.price_per_unit,
        subtotal: level.price_per_unit,
        is_checkbox: item.is_checkbox,
      };
      onUpdate([...selected, newEntry]);
      return;
    }

    if (!current) return;

    const newQty = Math.max(0, Math.min(item.max_quantity, current.quantity + delta));

    if (newQty === 0) {
      onUpdate(selected.filter((s) => s.item_id !== item.id));
    } else {
      onUpdate(
        selected.map((s) =>
          s.item_id === item.id
            ? { ...s, quantity: newQty, subtotal: s.price_per_unit * newQty }
            : s
        )
      );
    }
  };

  // Handle level change
  const handleLevelChange = (item: ServiceItem, levelId: string) => {
    const level = item.levels.find((l) => l.id === levelId);
    if (!level) return;

    const current = getSelection(item.id);
    if (current) {
      onUpdate(
        selected.map((s) =>
          s.item_id === item.id
            ? {
                ...s,
                level_id: level.id,
                level_name: level.name,
                price_per_unit: level.price_per_unit,
                subtotal: level.price_per_unit * s.quantity,
              }
            : s
        )
      );
    } else {
      // Auto-select quantity 1 when a level is chosen
      const newEntry: SelectedService = {
        category_id: category.id,
        category_name: category.name,
        item_id: item.id,
        item_name: item.name,
        quantity: 1,
        level_id: level.id,
        level_name: level.name,
        price_per_unit: level.price_per_unit,
        subtotal: level.price_per_unit,
        is_checkbox: item.is_checkbox,
      };
      onUpdate([...selected, newEntry]);
    }
  };

  // Handle checkbox toggle
  const handleCheckbox = (item: ServiceItem) => {
    const current = getSelection(item.id);
    if (current) {
      onUpdate(selected.filter((s) => s.item_id !== item.id));
    } else {
      const level = getDefaultLevel(item);
      if (!level) return;
      const newEntry: SelectedService = {
        category_id: category.id,
        category_name: category.name,
        item_id: item.id,
        item_name: item.name,
        quantity: 1,
        level_id: level.id,
        level_name: level.name,
        price_per_unit: level.price_per_unit,
        subtotal: level.price_per_unit,
        is_checkbox: true,
      };
      onUpdate([...selected, newEntry]);
    }
  };

  // Column headers for this category (from first item's levels)
  const columnHeaders =
    category.items[0]?.levels.filter((l) => l.is_active).map((l) => l.name) || [];
  const isCheckboxOnly = category.items.every((i) => i.is_checkbox);

  return (
    <div className="mb-4 border border-gray-200 rounded overflow-hidden shadow-sm">
      {/* Section header */}
      <div className="bg-[#1A1A1A] text-white px-4 py-2.5 flex items-center justify-between">
        <span className="font-bold text-sm tracking-wide">{category.name}</span>
        <span className="bg-[#F5A000] text-white text-[10px] font-bold px-2 py-0.5 rounded">
          {category.items.filter((i) => getSelection(i.id)).length > 0
            ? `${category.items.filter((i) => getSelection(i.id)).length} selected`
            : "SELECT"}
        </span>
      </div>

      {/* Column headers (for non-checkbox categories) */}
      {!isCheckboxOnly && columnHeaders.length > 1 && (
        <div className="bg-gray-50 border-b border-gray-200 flex">
          <div className="flex-1 px-3 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            Service
          </div>
          <div className="flex items-center gap-1 pr-3">
            {columnHeaders.map((h) => (
              <div
                key={h}
                className="w-20 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wide"
              >
                {h}
              </div>
            ))}
          </div>
        </div>
      )}
      {!isCheckboxOnly && columnHeaders.length === 1 && (
        <div className="bg-gray-50 border-b border-gray-200 flex">
          <div className="flex-1 px-3 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
            Service
          </div>
          <div className="pr-3 flex items-center">
            <div className="w-28 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wide">
              {columnHeaders[0]}
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="divide-y divide-gray-100 bg-white">
        {category.items.map((item) => {
          const sel = getSelection(item.id);
          const activeLevels = item.levels.filter((l) => l.is_active);

          if (item.is_checkbox) {
            return (
              <div key={item.id} className="px-4 py-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <button
                    onClick={() => handleCheckbox(item)}
                    className="mt-0.5 flex-shrink-0 text-[#F5A000]"
                  >
                    {sel ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-400" />}
                  </button>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{item.name}</p>
                    {sel && activeLevels[0]?.price_per_unit > 0 && (
                      <p className="text-xs text-[#F5A000] font-bold mt-0.5">
                        +${activeLevels[0].price_per_unit.toFixed(2)}
                      </p>
                    )}
                    {sel && activeLevels[0]?.price_per_unit === 0 && (
                      <p className="text-xs text-green-600 font-bold mt-0.5">Free Estimate</p>
                    )}
                  </div>
                </label>
              </div>
            );
          }

          return (
            <div
              key={item.id}
              className={`flex items-center px-3 py-2.5 ${sel ? "bg-orange-50" : "hover:bg-gray-50"} transition-colors`}
            >
              {/* Name */}
              <div className="flex-1 text-sm text-gray-700 pr-2">{item.name}</div>

              {/* Quantity controls */}
              <div className="flex items-center gap-1 mr-2">
                <button
                  onClick={() => handleQuantity(item, -1)}
                  disabled={!sel}
                  className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#F5A000] hover:text-[#F5A000] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus size={10} />
                </button>
                <span className="w-6 text-center text-sm font-bold text-gray-700">
                  {sel?.quantity ?? 0}
                </span>
                <button
                  onClick={() => handleQuantity(item, 1)}
                  disabled={sel ? sel.quantity >= item.max_quantity : false}
                  className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#F5A000] hover:text-[#F5A000] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={10} />
                </button>
              </div>

              {/* Level radio buttons */}
              <div className="flex items-center gap-1">
                {activeLevels.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => handleLevelChange(item, level.id)}
                    title={`${level.label} - $${level.price_per_unit.toFixed(2)} per ${item.unit_type}`}
                    className={`w-20 text-center py-1 px-1 rounded text-[10px] font-bold border transition-all
                      ${
                        sel?.level_id === level.id
                          ? "bg-[#F5A000] text-white border-[#F5A000]"
                          : "bg-white text-gray-500 border-gray-300 hover:border-[#F5A000] hover:text-[#F5A000]"
                      }
                    `}
                  >
                    ${level.price_per_unit.toFixed(0)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pricing note */}
      <div className="bg-gray-50 border-t border-gray-100 px-4 py-2 text-[10px] text-gray-400">
        Prices shown are per {category.items[0]?.unit_type || "item"} starting rates.
        Final pricing confirmed at time of service.
      </div>
    </div>
  );
}
