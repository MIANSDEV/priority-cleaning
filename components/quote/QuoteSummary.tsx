"use client";

import { useState } from "react";
import { QuoteState, PromoCode } from "@/lib/types";
import { Tag, ChevronRight, X } from "lucide-react";

interface Props {
  quote: QuoteState;
  promoInput: string;
  setPromoInput: (v: string) => void;
  onApplyPromo: (code: string) => void;
  onRemovePromo: () => void;
  promoError: string;
  promoLoading: boolean;
  onNext: () => void;
  nextLabel?: string;
  showNext?: boolean;
}

export default function QuoteSummary({
  quote,
  promoInput,
  setPromoInput,
  onApplyPromo,
  onRemovePromo,
  promoError,
  promoLoading,
  onNext,
  nextLabel = "Continue",
  showNext = true,
}: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm sticky top-4">
      {/* Header */}
      <div className="bg-[#1A1A1A] text-white px-4 py-3 flex items-center justify-between rounded-t">
        <span className="font-bold text-sm tracking-wider uppercase">Your Quote</span>
        <span className="text-xs text-gray-400">
          {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>

      {/* Estimated total */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="text-xs text-gray-500 mb-1">Estimated Total</div>
        <div className="text-3xl font-bold text-gray-800">
          ${quote.total.toFixed(2)}
        </div>
      </div>

      {/* Line items */}
      {quote.selected.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100 max-h-52 overflow-y-auto">
          {quote.selected.map((item, i) => (
            <div key={i} className="flex justify-between text-xs py-1 border-b border-gray-50 last:border-0">
              <div className="pr-2 flex-1">
                <span className="text-gray-700 font-medium">{item.item_name}</span>
                <span className="text-gray-400 ml-1">× {item.quantity}</span>
                <div className="text-gray-400 text-[10px]">{item.level_name}</div>
              </div>
              <span className="text-gray-700 font-medium whitespace-nowrap">
                ${item.subtotal.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Subtotal / Discount / Total breakdown */}
      {quote.selected.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex justify-between text-xs text-gray-600 py-0.5">
            <span>Subtotal</span>
            <span>${quote.subtotal.toFixed(2)}</span>
          </div>
          {quote.discount_amount > 0 && (
            <div className="flex justify-between text-xs text-green-600 py-0.5">
              <span className="flex items-center gap-1">
                <Tag size={10} /> Promo ({quote.applied_promo?.code})
              </span>
              <span>-${quote.discount_amount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-gray-800 pt-1 border-t border-gray-100 mt-1">
            <span>Total</span>
            <span>${quote.total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Promo code */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
          Promo Code
        </div>
        {quote.applied_promo ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-3 py-2">
            <div className="flex items-center gap-2">
              <Tag size={12} className="text-green-600" />
              <span className="text-xs font-bold text-green-700">{quote.applied_promo.code}</span>
              <span className="text-xs text-green-600">
                {quote.applied_promo.discount_type === "percentage"
                  ? `${quote.applied_promo.discount_value}% off`
                  : `$${quote.applied_promo.discount_value} off`}
              </span>
            </div>
            <button onClick={onRemovePromo} className="text-gray-400 hover:text-red-500 transition-colors">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && onApplyPromo(promoInput)}
              placeholder="Enter code"
              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-xs uppercase focus:outline-none focus:border-[#F5A000]"
            />
            <button
              onClick={() => onApplyPromo(promoInput)}
              disabled={promoLoading || !promoInput}
              className="bg-[#F5A000] hover:bg-[#D48A00] disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors"
            >
              {promoLoading ? "..." : "Apply"}
            </button>
          </div>
        )}
        {promoError && <p className="text-red-500 text-[10px] mt-1">{promoError}</p>}
      </div>

      {/* Trust badges */}
      <div className="px-4 py-3 text-[10px] text-gray-500 space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-[#F5A000] rounded-full flex-shrink-0" />
          100% satisfaction guarantee
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-[#F5A000] rounded-full flex-shrink-0" />
          Prices shown are starting rates, final pricing at time of service
        </div>
      </div>

      {/* CTA */}
      {showNext && (
        <div className="px-4 pb-4">
          <button
            onClick={onNext}
            disabled={quote.selected.length === 0}
            className="w-full bg-[#F5A000] hover:bg-[#D48A00] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {nextLabel}
            <ChevronRight size={16} />
          </button>
          {quote.selected.length === 0 && (
            <p className="text-center text-[10px] text-gray-400 mt-1">
              Select at least one service to continue
            </p>
          )}
        </div>
      )}
    </div>
  );
}
