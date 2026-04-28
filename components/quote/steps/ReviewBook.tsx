"use client";

import { QuoteState, SelectedService } from "@/lib/types";
import { CheckCircle, Calendar, MapPin, User, Phone, Mail, Tag } from "lucide-react";

interface ReviewData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  zip_code: string;
  service_address: string;
  preferred_date: string;
  preferred_time: string;
  notes: string;
}

interface Props {
  quote: QuoteState;
  reviewData: ReviewData;
  onConfirm: () => void;
  loading: boolean;
  confirmed: boolean;
  bookingNumber: string;
}

const TIME_LABELS: Record<string, string> = {
  morning: "Morning (8am - 12pm)",
  afternoon: "Afternoon (12pm - 4pm)",
  evening: "Evening (4pm - 6pm)",
  flexible: "I'm Flexible",
};

// Group services by category for display
function groupByCategory(services: SelectedService[]) {
  const groups: Record<string, SelectedService[]> = {};
  services.forEach((s) => {
    if (!groups[s.category_name]) groups[s.category_name] = [];
    groups[s.category_name].push(s);
  });
  return groups;
}

export default function ReviewBook({ quote, reviewData, onConfirm, loading, confirmed, bookingNumber }: Props) {
  if (confirmed) {
    return (
      <div className="text-center py-8 sm:py-12 px-2">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-500 sm:w-10 sm:h-10" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h2>
        <p className="text-gray-500 text-sm mb-4">
          Your booking request has been submitted successfully.
        </p>
        <div className="inline-block bg-user-brand text-white font-bold text-base sm:text-lg px-5 py-3 rounded mb-5 break-all">
          Booking #{bookingNumber}
        </div>
        <p className="text-sm text-gray-600 max-w-sm mx-auto">
          Our team will contact you at <strong>{reviewData.customer_phone}</strong> to confirm your appointment.
        </p>
        <div className="mt-6 p-4 bg-[#e8f6fc] border border-[#b3dff0] rounded text-sm text-[#2d7a9a] max-w-sm mx-auto">
          <strong>Estimated Total: ${quote.total.toFixed(2)}</strong>
          <br />
          Final pricing will be confirmed at the time of service.
        </div>
      </div>
    );
  }

  const grouped = groupByCategory(quote.selected);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Review Your Order</h2>
        <p className="text-sm text-gray-500 mt-1">
          Please review your selections before confirming your booking request.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Services Summary */}
        <div>
          <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">
            Selected Services
          </h3>
          <div className="border border-gray-200 rounded overflow-hidden">
            {Object.entries(grouped).map(([catName, items]) => (
              <div key={catName}>
                <div className="bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 uppercase tracking-wide">
                  {catName}
                </div>
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center px-3 py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <span className="text-sm text-gray-700">{item.item_name}</span>
                      {!item.is_checkbox && (
                        <span className="text-gray-400 text-xs ml-1">× {item.quantity}</span>
                      )}
                      <div className="text-xs text-gray-400">{item.level_name}</div>
                    </div>
                    <span className="text-sm font-bold text-gray-700">
                      ${item.subtotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            {/* Totals */}
            <div className="bg-gray-50 px-3 py-2 border-t border-gray-200">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Subtotal</span>
                <span>${quote.subtotal.toFixed(2)}</span>
              </div>
              {quote.discount_amount > 0 && (
                <div className="flex justify-between text-xs text-green-600 mb-1">
                  <span className="flex items-center gap-1">
                    <Tag size={10} /> {quote.applied_promo?.code}
                  </span>
                  <span>-${quote.discount_amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-gray-800 pt-1 border-t border-gray-200">
                <span>Estimated Total</span>
                <span className="text-[#6FC2E3]">${quote.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div>
          <h3 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">
            Booking Details
          </h3>
          <div className="border border-gray-200 rounded overflow-hidden divide-y divide-gray-100">
            <div className="px-4 py-3 flex items-start gap-3">
              <User size={15} className="text-[#6FC2E3] mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-400">Name</div>
                <div className="text-sm font-medium text-gray-700">{reviewData.customer_name}</div>
              </div>
            </div>
            <div className="px-4 py-3 flex items-start gap-3">
              <Mail size={15} className="text-[#6FC2E3] mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-400">Email</div>
                <div className="text-sm font-medium text-gray-700">{reviewData.customer_email}</div>
              </div>
            </div>
            <div className="px-4 py-3 flex items-start gap-3">
              <Phone size={15} className="text-[#6FC2E3] mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-400">Phone</div>
                <div className="text-sm font-medium text-gray-700">{reviewData.customer_phone}</div>
              </div>
            </div>
            {reviewData.preferred_date && (
              <div className="px-4 py-3 flex items-start gap-3">
                <Calendar size={15} className="text-[#6FC2E3] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-400">Preferred Date & Time</div>
                  <div className="text-sm font-medium text-gray-700">
                    {new Date(reviewData.preferred_date).toLocaleDateString("en-US", {
                      weekday: "long", year: "numeric", month: "long", day: "numeric",
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {TIME_LABELS[reviewData.preferred_time] || reviewData.preferred_time}
                  </div>
                </div>
              </div>
            )}
            {(reviewData.zip_code || reviewData.service_address) && (
              <div className="px-4 py-3 flex items-start gap-3">
                <MapPin size={15} className="text-[#6FC2E3] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-400">Service Location</div>
                  {reviewData.service_address && (
                    <div className="text-sm font-medium text-gray-700">{reviewData.service_address}</div>
                  )}
                  {reviewData.zip_code && (
                    <div className="text-xs text-gray-500">Zip: {reviewData.zip_code}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="mt-6 sm:mt-8 flex flex-col items-center gap-3">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="w-full max-w-md bg-user-brand disabled:opacity-50 text-white font-bold py-3.5 sm:py-4 rounded text-sm sm:text-base flex items-center justify-center gap-2 transition-colors shadow-lg"
        >
          {loading ? (
            <>
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle size={18} />
              Choose Payment Method
            </>
          )}
        </button>
        <p className="text-xs text-gray-400 text-center max-w-sm">
          By clicking Confirm, you agree to be contacted to schedule your cleaning service.
          Final pricing confirmed at time of service.
        </p>
      </div>
    </div>
  );
}
