"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface SignalDetail {
  earned: number;
  max: number;
  label?: string;
}

export interface SignalBreakdown {
  appointmentFrequency: SignalDetail;
  followUpCompletion: SignalDetail;
  noShowRate: SignalDetail;
  visitRecency: SignalDetail;
}

export interface HealthScoreGaugeProps {
  size?: "sm" | "lg";
  score: number;
  breakdown?: SignalBreakdown;
  showMotivation?: boolean;
  loading?: boolean;
  isNewPatient?: boolean;
}

const scoreBands = [
  { min: 80, max: 100, label: "Excellent", color: "#22c55e", bg: "bg-emerald-500", text: "text-emerald-500" },
  { min: 60, max: 79, label: "Good", color: "#84cc16", bg: "bg-lime-500", text: "text-lime-500" },
  { min: 40, max: 59, label: "Fair", color: "#f59e0b", bg: "bg-amber-500", text: "text-amber-500" },
  { min: 20, max: 39, label: "Low", color: "#f97316", bg: "bg-orange-500", text: "text-orange-500" },
  { min: 0, max: 19, label: "Poor", color: "#ef4444", bg: "bg-red-500", text: "text-red-500" },
];

export const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({
  size = "sm",
  score,
  breakdown,
  showMotivation = false,
  loading = false,
  isNewPatient = false,
}) => {
  const [hovered, setHovered] = useState(false);

  // Urdu Translation Support
  const isUrdu = typeof document !== "undefined" && document.documentElement.lang === "ur";

  const tText = (key: string) => {
    if (!isUrdu) return key;

    // Dynamic rules
    if (key.includes("completed visits/month")) {
      const num = key.split(" ")[0];
      return `${num} مکمل شدہ وزٹ/مہینہ`;
    }
    if (key.includes("% completed")) {
      const num = key.split("%")[0];
      return `${num}% مکمل شدہ`;
    }
    if (key.includes("% no-shows")) {
      const num = key.split("%")[0];
      return `${num}% نہ آنے کی شرح`;
    }
    if (key.includes("days ago")) {
      const num = key.split(" ")[0];
      return `${num} دن پہلے`;
    }
    if (key.includes("visits/month")) {
      const num = key.split(" ")[0];
      return `${num} وزٹ/مہینہ`;
    }

    const map: Record<string, string> = {
      "Health Engagement Score": "ہیلتھ اِنگیجمنٹ اسکور",
      "Based on appointment consistency and follow-up completion.": "اپائنٹمنٹ کے تسلسل اور فالو اپ کی تکمیل کی بنیاد پر۔",
      "Based on appointment consistency & follow-up completion.": "اپائنٹمنٹ کے تسلسل اور فالو اپ کی تکمیل کی بنیاد پر۔",
      "New Patient": "نیا مریض",
      "Complete your first appointment to see your score.": "اپنا اسکور دیکھنے کے لیے اپنی پہلی اپائنٹمنٹ مکمل کریں۔",
      "You're doing great! Regular check-ups make a real difference.": "آپ بہت اچھا کام کر رہے ہیں! باقاعدہ چیک اپ سے واقعی فرق پڑتا ہے۔",
      "Good progress. Try not to miss scheduled follow-ups.": "اچھی پیش رفت۔ شیڈول کردہ فالو اپس کو نہ چھوڑنے کی کوشش کریں۔",
      "Your score could improve. Book your next appointment.": "آپ کا اسکور بہتر ہو سکتا ہے۔ اپنی اگلی اپائنٹمنٹ بک کریں۔",
      "We miss you. Regular visits help catch issues early.": "ہم آپ کو یاد کرتے ہیں۔ باقاعدہ دورے مسائل کو جلد پکڑنے میں مدد کرتے ہیں۔",
      "Activity Signals": "سرگرمی کے اشارے",
      "Appointment Frequency": "اپائنٹمنٹ کا تسلسل",
      "Appointment Rate": "اپائنٹمنٹ کا تسلسل",
      "Follow-Up Completion": "فالو اپ کی تکمیل",
      "No-Show Rate": "نہ آنے کی شرح",
      "No-Show Rate Score": "نہ آنے کی شرح کا اسکور",
      "Visit Recency": "آخری وزٹ کی مدت",
      "Visit Recency Score": "آخری وزٹ کی مدت کا اسکور",
      "Excellent": "بہترین",
      "Good": "اچھا",
      "Fair": "مناسب",
      "Low": "کم",
      "Poor": "کمزور",
      "New": "نیا",
      "pts": "پوائنٹس",
      "Health Engagement": "ہیلتھ اِنگیجمنٹ",
      "Complete your first scheduled appointment to generate engagement score.": "سرگرمی کا اسکور بنانے کے لیے اپنی پہلی شیڈول کردہ اپائنٹمنٹ مکمل کریں۔",
      "No breakdown details available.": "بریک ڈاؤن کی تفصیلات دستیاب نہیں ہیں۔",
    };
    return map[key] || key;
  };

  // Determine score band
  const resolvedIsNew = isNewPatient || (score === 0 && !breakdown);
  const band = resolvedIsNew
    ? { label: "New Patient", color: "#9ca3af", bg: "bg-gray-400", text: "text-gray-400" }
    : scoreBands.find((b) => score >= b.min && score <= b.max) || scoreBands[4];

  // SVG parameters
  const radius = size === "sm" ? 16 : 50;
  const strokeWidth = size === "sm" ? 3 : 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = resolvedIsNew ? circumference : circumference - (score / 100) * circumference;

  // Motivational message
  const getMotivationMessage = () => {
    if (resolvedIsNew) {
      return "Complete your first appointment to see your score.";
    }
    if (score >= 80) {
      return "You're doing great! Regular check-ups make a real difference.";
    }
    if (score >= 60) {
      return "Good progress. Try not to miss scheduled follow-ups.";
    }
    if (score >= 40) {
      return "Your score could improve. Book your next appointment.";
    }
    return "We miss you. Regular visits help catch issues early.";
  };

  // Skeleton / Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center animate-pulse">
        <div
          style={{ width: size === "sm" ? 40 : 120, height: size === "sm" ? 40 : 120 }}
          className="rounded-full border-4 border-gray-200 border-t-[#00b495] animate-spin"
        />
        {size === "lg" && <div className="h-4 w-24 bg-gray-200 rounded mt-3" />}
      </div>
    );
  }

  // Small Badge (List View)
  if (size === "sm") {
    return (
      <div
        className="relative inline-flex items-center justify-center cursor-help"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <svg width={40} height={40} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={20}
            cy={20}
            r={radius}
            fill="transparent"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            className="opacity-15"
          />
          {/* Foreground circle */}
          <motion.circle
            cx={20}
            cy={20}
            r={radius}
            fill="transparent"
            stroke={band.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            strokeLinecap="round"
            style={{
              strokeDasharray: resolvedIsNew ? "3 3" : undefined,
            }}
          />
        </svg>
        <span
          className="absolute font-sans font-extrabold text-[11px] text-gray-800 dark:text-gray-200"
          style={{ letterSpacing: "-0.5px" }}
        >
          {resolvedIsNew ? tText("New") : score}
        </span>

        {/* Hover Tooltip */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {tText("Health Engagement")}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${band.bg} text-white`}>
                  {tText(band.label)} {resolvedIsNew ? "" : `${score}`}
                </span>
              </div>
              
              {breakdown ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">{tText("Appointment Rate")}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {breakdown.appointmentFrequency.earned}/{breakdown.appointmentFrequency.max} {tText("pts")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">{tText("Follow-Up Completion")}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {breakdown.followUpCompletion.earned}/{breakdown.followUpCompletion.max} {tText("pts")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">{tText("No-Show Rate")}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {breakdown.noShowRate.earned}/{breakdown.noShowRate.max} {tText("pts")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">{tText("Visit Recency")}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {breakdown.visitRecency.earned}/{breakdown.visitRecency.max} {tText("pts")}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {resolvedIsNew 
                    ? tText("Complete your first scheduled appointment to generate engagement score.")
                    : tText("No breakdown details available.")}
                </p>
              )}

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 text-center">
                {tText("Based on appointment consistency & follow-up completion.")}
              </div>
              
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-r border-b border-slate-200 dark:border-slate-800 transform rotate-45 -mt-[6px]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Large Widget (Detail / Dashboard View)
  return (
    <div className="flex flex-col items-center bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-[2.2rem] p-6 sm:p-7 shadow-sm w-full max-w-sm">
      {/* Header section with generous spacing */}
      <div className="flex items-center space-x-2 self-start mb-6 border-b border-slate-100 dark:border-slate-800/60 pb-3 w-full">
        <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-250">
          {tText("Health Engagement Score")}
        </span>
        <div className="group relative cursor-help">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4.5 h-4.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-2a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-1 2.5a.75.75 0 0 0-1 0v3a.75.75 0 0 0 1.5 0v-3a.75.75 0 0 0-.5-.75Z"
              clipRule="evenodd"
            />
          </svg>
          <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-slate-800 dark:bg-slate-950 text-white text-[11px] rounded-lg p-2.5 text-center shadow-xl z-50 leading-relaxed border border-white/5">
            {tText("Based on appointment consistency and follow-up completion.")}
          </div>
        </div>
      </div>

      {/* SVG Circle Section with margin-bottom */}
      <div className="relative flex items-center justify-center mb-6 mt-2">
        <svg width={130} height={130} className="transform -rotate-90">
          {/* Background Circle */}
          <circle
            cx={65}
            cy={65}
            r={radius}
            fill="transparent"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            className="opacity-15"
          />
          {/* Foreground Circle */}
          <motion.circle
            cx={65}
            cy={65}
            r={radius}
            fill="transparent"
            stroke={band.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            strokeLinecap="round"
            style={{
              strokeDasharray: resolvedIsNew ? "3 3" : undefined,
            }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-sans font-black text-3.5xl text-slate-800 dark:text-slate-100 tracking-tight">
            {resolvedIsNew ? "--" : score}
          </span>
          <span className={`text-[11px] font-extrabold uppercase tracking-wider ${band.text} mt-0.5`}>
            {tText(band.label)}
          </span>
        </div>
      </div>

      {/* Motivational message with vertical spacing */}
      {showMotivation && (
        <div className="mb-6 px-2">
          <p className="text-center text-[13px] sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed bg-slate-50 dark:bg-slate-950/40 py-3 px-4 rounded-2xl border border-slate-100 dark:border-slate-900/50">
            {tText(getMotivationMessage())}
          </p>
        </div>
      )}

      {/* Breakdown details with beautiful row margins and thick, modern progress bars */}
      {breakdown && (
        <div className="w-full space-y-4.5 mt-2 pt-5 border-t border-slate-150 dark:border-slate-800/80">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-3">
            {tText("Activity Signals")}
          </span>
          {[
            {
              id: "appointmentFrequency",
              label: "Appointment Frequency",
              val: breakdown.appointmentFrequency.earned,
              max: breakdown.appointmentFrequency.max,
              desc: breakdown.appointmentFrequency.label,
            },
            {
              id: "followUpCompletion",
              label: "Follow-Up Completion",
              val: breakdown.followUpCompletion.earned,
              max: breakdown.followUpCompletion.max,
              desc: breakdown.followUpCompletion.label,
            },
            {
              id: "noShowRate",
              label: "No-Show Rate Score",
              val: breakdown.noShowRate.earned,
              max: breakdown.noShowRate.max,
              desc: breakdown.noShowRate.label,
            },
            {
              id: "visitRecency",
              label: "Visit Recency Score",
              val: breakdown.visitRecency.earned,
              max: breakdown.visitRecency.max,
              desc: breakdown.visitRecency.label,
            },
          ].map((item, index) => (
            <div key={item.id} className="text-xs group">
              <div className="flex justify-between mb-1.5 items-center">
                <span className="font-semibold text-slate-750 dark:text-slate-300">
                  {tText(item.label)}
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] font-medium bg-slate-50 dark:bg-slate-950/50 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-900/50">
                  {item.val}/{item.max} {tText("pts")} {item.desc ? `(${tText(item.desc)})` : ""}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.val / item.max) * 105}%` }} // Subtle overflow prevention check
                  style={{ width: `${(item.val / item.max) * 100}%`, backgroundColor: band.color }}
                  transition={{ duration: 0.8, delay: 0.3 + index * 0.1, ease: "easeOut" }}
                  className={`h-full rounded-full`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
