"use client";

import { User, Mail, Phone, MessageSquare } from "lucide-react";

interface ContactData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string;
}

interface Props {
  data: ContactData;
  onChange: (data: ContactData) => void;
}

export default function ContactInfo({ data, onChange }: Props) {
  const update = (field: keyof ContactData, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Your Information</h2>
        <p className="text-sm text-gray-500 mt-1">
          We&apos;ll use these details to confirm your booking and send a quote summary.
        </p>
      </div>

      <div className="space-y-4 max-w-lg">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            <User size={13} className="inline mr-1 text-[#F5A000]" />
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.customer_name}
            onChange={(e) => update("customer_name", e.target.value)}
            placeholder="John Smith"
            className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5A000] focus:ring-1 focus:ring-[#F5A000]"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            <Mail size={13} className="inline mr-1 text-[#F5A000]" />
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={data.customer_email}
            onChange={(e) => update("customer_email", e.target.value)}
            placeholder="john@example.com"
            className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5A000] focus:ring-1 focus:ring-[#F5A000]"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            <Phone size={13} className="inline mr-1 text-[#F5A000]" />
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={data.customer_phone}
            onChange={(e) => update("customer_phone", e.target.value)}
            placeholder="(555) 555-5555"
            className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5A000] focus:ring-1 focus:ring-[#F5A000]"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            <MessageSquare size={13} className="inline mr-1 text-[#F5A000]" />
            Special Requests / Notes
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <textarea
            value={data.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Any special instructions or questions..."
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-[#F5A000] focus:ring-1 focus:ring-[#F5A000] resize-none"
          />
        </div>
      </div>

      <p className="text-[11px] text-gray-400 mt-4">
        By submitting, you agree to be contacted regarding your cleaning service quote.
        We never share your information with third parties.
      </p>
    </div>
  );
}
