"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const FAQS = [
  {
    q: "What is Medeaz?",
    a: "Medeaz is an AI-supported primary care service. We combine on-demand AI triage and guidance with board-certified clinicians who review and sign off on anything clinical.",
  },
  {
    q: "What can Medeaz actually do for me?",
    a: "Ask health questions, import your full medical history, request prescription refills, analyze lab results, get second opinions, and keep one continuous record across providers.",
  },
  {
    q: "Why should I use Medeaz instead of other AI chat apps?",
    a: "Generic chatbots don’t have your history, can’t prescribe, and aren’t HIPAA-compliant. Medeaz is grounded in your records and every clinical output is reviewed by a licensed clinician.",
  },
  {
    q: "Can I trust Medeaz with real medical decisions and my medical data?",
    a: "Yes. Medeaz is HIPAA compliant, your data is encrypted in transit and at rest, and clinicians make all final medical decisions. AI outputs are advisory, not autonomous.",
  },
  {
    q: "How much does Medeaz cost, and does it work with my insurance?",
    a: "Membership pricing is transparent and monthly. We’re integrating with major insurers; current coverage is listed during sign-up based on your state.",
  },
  {
    q: "In what states does Medeaz currently see patients?",
    a: "We’re expanding quickly. Enter your ZIP during sign-up to confirm availability and which clinicians can see you.",
  },
];

export function FAQsSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="px-4 sm:px-6 lg:px-10 py-20 sm:py-28">
      <div className="mx-auto max-w-[760px] text-center">
        <div className="inline-flex items-center rounded-full bg-primary-muted px-3.5 py-1.5 text-[12px] font-semibold tracking-wide uppercase text-primary">
          FAQs
        </div>
        <h2 className="mt-6 font-display text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-[-0.02em] text-text-primary">
          Have questions?<br className="hidden sm:block" /> Here&apos;s the
          answers
        </h2>
      </div>

      <div className="mx-auto max-w-[760px] mt-12 space-y-3">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={item.q}
              className="rounded-xl bg-white border border-border-light overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer hover:bg-background/50 transition-colors"
              >
                <span className="text-[15px] font-semibold text-text-primary">
                  {item.q}
                </span>
                <span className="flex-none inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary-muted text-primary">
                  {isOpen ? (
                    <Minus className="h-4 w-4" strokeWidth={2.25} />
                  ) : (
                    <Plus className="h-4 w-4" strokeWidth={2.25} />
                  )}
                </span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 -mt-1">
                  <p className="text-[14px] text-text-secondary leading-relaxed max-w-[62ch]">
                    {item.a}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
