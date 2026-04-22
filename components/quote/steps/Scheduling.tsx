"use client";

import { Calendar, Clock, MapPin } from "lucide-react";

interface SchedulingData {
  preferred_date: string;
  preferred_time: string;
  zip_code: string;
  service_address: string;
}

interface Props {
  data: SchedulingData;
  onChange: (data: SchedulingData) => void;
}

const TIME_SLOTS = [
  { value: "morning", label: "Morning (8am - 12pm)" },
  { value: "afternoon", label: "Afternoon (12pm - 4pm)" },
  { value: "evening", label: "Evening (4pm - 6pm)" },
  { value: "flexible", label: "I'm Flexible" },
];

export default function Scheduling({ data, onChange }: Props) {
  const update = (field: keyof SchedulingData, value: string) =>
    onChange({ ...data, [field]: value });

  // Minimum date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Schedule Your Service</h2>
        <p className="text-sm text-gray-500 mt-1">
          Choose your preferred date and time. We&apos;ll confirm availability within 24 hours.
        </p>
      </div>

      <div className="space-y-6 max-w-lg">
        {/* Date */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <Calendar size={14} className="inline mr-1 text-[#F5A000]" />
            Preferred Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={data.preferred_date}
            min={minDate}
            onChange={(e) => update("preferred_date", e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5A000] focus:ring-1 focus:ring-[#F5A000]"
          />
        </div>

        {/* Time slot */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <Clock size={14} className="inline mr-1 text-[#F5A000]" />
            Preferred Time <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TIME_SLOTS.map((slot) => (
              <button
                key={slot.value}
                onClick={() => update("preferred_time", slot.value)}
                className={`py-2.5 px-3 rounded border text-sm font-medium text-left transition-all
                  ${
                    data.preferred_time === slot.value
                      ? "bg-[#F5A000] text-white border-[#F5A000]"
                      : "bg-white text-gray-700 border-gray-300 hover:border-[#F5A000]"
                  }
                `}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>

        {/* Zip Code */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            <MapPin size={14} className="inline mr-1 text-[#F5A000]" />
            Zip Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.zip_code}
            onChange={(e) => update("zip_code", e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="Enter your zip code"
            maxLength={5}
            className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5A000] focus:ring-1 focus:ring-[#F5A000]"
          />
        </div>

        {/* Service Address */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Service Address
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <input
            type="text"
            value={data.service_address}
            onChange={(e) => update("service_address", e.target.value)}
            placeholder="123 Main St, City, State"
            className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5A000] focus:ring-1 focus:ring-[#F5A000]"
          />
        </div>
      </div>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
        <strong>Note:</strong> This is a quote request. A team member will contact you to confirm
        the exact appointment time and any final pricing adjustments.
      </div>
    </div>
  );
}
