"use client";

import { useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  Pill,
  FlaskConical,
  Timer,
  Stethoscope,
  Apple,
} from "lucide-react";

const CHIPS = [
  { label: "Refill Prescription", icon: Pill },
  { label: "Analyze Labs", icon: FlaskConical },
  { label: "Longevity", icon: Timer },
  { label: "Symptoms", icon: Stethoscope },
  { label: "Diet", icon: Apple },
];

export function Hero() {
  const [query, setQuery] = useState("");

  return (
    <section className="relative px-4 sm:px-6 lg:px-10 py-3">
      <div className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[28px]">
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

        <div className="relative flex flex-col items-center px-6 py-12 sm:py-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm px-4 py-2 text-[13px] font-medium text-primary shadow-[0_1px_0_0_rgba(0,0,0,0.03)]">
            <ShieldCheck className="h-4 w-4" strokeWidth={2.25} />
            HIPAA Compliant · Board-Certified Clinicians
          </div>

          <h1 className="mt-10 max-w-4xl font-display text-[clamp(2.75rem,6vw,5.5rem)] leading-[1.02] tracking-[-0.02em] text-text-primary">
            Your AI doctor for a<br className="hidden sm:block" /> longer,
            healthier life
          </h1>

          <p className="mt-6 max-w-2xl text-lg sm:text-xl text-text-primary/80 leading-relaxed">
            Primary care, supported by AI, that never closes, never rushes you,
            and never forgets the details
          </p>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-10 w-full max-w-2xl"
          >
            <label htmlFor="hero-ask" className="sr-only">
              Ask Medeaz anything
            </label>
            <div className="flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-md pr-2 pl-6 py-2 shadow-[0_6px_30px_-8px_rgba(15,76,92,0.18)] border border-white/40">
              <input
                id="hero-ask"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask Medeaz anything..."
                className="flex-1 h-12 bg-transparent text-base text-text-primary placeholder:text-text-secondary focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Ask"
                className="h-11 w-11 flex-none inline-flex items-center justify-center rounded-full bg-primary text-white cursor-pointer transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <ArrowRight className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 max-w-2xl">
            {CHIPS.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => setQuery(label)}
                className="inline-flex items-center gap-2 rounded-full bg-white/70 backdrop-blur-sm px-4 py-2 text-[13px] font-medium text-text-primary cursor-pointer transition-colors hover:bg-white hover:text-primary border border-white/40"
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
