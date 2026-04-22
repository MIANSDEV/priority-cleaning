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
import { ChevronLeft } from "lucide-react";

const STEPS: QuoteStep[] = ["services", "scheduling", "contact", "review"];

export default function QuoteBuilder() {
  const [step, setStep] = useState<QuoteStep>("services");
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [specials, setSpecials] = useState<Special[]>([]);
  const [loading, setLoading] = useState(true);

  // Quote state
  const [selected, setSelected] = useState<SelectedService[]>([]);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  // Scheduling
  const [scheduling, setScheduling] = useState({
    preferred_date: "",
    preferred_time: "",
    zip_code: "",
    service_address: "",
  });

  // Contact
  const [contact, setContact] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    notes: "",
  });

  // Booking submission
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [bookingNumber, setBookingNumber] = useState("");

  // ---- Fetch data ----
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

  // ---- Quote calculations ----
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

  // ---- Promo code ----
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

  // ---- Navigation ----
  const handleNext = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const handleBack = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  // ---- Validation ----
  const canProceed = () => {
    if (step === "services") return selected.length > 0;
    if (step === "scheduling") return !!scheduling.preferred_date && !!scheduling.preferred_time && !!scheduling.zip_code;
    if (step === "contact") return !!contact.customer_name && !!contact.customer_email && !!contact.customer_phone;
    return true;
  };

  // ---- Submit booking ----
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
      <div className="flex items-center justify-center min-h-[400px]">
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Step indicator */}
      <StepIndicator currentStep={step} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-5">
          {/* Left: Online Specials (hidden on mobile) */}
          <div className="hidden lg:block w-48 flex-shrink-0">
            <OnlineSpecials
              specials={specials}
              onApply={(code) => {
                setPromoInput(code);
                handleApplyPromo(code);
              }}
            />
          </div>

          {/* Center: Main content */}
          <div className="flex-1 min-w-0">
            {/* Back button */}
            {step !== "services" && !confirmed && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#F5A000] mb-4 transition-colors"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}

            <div className="bg-white rounded shadow-sm p-5">
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

              {/* Next button (inside card, below content) - not shown on review step */}
              {step !== "review" && !confirmed && (
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="bg-[#F5A000] hover:bg-[#D48A00] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded text-sm transition-colors"
                  >
                    {stepLabels[step]}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Quote Summary */}
          <div className="w-64 flex-shrink-0 hidden md:block">
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
              showNext={step === "services"}
            />
          </div>
        </div>

        {/* Mobile: specials and quote */}
        <div className="md:hidden mt-4 space-y-4">
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
            showNext={step === "services"}
          />
          <OnlineSpecials
            specials={specials}
            onApply={(code) => {
              setPromoInput(code);
              handleApplyPromo(code);
            }}
          />
        </div>
      </div>
    </div>
  );
}
