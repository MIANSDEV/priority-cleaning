"use client";

import { useState } from "react";
import { ServiceCategory, ServiceItem, ServiceLevel, SelectedService } from "@/lib/types";
import { Plus, Minus, CheckSquare, Square, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  category: ServiceCategory;
  selected: SelectedService[];
  onUpdate: (updated: SelectedService[]) => void;
}

export default function ServiceSection({ category, selected, onUpdate }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const getDefaultLevel = (item: ServiceItem): ServiceLevel | null =>
    item.levels.filter((l) => l.is_active)[0] || null;

  const getSelection = (itemId: string, levelId: string): SelectedService | undefined =>
    selected.find((s) => s.item_id === itemId && s.level_id === levelId);

  const getItemSelection = (itemId: string): SelectedService | undefined =>
    selected.find((s) => s.item_id === itemId);

  const handleQuantity = (item: ServiceItem, level: ServiceLevel, delta: number) => {
    const current = getSelection(item.id, level.id);

    if (!current && delta > 0) {
      onUpdate([
        ...selected,
        {
          category_id: category.id,
          category_name: category.name,
          item_id: item.id,
          item_name: item.name,
          quantity: 1,
          level_id: level.id,
          level_name: level.name,
          price_per_unit: level.price_per_unit,
          subtotal: level.price_per_unit,
          is_checkbox: false,
        },
      ]);
      return;
    }

    if (!current) return;

    const newQty = Math.max(0, Math.min(item.max_quantity, current.quantity + delta));

    if (newQty === 0) {
      onUpdate(selected.filter((s) => !(s.item_id === item.id && s.level_id === level.id)));
    } else {
      onUpdate(
        selected.map((s) =>
          s.item_id === item.id && s.level_id === level.id
            ? { ...s, quantity: newQty, subtotal: s.price_per_unit * newQty }
            : s
        )
      );
    }
  };

  const handleCheckbox = (item: ServiceItem) => {
    const current = getItemSelection(item.id);
    if (current) {
      onUpdate(selected.filter((s) => s.item_id !== item.id));
    } else {
      const level = getDefaultLevel(item);
      if (!level) return;
      onUpdate([
        ...selected,
        {
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
        },
      ]);
    }
  };

  const activeLevelHeaders = category.items[0]?.levels.filter((l) => l.is_active) || [];
  const isCheckboxOnly = category.items.every((i) => i.is_checkbox);
  const hasMultipleLevels = activeLevelHeaders.length > 1;
  // min width so level columns never get crushed: 120px name + 96px per level + gaps
  const minTableWidth = hasMultipleLevels
    ? 120 + activeLevelHeaders.length * 100
    : undefined;

  return (
    <div className="mb-4 border border-gray-200 rounded overflow-hidden shadow-sm">
      {/* Section header */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`w-full px-4 py-2.5 flex items-center justify-between transition-colors ${
          isOpen ? "bg-[#1A1A1A] text-white" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
        }`}
      >
        <span className="font-bold text-sm tracking-wide">{category.name}</span>
        <span className="bg-brand text-white p-1 rounded flex items-center justify-center flex-shrink-0">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {isOpen && (
        /* Horizontal scroll wrapper — keeps columns aligned on narrow screens */
        <div className="overflow-x-auto">
          <div style={minTableWidth ? { minWidth: minTableWidth } : undefined}>
            {/* Column headers */}
            {!isCheckboxOnly && (
              <div className="bg-gray-50 border-b border-gray-200 flex items-center">
                <div className="flex-1 px-3 py-2 text-[11px] font-bold text-gray-500 uppercase tracking-wide" />
                <div className="flex items-center gap-1 pr-3">
                  {activeLevelHeaders.map((l) => (
                    <div
                      key={l.id}
                      className="w-24 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wide py-2"
                    >
                      {l.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items */}
            <div className="divide-y divide-gray-100 bg-white">
              {category.items.map((item) => {
                const itemActiveLevels = item.levels.filter((l) => l.is_active);
                const itemSel = getItemSelection(item.id);

                if (item.is_checkbox) {
                  return (
                    <div key={item.id} className="px-4 py-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <button onClick={() => handleCheckbox(item)} className="mt-0.5 flex-shrink-0 text-[#F5A000]">
                          {itemSel ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-400" />}
                        </button>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{item.name}</p>
                          {itemSel && itemActiveLevels[0]?.price_per_unit > 0 && (
                            <p className="text-xs text-[#F5A000] font-bold mt-0.5">
                              +${itemActiveLevels[0].price_per_unit.toFixed(2)}
                            </p>
                          )}
                          {itemSel && itemActiveLevels[0]?.price_per_unit === 0 && (
                            <p className="text-xs text-green-600 font-bold mt-0.5">Free Estimate</p>
                          )}
                        </div>
                      </label>
                    </div>
                  );
                }

                const rowHasSelection = itemActiveLevels.some((l) => getSelection(item.id, l.id));

                return (
                  <div
                    key={item.id}
                    className={`flex items-center px-3 py-2.5 transition-colors ${
                      rowHasSelection ? "bg-orange-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex-1 text-sm text-gray-700 pr-2 min-w-[80px]">{item.name}</div>

                    {hasMultipleLevels ? (
                      <div className="flex items-center gap-1">
                        {itemActiveLevels.map((level) => {
                          const sel = getSelection(item.id, level.id);
                          return (
                            <div key={level.id} className="flex items-center gap-0.5 w-24 justify-center">
                              <button
                                onClick={() => handleQuantity(item, level, -1)}
                                disabled={!sel}
                                className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#F5A000] hover:text-[#F5A000] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="w-6 text-center text-sm font-bold text-gray-700">
                                {sel?.quantity ?? 0}
                              </span>
                              <button
                                onClick={() => handleQuantity(item, level, 1)}
                                disabled={sel ? sel.quantity >= item.max_quantity : false}
                                className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#F5A000] hover:text-[#F5A000] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <Plus size={10} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 mr-2">
                        {itemActiveLevels[0] && (() => {
                          const level = itemActiveLevels[0];
                          const sel = getSelection(item.id, level.id);
                          return (
                            <>
                              <button
                                onClick={() => handleQuantity(item, level, -1)}
                                disabled={!sel}
                                className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#F5A000] hover:text-[#F5A000] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="w-7 text-center text-sm font-bold text-gray-700">
                                {sel?.quantity ?? 0}
                              </span>
                              <button
                                onClick={() => handleQuantity(item, level, 1)}
                                disabled={sel ? sel.quantity >= item.max_quantity : false}
                                className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:border-[#F5A000] hover:text-[#F5A000] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <Plus size={11} />
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    )}
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
        </div>
      )}
    </div>
  );
}
