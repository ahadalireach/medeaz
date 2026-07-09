"use client";

import React from "react";
import { Check } from "lucide-react";

interface Step {
  number: number;
  label: string;
  labelUr: string;
}

interface StepSidebarProps {
  steps: Step[];
  currentStep: number;
  locale: string;
}

export default function StepSidebar({ steps, currentStep, locale }: StepSidebarProps) {
  const isUrdu = locale === "ur";

  return (
    <div className="w-[220px] bg-[#f8fafc] border-r border-[#e5e7eb] rounded-l-[20px] p-8 flex flex-col shrink-0 select-none">
      {/* Logo & Header */}
      <div className="flex items-center space-x-2 mb-10">
        <div className="w-8 h-8 rounded-lg bg-[#00b495] flex items-center justify-center font-black text-white text-base shadow-md shadow-teal-500/10">
          M
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black text-slate-800 tracking-tight leading-none">MedEaz</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {isUrdu ? "سیٹ اپ" : "Setup Wizard"}
          </span>
        </div>
      </div>

      {/* Steps List */}
      <div className="flex-1 space-y-7">
        {steps.map((step) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          const isPending = step.number > currentStep;

          return (
            <div key={step.number} className="flex items-center space-x-3.5 group">
              {/* Bubble Indicator */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-semibold text-xs transition-all duration-300 ${
                  isCompleted
                    ? "bg-[#00b495] text-white shadow-sm"
                    : isActive
                    ? "border-2 border-[#00b495] text-[#00b495] bg-white font-bold scale-[1.05]"
                    : "border border-[#e2e8f0] text-[#94a3b8] bg-white"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : step.number}
              </div>

              {/* Step Label */}
              <span
                className={`text-[13px] transition-colors duration-300 ${
                  isActive
                    ? "text-[#1e293b] font-bold"
                    : isCompleted
                    ? "text-[#1e293b]/80 font-medium"
                    : "text-[#94a3b8] font-medium"
                }`}
              >
                {isUrdu ? step.labelUr : step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
