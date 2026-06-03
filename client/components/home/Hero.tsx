"use client";

import { useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import {
  ArrowRight,
  Stethoscope,
  FileText,
  Calendar,
  Brain,
  Building2,
  Users,
} from "lucide-react";

const FEATURES_EN = [
  { label: "Voice Prescriptions",   icon: Stethoscope },
  { label: "Patient Records",       icon: FileText },
  { label: "Appointment Booking",   icon: Calendar },
  { label: "Clinic Analytics",      icon: Building2 },
  { label: "AI Health Assistant",   icon: Brain },
  { label: "Multi-Portal Access",   icon: Users },
];

const FEATURES_UR = [
  { label: "وائس پریسکرپشن",    icon: Stethoscope },
  { label: "پیشنٹ ریکارڈز",     icon: FileText },
  { label: "اپائنٹمنٹ بکنگ",    icon: Calendar },
  { label: "کلینک اینالیٹکس",   icon: Building2 },
  { label: "AI ہیلتھ اسسٹنٹ",   icon: Brain },
  { label: "ملٹی پورٹل رسائی",  icon: Users },
];

export function Hero() {
  const [query, setQuery] = useState("");
  const { language } = useLanguage();
  const isUrdu = language === "ur";
  const features = isUrdu ? FEATURES_UR : FEATURES_EN;

  return (
    <section className="relative px-3 sm:px-6 lg:px-10 py-3">
      <div
        className="relative mx-auto max-w-350 overflow-hidden rounded-3xl sm:rounded-4xl"
        style={{ minHeight: "clamp(560px, 86vh, 800px)" }}
      >
        {/* Video background */}
        <video
          className="absolute inset-0 h-full w-full object-cover scale-[1.03]"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* Overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-black/55 via-black/25 to-black/65" />

        {/* Content */}
        <div
          className="relative flex flex-col items-center justify-center text-center px-4 sm:px-10 py-16 sm:py-24"
          style={{ minHeight: "clamp(560px, 86vh, 800px)" }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-1.5 text-[12px] sm:text-[13px] font-medium text-white/90 mb-7 sm:mb-9">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {isUrdu
              ? "ڈاکٹروں، کلینکس اور مریضوں کے لیے ایک مرکزی پلیٹ فارم"
              : "One centralized platform — Doctors · Clinics · Patients"}
          </div>

          {/* Headline */}
          <h1
            className="max-w-4xl font-display text-[clamp(2.4rem,8.5vw,5.2rem)] font-bold leading-[1.02] tracking-[-0.03em] text-white"
            style={{ textShadow: "0 2px 24px rgba(0,0,0,0.35)" }}
          >
            {isUrdu ? (
              <>
                صحت کا سفر آسان بنائیں،
                <br className="hidden sm:block" />
                سب کچھ ایک جگہ
              </>
            ) : (
              <>
                Everything you need to make
                <br className="hidden sm:block" />
                healthcare effortless
              </>
            )}
          </h1>

          {/* Sub-headline */}
          <p className="mt-5 sm:mt-6 text-[15px] sm:text-[17px] text-white/70 font-normal max-w-xl leading-relaxed">
            {isUrdu
              ? "وائس پریسکرپشن، اپائنٹمنٹ مینجمنٹ، پیشنٹ ریکارڈز، کلینک اینالیٹکس — سب ایک جگہ۔"
              : "Voice prescriptions, appointment management, patient records, clinic analytics, and AI assistance — all in one place."}
          </p>

          {/* Search bar */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-8 sm:mt-10 w-full max-w-2xl"
          >
            <div className="flex items-center gap-2 rounded-2xl sm:rounded-full bg-white/85 backdrop-blur-md pr-1.5 sm:pr-2 pl-4 sm:pl-5 py-1.5 sm:py-2 shadow-lg border border-white/30">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isUrdu
                    ? "پوچھیں: اپائنٹمنٹ کیسے بکیں؟ ڈاکٹر کیسے ڈھونڈیں؟..."
                    : "Ask anything: How to book an appointment? How does voice prescription work?..."
                }
                className="flex-1 h-11 sm:h-12 bg-transparent text-sm sm:text-[15px] text-text-primary placeholder:text-text-secondary focus:outline-none min-w-0"
              />
              <button
                type="submit"
                aria-label="Ask"
                className="h-10 w-10 sm:h-11 sm:w-11 flex-none inline-flex items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover shrink-0"
              >
                <ArrowRight className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </form>

          {/* Feature pills */}
          <div className="mt-7 sm:mt-9 flex flex-wrap items-center justify-center gap-2">
            {features.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => setQuery(label)}
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/10 border border-white/18 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 text-[11.5px] sm:text-[12.5px] font-medium text-white/80 cursor-pointer transition-colors hover:bg-white/20 hover:text-white"
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
