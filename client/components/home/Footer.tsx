"use client";

import { Shield, Twitter, Linkedin, Facebook, Instagram } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/providers/LanguageProvider";
import { cn } from "@/lib/utils";

export function Footer() {
  const { language } = useLanguage();
  const isUrdu = language === "ur";

  return (
    <footer
      id="contact"
      className="relative bg-[#0d1f1a] pb-12 font-sans overflow-hidden"
      dir={isUrdu ? "rtl" : "ltr"}
    >
      {/* ── WAVE DIVIDER ──────────────────────────────────────────────────────── */}
      <div className="w-full bg-white overflow-hidden leading-none -mb-1">
        <svg
          viewBox="0 0 1440 80"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-16 md:h-20"
        >
          <path
            d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
            fill="#0d1f1a"
          />
        </svg>
      </div>

      {/* Centered content container */}
      <div className="pt-16 px-6 max-w-[800px] mx-auto text-center flex flex-col items-center">

        {/* ── SHIELD & BRAND BLOCK ────────────────────────────────────────────── */}
        <div className="w-14 h-14 mx-auto mb-6 flex items-center justify-center select-none relative z-10">
          <Shield className="w-14 h-14 text-[#00b495]" />
        </div>

        <span
          className="font-bold text-[18px] text-white tracking-tight block select-none relative z-10"
          style={{ fontFamily: "var(--font-plus-jakarta)" }}
        >
          MedEaz
        </span>

        <p
          className={cn("text-[#9ca3af] text-[14px] font-normal mt-1 select-none relative z-10", isUrdu && "font-urdu")}
          style={!isUrdu ? { fontFamily: "'Inter', sans-serif" } : undefined}
        >
          {isUrdu ? "طبی سہولیات، اب آسان۔" : "Healthcare Simplified."}
        </p>

        {/* ── DESCRIPTION PARAGRAPH ───────────────────────────────────────────── */}
        <p
          className={cn("text-[#9ca3af] text-[14px] leading-[1.6] max-w-[520px] mx-auto mt-6 mb-8 relative z-10", isUrdu && "font-urdu text-[16px] leading-[1.7]")}
          style={!isUrdu ? { fontFamily: "'Inter', sans-serif" } : undefined}
        >
          {isUrdu
            ? "میڈ ایز پاکستان کا پہلا مربوط کلینکل انٹیلیجنس پلیٹ فارم ہے۔ ہم ڈاکٹروں کو محفوظ وائس پریسکرپشنز فراہم کرتے ہیں، مریضوں کے لیے فوری بکنگ ممکن بناتے ہیں اور کلینکس کے انتظام کو آسان بناتے ہیں۔"
            : "MedEaz is Pakistan's first centralized clinical intelligence platform. We empower doctors with secure voice-to-prescription workflows, enable instant patient bookings, and help clinics run seamlessly."}
        </p>

        {/* ── SOCIAL ICONS ROW ────────────────────────────────────────────────── */}
        <div className={cn("flex justify-center gap-[16px] mb-12 relative z-10", isUrdu && "flex-row-reverse")}>
          {[
            { icon: <Twitter className="w-5 h-5" />, href: "#" },
            { icon: <Linkedin className="w-5 h-5" />, href: "#" },
            { icon: <Facebook className="w-5 h-5" />, href: "#" },
            { icon: <Instagram className="w-5 h-5" />, href: "#" }
          ].map((social, index) => (
            <motion.a
              key={index}
              whileHover={{ scale: 1.1, color: "#00b495" }}
              transition={{ duration: 0.15 }}
              href={social.href}
              className="text-[#6b7280] hover:text-[#00b495] transition-colors"
            >
              {social.icon}
            </motion.a>
          ))}
        </div>

        {/* ── BOTTOM BAR ──────────────────────────────────────────────────────── */}
        <div className="w-full pt-6 mt-6 border-t border-white/8 relative z-10">
          <div className={cn(
            "flex flex-col sm:flex-row justify-between items-center gap-4 text-[12px] text-[#6b7280] w-full",
            isUrdu && "sm:flex-row-reverse"
          )}>
            <p style={{ fontFamily: "'Inter', sans-serif" }}>
              {isUrdu ? "© 2026 میڈ ایز۔ جملہ حقوق محفوظ ہیں۔" : "© 2026 MedEaz. All rights reserved."}
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif" }}>
              {isUrdu ? "لاہور، پاکستان 🇵🇰" : "Made in Pakistan 🇵🇰"}
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}
