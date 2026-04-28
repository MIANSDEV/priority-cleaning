"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { X, CreditCard, Banknote, Smartphone, CheckCircle } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export type PaymentMethod = "stripe" | "cash" | "card";

// Gross-up so customer pays the Stripe fee (2.9% + $0.30)
function calcStripeCharge(serviceAmount: number) {
  const gross = (serviceAmount + 0.30) / (1 - 0.029);
  const chargeAmount = Math.ceil(gross * 100) / 100;
  const fee = parseFloat((chargeAmount - serviceAmount).toFixed(2));
  return { chargeAmount, fee };
}

function StripePaymentForm({
  serviceAmount,
  chargeAmount,
  fee,
  onSuccess,
}: {
  serviceAmount: number;
  chargeAmount: number;
  fee: number;
  onSuccess: (paymentIntentId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: chargeAmount }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to create payment");
      }

      const { clientSecret } = await res.json();
      const cardElement = elements.getElement(CardElement);

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement! },
      });

      if (stripeError) {
        setError(stripeError.message || "Payment failed. Please try again.");
      } else if (paymentIntent?.status === "succeeded") {
        onSuccess(paymentIntent.id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-1">
      {/* Fee breakdown */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-3 text-sm space-y-1">
        <div className="flex justify-between text-gray-600">
          <span>Service total</span>
          <span>${serviceAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-500 text-xs">
          <span>Online processing fee (2.9% + $0.30)</span>
          <span>+${fee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-800 pt-1 border-t border-blue-200 text-sm">
          <span>Total charged to card</span>
          <span>${chargeAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-3">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#1a1a1a",
                "::placeholder": { color: "#9ca3af" },
              },
              invalid: { color: "#ef4444" },
            },
          }}
        />
      </div>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full bg-user-brand disabled:opacity-50 text-white font-bold py-3 rounded text-sm flex items-center justify-center gap-2 transition-colors"
      >
        {loading ? (
          <>
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard size={16} />
            Pay ${chargeAmount.toFixed(2)} Securely
          </>
        )}
      </button>
      <p className="text-xs text-gray-400 text-center mt-2">
        Secured by Stripe. Card info is never stored on our servers.
      </p>
    </form>
  );
}

interface Props {
  amount: number;
  onComplete: (
    paymentMethod: PaymentMethod,
    paymentStatus: "paid" | "unpaid",
    stripePaymentIntentId?: string
  ) => Promise<void>;
  onClose: () => void;
  submitting: boolean;
}

const OPTIONS = [
  {
    key: "stripe" as PaymentMethod,
    label: "Pay Online",
    sublabel: "Credit / Debit Card",
    Icon: CreditCard,
    color: "text-blue-600",
  },
  {
    key: "cash" as PaymentMethod,
    label: "Cash",
    sublabel: "Pay at service",
    Icon: Banknote,
    color: "text-green-600",
  },
  {
    key: "card" as PaymentMethod,
    label: "Card (POS)",
    sublabel: "Card reader on-site",
    Icon: Smartphone,
    color: "text-purple-600",
  },
];

export default function PaymentModal({ amount, onComplete, onClose, submitting }: Props) {
  const [selected, setSelected] = useState<PaymentMethod | null>(null);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-lg shadow-xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-bold text-gray-800 text-base">Choose Payment Method</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          {/* Amount banner */}
          <div className="text-center mb-5 p-3 bg-[#e8f6fc] rounded-lg border border-[#b3dff0]">
            <div className="text-[10px] text-[#2d7a9a] uppercase tracking-wide font-bold">Estimated Total</div>
            <div className="text-3xl font-bold text-[#3a9cbf]">${amount.toFixed(2)}</div>
            <div className="text-[11px] text-[#3a9cbf]/70 mt-0.5">Final pricing confirmed at time of service</div>
          </div>

          {/* Method selector */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {OPTIONS.map(({ key, label, sublabel, Icon, color }) => (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={[
                  "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center",
                  selected === key
                    ? "border-[#6FC2E3] bg-[#e8f6fc]"
                    : "border-gray-200 bg-white hover:border-gray-300",
                ].join(" ")}
              >
                <Icon size={22} className={selected === key ? "text-[#6FC2E3]" : color} />
                <span className={`text-[11px] font-bold leading-tight ${selected === key ? "text-[#6FC2E3]" : "text-gray-700"}`}>
                  {label}
                </span>
                <span className="text-[10px] text-gray-400 leading-tight">{sublabel}</span>
              </button>
            ))}
          </div>

          {/* Stripe */}
          {selected === "stripe" && (() => {
            const { chargeAmount, fee } = calcStripeCharge(amount);
            return (
              <Elements stripe={stripePromise}>
                <StripePaymentForm
                  serviceAmount={amount}
                  chargeAmount={chargeAmount}
                  fee={fee}
                  onSuccess={(intentId) => onComplete("stripe", "paid", intentId)}
                />
              </Elements>
            );
          })()}

          {/* Cash */}
          {selected === "cash" && (
            <div className="rounded-lg border border-green-100 bg-green-50 p-4 text-center">
              <Banknote size={28} className="text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800 mb-1">Cash Payment</p>
              <p className="text-xs text-green-600 mb-4">
                Our team will collect cash payment at the time of service.
              </p>
              <button
                onClick={() => onComplete("cash", "unpaid")}
                disabled={submitting}
                className="w-full bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Confirm Booking (Cash)
                  </>
                )}
              </button>
            </div>
          )}

          {/* Card POS */}
          {selected === "card" && (
            <div className="rounded-lg border border-purple-100 bg-purple-50 p-4 text-center">
              <Smartphone size={28} className="text-purple-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-purple-800 mb-1">Card Payment (POS Terminal)</p>
              <p className="text-xs text-purple-600 mb-4">
                Our technician will bring a card reader to process your payment on-site.
              </p>
              <button
                onClick={() => onComplete("card", "unpaid")}
                disabled={submitting}
                className="w-full bg-purple-600 disabled:opacity-50 text-white font-bold py-3 rounded text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Confirm Booking (Card on Arrival)
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
