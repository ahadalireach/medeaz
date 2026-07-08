"use client";

import React from "react";

interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  locale: string;
}

export default function StepProgressBar({ currentStep, totalSteps, locale }: StepProgressBarProps) {
  const isUrdu = locale === "ur";
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full select-none">
      {/* Horizontal Progress Bar */}
      <div className="w-full h-1 bg-slate-100 relative overflow-hidden">
        <div
          className="h-full bg-[#00b495] transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Step Indicator Label */}
      <div className="py-3.5 px-6 flex items-center justify-between border-b border-slate-100 bg-white">
        <span className="text-[13px] font-bold text-slate-800">
          {isUrdu ? "پروفائل ترتیب دیں" : "Onboarding Setup"}
        </span>
        <span className="text-xs font-semibold text-slate-500">
          {isUrdu
            ? `مرحلہ ${currentStep} از ${totalSteps}`
            : `Step ${currentStep} of ${totalSteps}`}
        </span>
      </div>
    </div>
  );
}
