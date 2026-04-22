"use client";

import { QuoteStep } from "@/lib/types";
import { Check } from "lucide-react";

const STEPS: { key: QuoteStep; label: string; shortLabel: string }[] = [
  { key: "services", label: "Select Services", shortLabel: "Services" },
  { key: "scheduling", label: "Scheduling", shortLabel: "Schedule" },
  { key: "contact", label: "Your Information", shortLabel: "Info" },
  { key: "review", label: "Review Your Order", shortLabel: "Review" },
];

interface Props {
  currentStep: QuoteStep;
}

export default function StepIndicator({ currentStep }: Props) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-2 sm:px-4">
        <div className="flex items-stretch">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isActive = index === currentIndex;
            const isLast = index === STEPS.length - 1;

            return (
              <div
                key={step.key}
                className={[
                  "flex items-center flex-1 py-2.5 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium relative",
                  isActive ? "bg-brand text-white" : "",
                  isCompleted ? "bg-gray-100 text-gray-600" : "",
                  !isActive && !isCompleted ? "text-gray-400 bg-white" : "",
                  !isLast ? "border-r border-gray-200" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold mr-1.5 sm:mr-2 flex-shrink-0",
                    isActive ? "bg-white text-[#F5A000]" : "",
                    isCompleted ? "bg-brand text-white" : "",
                    !isActive && !isCompleted ? "bg-gray-200 text-gray-500" : "",
                  ].join(" ")}
                >
                  {isCompleted ? <Check size={10} /> : index + 1}
                </span>
                {/* Short label on small screens, full label on larger */}
                <span className="hidden xs:block sm:hidden truncate leading-tight">{step.shortLabel}</span>
                <span className="hidden sm:block truncate leading-tight">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
