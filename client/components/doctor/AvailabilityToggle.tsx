"use client";
 
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useGetDoctorProfileQuery, useUpdateAvailabilityMutation } from "@/store/api/doctorApi";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";
 
type Status = "available" | "busy" | "on-leave";
 
export default function AvailabilityToggle() {
  const { data: profileData } = useGetDoctorProfileQuery(undefined);
  const [updateAvailability] = useUpdateAvailabilityMutation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const isUrdu = locale === "ur";
 
  const currentStatus: Status = profileData?.data?.availabilityStatus || "available";
 
  // Handle outside clicks to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
 
  const config = {
    available: {
      dot: "bg-[#22c55e]",
      bg: "bg-[rgba(34,197,94,0.10)]",
      border: "border-[rgba(34,197,94,0.25)]",
      text: "text-[#22c55e]",
      label: isUrdu ? "دستیاب" : "Available",
    },
    busy: {
      dot: "bg-[#f59e0b]",
      bg: "bg-[rgba(245,158,11,0.10)]",
      border: "border-[rgba(245,158,11,0.25)]",
      text: "text-[#f59e0b]",
      label: isUrdu ? "مصروف" : "Busy",
    },
    "on-leave": {
      dot: "bg-[#6b7280]",
      bg: "bg-[rgba(107,114,128,0.10)]",
      border: "border-[rgba(107,114,128,0.25)]",
      text: "text-[#6b7280]",
      label: isUrdu ? "رخصت پر" : "On Leave",
    },
  };
 
  const active = config[currentStatus] || config.available;
 
  const handleStatusChange = async (status: Status) => {
    setIsOpen(false);
    if (status === currentStatus) return;
 
    try {
      // PATCH status update in background
      await updateAvailability({ status }).unwrap();
      const statusStr = status === "on-leave" ? (isUrdu ? "رخصت پر" : "On Leave") : status === "busy" ? (isUrdu ? "مصروف" : "Busy") : (isUrdu ? "دستیاب" : "Available");
      toast.success(
        isUrdu 
          ? `حیثیت تبدیل کر دی گئی ہے: ${statusStr}` 
          : `Status updated to ${statusStr}.`, 
        {
          position: "bottom-right",
          style: {
            background: "#00b495",
            color: "#fff",
            fontSize: "13px",
            fontWeight: "600",
          },
          duration: 2000,
        }
      );
    } catch (err) {
      toast.error(
        isUrdu ? "حیثیت کی تبدیلی ناکام ہو گئی۔ دوبارہ کوشش کریں۔" : "Status update failed. Try again.", 
        {
          position: "bottom-right",
        }
      );
    }
  };
 
  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border text-[11px] sm:text-[13px] font-semibold font-sans cursor-pointer transition-all hover:brightness-95 whitespace-nowrap shrink-0 ${active.bg} ${active.border} ${active.text}`}
      >
        <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${active.dot}`} />
        <span>{active.label}</span>
      </button>
 
      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-150 shadow-xl z-50 overflow-hidden origin-top-right focus:outline-none"
          >
            <div className="py-1">
              {(Object.keys(config) as Status[]).map((status) => {
                const item = config[status];
                const isSelected = status === currentStatus;
                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer ${isUrdu ? 'text-right' : 'text-left'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                      <span>{item.label}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#00b495] stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
