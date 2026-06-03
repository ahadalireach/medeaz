"use client";

import { useLanguage } from "@/providers/LanguageProvider";
import {
  ShieldCheck,
  Pill,
  Calendar,
  BarChart3,
  Stethoscope,
  Brain,
} from "lucide-react";

export function Hero() {
  const { language } = useLanguage();
  const isUrdu = language === "ur";

  const chips = isUrdu
    ? [
        { label: "وائس پریسکرپشن", icon: Pill },
        { label: "اپائنٹمنٹ بکنگ", icon: Calendar },
        { label: "کلینک اینالیٹکس", icon: BarChart3 },
        { label: "پیشنٹ ریکارڈز", icon: Stethoscope },
        { label: "AI ہیلتھ اسسٹنٹ", icon: Brain },
      ]
    : [
        { label: "Voice Prescriptions", icon: Pill },
        { label: "Appointment Booking", icon: Calendar },
        { label: "Clinic Analytics", icon: BarChart3 },
        { label: "Patient Records", icon: Stethoscope },
        { label: "AI Health Assistant", icon: Brain },
      ];

  return (
    <section className="relative px-3 sm:px-6 lg:px-10 py-3">
      <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[22px] sm:rounded-[28px]">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/0 to-background/40" />

        <div className="relative flex flex-col items-center px-4 sm:px-6 py-10 sm:py-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm px-3 sm:px-4 py-2 text-[12px] sm:text-[13px] font-medium text-primary shadow-[0_1px_0_0_rgba(0,0,0,0.03)]">
            <ShieldCheck className="h-4 w-4" strokeWidth={2.25} />
            {isUrdu
              ? "ڈاکٹروں، کلینکس اور مریضوں کے لیے · اردو + انگلش"
              : "One platform for Doctors, Clinics & Patients · Urdu + English"}
          </div>

          <h1 className="mt-6 sm:mt-8 max-w-3xl font-display text-[clamp(2rem,5vw,3.6rem)] leading-[1.06] tracking-[-0.02em] text-text-primary">
            {isUrdu ? (
              <>
                صحت کو آسان بنائیں،
                <br className="hidden sm:block" /> سب کچھ ایک جگہ
              </>
            ) : (
              <>
                Everything you need to make
                <br className="hidden sm:block" /> healthcare effortless
              </>
            )}
          </h1>

          <p className="mt-5 sm:mt-6 text-[15px] sm:text-[17px] text-text-primary/80 font-medium max-w-xl mx-auto leading-relaxed">
            {isUrdu
              ? "وائس پریسکرپشن، اپائنٹمنٹ، پیشنٹ ریکارڈز اور AI اسسٹنٹ — سب ایک مرکزی پلیٹ فارم میں۔"
              : "Voice prescriptions, appointments, patient records, and AI assistance, all in one connected platform."}
          </p>

          <div className="mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 max-w-2xl">
            {chips.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/70 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-medium text-text-primary border border-white/40"
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
