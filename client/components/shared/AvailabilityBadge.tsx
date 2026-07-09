import React from "react";
import { useLocale } from "next-intl";
 
interface AvailabilityBadgeProps {
  status: "available" | "busy" | "on-leave";
  size?: "sm" | "md";
}
 
export default function AvailabilityBadge({ status, size = "sm" }: AvailabilityBadgeProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const config = {
    available: {
      dot: "bg-green-500",
      bg: "bg-green-500/10 border-green-500/25 text-green-700",
      label: isUrdu ? "دستیاب" : "Available",
    },
    busy: {
      dot: "bg-amber-500",
      bg: "bg-amber-500/10 border-amber-500/25 text-amber-700",
      label: isUrdu ? "مصروف" : "Busy",
    },
    "on-leave": {
      dot: "bg-slate-500",
      bg: "bg-slate-500/10 border-slate-500/25 text-slate-600",
      label: isUrdu ? "رخصت پر" : "On Leave",
    },
  };
 
  const current = config[status] || config.available;
 
  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-full font-semibold transition-all ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      } ${current.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
    </span>
  );
}
