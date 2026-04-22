"use client";

import { useState } from "react";
import { useLanguage } from "@/providers/LanguageProvider";
import {
  ArrowRight,
  ShieldCheck,
  Pill,
  FlaskConical,
  Timer,
  Stethoscope,
  Apple,
} from "lucide-react";

export function Hero() {
  const [query, setQuery] = useState("");
  const { language } = useLanguage();
  const isUrdu = language === "ur";

  const chips = isUrdu
    ? [
        { label: "وائس پریسکرپشن", icon: Pill },
        { label: "پیشنٹ ریکارڈز", icon: FlaskConical },
        { label: "کلینک اینالیٹکس", icon: Timer },
        { label: "اپائنٹمنٹ فلو", icon: Stethoscope },
        { label: "AI اسسٹنٹ", icon: Apple },
      ]
    : [
        { label: "Voice Prescription", icon: Pill },
        { label: "Patient Records", icon: FlaskConical },
        { label: "Clinic Analytics", icon: Timer },
        { label: "Appointment Flow", icon: Stethoscope },
        { label: "AI Assistant", icon: Apple },
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
              ? "وائس اینیبلڈ · اردو + انگلش"
              : "Voice-enabled · Urdu + English"}
          </div>

          <h1 className="mt-8 sm:mt-10 max-w-4xl font-display text-[clamp(2.1rem,9vw,5.5rem)] leading-[1.04] sm:leading-[1.02] tracking-[-0.02em] text-text-primary">
            {isUrdu ? (
              <>
                Medeaz کلینکس کو
                <br className="hidden sm:block" /> کاغذی نظام سے ڈیجیٹل کیئر تک
                لاتا ہے
              </>
            ) : (
              <>
                Medeaz moves clinics <br className="hidden sm:block" />
                from paper to digital care
              </>
            )}
          </h1>

          <p className="mt-5 sm:mt-6 max-w-2xl text-base sm:text-xl text-text-primary/80 leading-relaxed">
            {isUrdu
              ? "وائس اسسٹڈ پریسکرپشنز بنائیں، سرچ ایبل ریکارڈز رکھیں، اور ایک ہی پلیٹ فارم پر کلینک پرفارمنس ٹریک کریں"
              : "Create voice-assisted prescriptions, keep searchable records, and track clinic performance on one platform"}
          </p>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-8 sm:mt-10 w-full max-w-2xl"
          >
            <label htmlFor="hero-ask" className="sr-only">
              {isUrdu
                ? "Medeaz فیچرز کے بارے میں پوچھیں"
                : "Ask Medeaz about features"}
            </label>
            <div className="flex items-center gap-2 rounded-2xl sm:rounded-full bg-white/80 backdrop-blur-md pr-1.5 sm:pr-2 pl-4 sm:pl-6 py-1.5 sm:py-2 shadow-[0_6px_30px_-8px_rgba(15,76,92,0.18)] border border-white/40">
              <input
                id="hero-ask"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isUrdu
                    ? "Medeaz سے پریسکرپشن، ریکارڈز یا اینالیٹکس کے بارے میں پوچھیں..."
                    : "Ask Medeaz about prescriptions, records, or analytics..."
                }
                className="flex-1 h-11 sm:h-12 bg-transparent text-sm sm:text-base text-text-primary placeholder:text-text-secondary focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Ask"
                className="h-10 w-10 sm:h-11 sm:w-11 flex-none inline-flex items-center justify-center rounded-full bg-primary text-white cursor-pointer transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <ArrowRight className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </form>

          <div className="mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 max-w-2xl">
            {chips.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => setQuery(label)}
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/70 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-medium text-text-primary cursor-pointer transition-colors hover:bg-white hover:text-primary border border-white/40"
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
