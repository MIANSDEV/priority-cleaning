"use client";

import { useState, useEffect, useCallback } from "react";
import { ServiceCategory, Special, SelectedService, QuoteState, QuoteStep, PromoCode } from "@/lib/types";
import StepIndicator from "@/components/quote/StepIndicator";
import OnlineSpecials from "@/components/quote/OnlineSpecials";
import QuoteSummary from "@/components/quote/QuoteSummary";
import SelectServices from "@/components/quote/steps/SelectServices";
import Scheduling from "@/components/quote/steps/Scheduling";
import ContactInfo from "@/components/quote/steps/ContactInfo";
import ReviewBook from "@/components/quote/steps/ReviewBook";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STEPS: QuoteStep[] = ["services", "scheduling", "contact", "review"];

export default function QuoteBuilder() {
  const [step, setStep] = useState<QuoteStep>("services");
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [specials, setSpecials] = useState<Special[]>([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState<SelectedService[]>([]);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const [scheduling, setScheduling] = useState({
    preferred_date: "",
    preferred_time: "",
    zip_code: "",
    service_address: "",
  });

  const [contact, setContact] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [bookingNumber, setBookingNumber] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, specRes] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/specials"),
        ]);
        if (catRes.ok) setCategories(await catRes.json());
        if (specRes.ok) setSpecials(await specRes.json());
      } catch (e) {
        console.error("Failed to load data", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const subtotal = selected.reduce((sum, s) => sum + s.subtotal, 0);
  const discountAmount = appliedPromo
    ? appliedPromo.discount_type === "percentage"
      ? (subtotal * appliedPromo.discount_value) / 100
      : appliedPromo.discount_value
    : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const quote: QuoteState = {
    selected,
    promo_code: promoInput,
    applied_promo: appliedPromo,
    subtotal,
    discount_amount: discountAmount,
    total,
  };

  const handleApplyPromo = useCallback(async (code: string) => {
    if (!code) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase(), subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error || "Invalid promo code");
      } else {
        setAppliedPromo(data);
        setPromoInput(code.toUpperCase());
      }
    } catch {
      setPromoError("Failed to apply promo code");
    } finally {
      setPromoLoading(false);
    }
  }, [subtotal]);

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  };

  const handleNext = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const handleBack = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const canProceed = () => {
    if (step === "services") return selected.length > 0;
    if (step === "scheduling") return !!scheduling.preferred_date && !!scheduling.preferred_time && !!scheduling.zip_code;
    if (step === "contact") return !!contact.customer_name && !!contact.customer_email && !!contact.customer_phone;
    return true;
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contact,
          ...scheduling,
          selected_services: selected,
          subtotal,
          discount_amount: discountAmount,
          promo_code_used: appliedPromo?.code || null,
          total,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Booking failed. Please try again.");
      } else {
        setBookingNumber(data.booking_number);
        setConfirmed(true);
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#F5A000] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading services...</p>
        </div>
      </div>
    );
  }

  const stepLabels: Record<QuoteStep, string> = {
    services: "Continue to Scheduling",
    scheduling: "Continue to Your Information",
    contact: "Review My Order",
    review: "Confirm Booking",
  };

  const showMobileBar = !confirmed && step !== "review";

  return (
    <div className="min-h-screen bg-gray-100">
      <StepIndicator currentStep={step} />

      <div className={`max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 ${showMobileBar ? "pb-24 md:pb-6" : ""}`}>
        <div className="flex gap-4 lg:gap-5">
          {/* Left: Online Specials — desktop only */}
          <div className="hidden lg:block w-44 xl:w-48 flex-shrink-0">
            <OnlineSpecials
              specials={specials}
              onApply={(code) => { setPromoInput(code); handleApplyPromo(code); }}
            />
          </div>

          {/* Center: Main content */}
          <div className="flex-1 min-w-0">
            {step !== "services" && !confirmed && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#F5A000] mb-3 transition-colors"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}

            <div className="bg-white rounded shadow-sm p-4 sm:p-5">
              {step === "services" && (
                <SelectServices
                  categories={categories}
                  selected={selected}
                  onUpdate={setSelected}
                />
              )}
              {step === "scheduling" && (
                <Scheduling data={scheduling} onChange={setScheduling} />
              )}
              {step === "contact" && (
                <ContactInfo data={contact} onChange={setContact} />
              )}
              {step === "review" && (
                <ReviewBook
                  quote={quote}
                  reviewData={{ ...contact, ...scheduling }}
                  onConfirm={handleConfirm}
                  loading={submitting}
                  confirmed={confirmed}
                  bookingNumber={bookingNumber}
                />
              )}

              {/* Desktop next button (inside card) — hidden on mobile since sticky bar handles it */}
              {step !== "review" && !confirmed && (
                <div className="hidden md:flex mt-6 pt-4 border-t border-gray-100 justify-end">
                  <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="bg-brand disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded text-sm transition-colors"
                  >
                    {stepLabels[step]}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile: specials shown below main card */}
            {specials.length > 0 && (
              <div className="lg:hidden mt-4">
                <OnlineSpecials
                  specials={specials}
                  onApply={(code) => { setPromoInput(code); handleApplyPromo(code); }}
                />
              </div>
            )}
          </div>

          {/* Right: Quote Summary — md+ */}
          <div className="w-56 xl:w-64 flex-shrink-0 hidden md:block">
            <QuoteSummary
              quote={quote}
              promoInput={promoInput}
              setPromoInput={setPromoInput}
              onApplyPromo={handleApplyPromo}
              onRemovePromo={handleRemovePromo}
              promoError={promoError}
              promoLoading={promoLoading}
              onNext={handleNext}
              nextLabel={stepLabels[step]}
              showNext={false}
            />
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      {showMobileBar && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Estimated Total</div>
              <div className="text-xl font-bold text-gray-800">${total.toFixed(2)}</div>
              {discountAmount > 0 && (
                <div className="text-[10px] text-green-600 font-bold">
                  Saving ${discountAmount.toFixed(2)}
                </div>
              )}
            </div>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-brand disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-5 rounded text-sm flex items-center gap-2 transition-colors"
            >
              {stepLabels[step]}
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
