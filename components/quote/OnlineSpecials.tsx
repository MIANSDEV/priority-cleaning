"use client";

import { Special } from "@/lib/types";
import { Tag } from "lucide-react";

interface Props {
  specials: Special[];
  onApply: (promoCode: string) => void;
}

export default function OnlineSpecials({ specials, onApply }: Props) {
  return (
    <div className="w-full">
      <div className="bg-[#1A1A1A] text-white text-center py-2 text-xs font-bold tracking-wider uppercase">
        Online Specials
      </div>
      <div className="space-y-2 mt-2">
        {specials.map((special) => (
          <div
            key={special.id}
            className="border border-gray-200 rounded overflow-hidden bg-white shadow-sm"
          >
            <div className="bg-[#F5A000] text-white text-[10px] font-bold px-2 py-1 flex items-center gap-1">
              <Tag size={10} />
              {special.badge_text || "SPECIAL"}
            </div>
            <div className="p-2">
              <p className="text-xs font-bold text-gray-800 leading-tight">{special.title}</p>
              {special.description && (
                <p className="text-[10px] text-gray-500 mt-0.5">{special.description}</p>
              )}
              {special.promo_code && (
                <button
                  onClick={() => onApply(special.promo_code!)}
                  className="mt-1.5 w-full text-[11px] font-bold bg-[#F5A000] hover:bg-[#D48A00] text-white py-1 px-2 rounded transition-colors"
                >
                  ADD
                </button>
              )}
            </div>
          </div>
        ))}
        {specials.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">No specials available</p>
        )}
      </div>
    </div>
  );
}
