"use client";

import Link from "next/link";
import { ArrowUpRight, BarChart3, FileText, Mic } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

type InsightCard = {
  title: string;
  description: string;
  cta: string;
  href: string;
  icon: LucideIcon;
  gradient: string;
  iconTone: string;
};

export function InsightsSection() {
  const { language } = useLanguage();
  const isUrdu = language === "ur";

  const cards: InsightCard[] = isUrdu
    ? [
        {
          title: "کنسلٹیشن",
          description: "آواز سے چلنے والی کنسلٹیشن جو نوٹس اور فیصلے خودکار بناتی ہے۔",
          cta: "شروع کریں",
          href: "/login",
          icon: Mic,
          gradient: "bg-[#f0faf7]",
          iconTone: "text-primary",
        },
        {
          title: "پریسکرپشن",
          description: "ڈیجیٹل پریسکرپشن اور فالو اپ ایک ہی مسلسل کیئر سائیکل میں۔",
          cta: "مزید جانیں",
          href: "/docs",
          icon: FileText,
          gradient: "bg-[#f0faf7]",
          iconTone: "text-primary",
        },
        {
          title: "انسائٹس",
          description: "ورک فلو ڈیٹا کو واضح، قابلِ عمل انسائٹس میں بدل دیں۔",
          cta: "ڈیش بورڈ دیکھیں",
          href: "/login",
          icon: BarChart3,
          gradient: "bg-[#f0faf7]",
          iconTone: "text-primary",
        },
      ]
    : [
        {
          title: "Consultation",
          description: "Voice-powered consultations that capture notes and decisions for you.",
          cta: "Start Consulting",
          href: "/login",
          icon: Mic,
          gradient: "bg-[#f0faf7]",
          iconTone: "text-primary",
        },
        {
          title: "Prescriptions",
          description: "Digital prescriptions and follow-ups linked into one continuous care cycle.",
          cta: "Learn More",
          href: "/docs",
          icon: FileText,
          gradient: "bg-[#f0faf7]",
          iconTone: "text-primary",
        },
        {
          title: "Insights",
          description: "Turn workflow data into clear, actionable insights for every clinic.",
          cta: "View Dashboard",
          href: "/login",
          icon: BarChart3,
          gradient: "bg-[#f0faf7]",
          iconTone: "text-primary",
        },
      ];

  return (
    <section className="px-4 sm:px-6 lg:px-10 py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-[1250px]">
        <div className="mx-auto max-w-[760px] text-center mb-10 sm:mb-14">
          <h2 className="font-display text-[clamp(1.9rem,5vw,3.4rem)] leading-[1.08] tracking-[-0.02em] font-bold text-text-primary">
            {isUrdu
              ? "کلینک ورک فلو کو واضح، قابلِ عمل انسائٹس میں بدلیں"
              : "Turn clinic workflow into clear, actionable insights"}
          </h2>
          <p className="mt-4 text-[15px] sm:text-[17px] text-text-secondary leading-relaxed font-normal">
            {isUrdu
              ? "Medeaz رجسٹریشن، کنسلٹیشن، پریسکرپشن اور فالو اپ کو ایک مسلسل کیئر سائیکل میں رکھتا ہے تاکہ فیصلے تیز بھی ہوں اور بہتر بھی۔"
              : "Medeaz connects registration, consultation, prescription, and follow-up into one care cycle so decisions become faster and better."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {cards.map((card) => (
              <article
                key={card.title}
                className={`relative overflow-hidden rounded-2xl border border-[#d1ece5] ${card.gradient} px-6 sm:px-8 py-8 sm:py-10 flex flex-col items-center text-center min-h-80 sm:min-h-90`}
              >

                <div className="relative mb-6 flex h-[92px] w-[92px] items-center justify-center">
                  <svg
                    viewBox="0 0 100 100"
                    className="absolute inset-0 h-full w-full drop-shadow-[0_10px_22px_rgba(13,32,51,0.08)]"
                    aria-hidden
                  >
                    <path
                      d="M50 4c7.5 0 11.5 5.5 14.5 10.5 3-4 10-7 16-2 6.5 5.5 3.5 13 0 17 5.5 1 12 6 12 13.5s-6.5 12.5-12 13.5c3.5 4 6.5 11.5 0 17-6 5-13 2-16-2C61.5 77.5 57.5 83 50 83c-7.5 0-11.5-5.5-14.5-10.5-3 4-10 7-16 2-6.5-5.5-3.5-13 0-17C14 56.5 7.5 51.5 7.5 43s6.5-12.5 12-13.5c-3.5-4-6.5-11.5 0-17 6-5 13-2 16 2C38.5 9.5 42.5 4 50 4z"
                      fill="white"
                    />
                  </svg>
                  <card.icon
                    className={`relative h-7 w-7 sm:h-8 sm:w-8 ${card.iconTone}`}
                    strokeWidth={1.8}
                  />
                </div>

                <h3 className="relative font-display text-[22px] sm:text-[24px] font-semibold tracking-[-0.01em] text-text-primary">
                  {card.title}
                </h3>

                <p className="relative mt-3 text-[14px] sm:text-[15px] leading-relaxed text-text-secondary max-w-[30ch]">
                  {card.description}
                </p>

                <Link
                  href={card.href}
                  className="relative mt-auto pt-6 sm:pt-8"
                  aria-label={card.cta}
                >
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-4 sm:px-5 py-2 sm:py-2.5 text-[13px] sm:text-[14px] font-medium text-text-primary shadow-[0_4px_14px_-8px_rgba(13,32,51,0.25)] transition-colors hover:bg-white">
                    {card.cta}
                    <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                  </span>
                </Link>
              </article>
            ))}
        </div>
      </div>
    </section>
  );
}
