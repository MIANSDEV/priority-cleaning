"use client";

import { QuoteStep } from "@/lib/types";
import { Check } from "lucide-react";

const STEPS: { key: QuoteStep; label: string }[] = [
  { key: "services", label: "Select Services" },
  { key: "scheduling", label: "Scheduling" },
  { key: "contact", label: "Your Information" },
  { key: "review", label: "Review Your Order" },
];

interface Props {
  currentStep: QuoteStep;
}

export default function StepIndicator({ currentStep }: Props) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-stretch">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isActive = index === currentIndex;
            const isLast = index === STEPS.length - 1;

            return (
              <div
                key={step.key}
                className={`flex items-center flex-1 py-3 px-4 text-sm font-medium relative
                  ${isActive ? "bg-[#F5A000] text-white" : ""}
                  ${isCompleted ? "bg-gray-100 text-gray-600" : ""}
                  ${!isActive && !isCompleted ? "text-gray-400 bg-white" : ""}
                  ${!isLast ? "border-r border-gray-200" : ""}
                `}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0
                    ${isActive ? "bg-white text-[#F5A000]" : ""}
                    ${isCompleted ? "bg-[#F5A000] text-white" : ""}
                    ${!isActive && !isCompleted ? "bg-gray-200 text-gray-500" : ""}
                  `}
                >
                  {isCompleted ? <Check size={12} /> : index + 1}
                </span>
                <span className="hidden sm:block truncate">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
