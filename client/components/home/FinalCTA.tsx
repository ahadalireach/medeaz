"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

export function FinalCTA() {
  const { language } = useLanguage();
  const isUrdu = language === "ur";

  return (
    <section className="px-4 sm:px-6 lg:px-10 py-6 pb-10">
      <div className="mx-auto max-w-[1400px]">
        <div
          className="relative overflow-hidden rounded-3xl px-6 sm:px-14 py-16 sm:py-24 bg-[#f0faf7]"
        >
          {/* Top-right teal blob */}
          <div
            className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full opacity-40"
            style={{ background: "radial-gradient(circle, #b3e9df 0%, transparent 65%)" }}
          />
          {/* Bottom-left teal blob */}
          <div
            className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full opacity-30"
            style={{ background: "radial-gradient(circle, #b3e9df 0%, transparent 65%)" }}
          />

          <div className="relative flex flex-col items-center text-center max-w-2xl mx-auto">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-primary/60 mb-5">
              {isUrdu ? "آج ہی شروع کریں" : "Get started today"}
            </p>

            <h2 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.06] tracking-[-0.025em] text-text-primary">
              {isUrdu ? (
                "ڈیجیٹل کیئر کی طرف پہلا قدم اٹھائیں"
              ) : (
                <>
                  Ready to bring your clinic
                  <br className="hidden sm:block" />
                  into the digital age?
                </>
              )}
            </h2>

            <p className="mt-5 text-[15px] sm:text-[16px] text-text-secondary font-normal leading-relaxed max-w-md">
              {isUrdu
                ? "Medeaz کے ساتھ اپنے کلینک کو منظم، تیز اور مربوط بنائیں۔"
                : "Medeaz gives your clinic a connected workflow — from consultation to follow-up."}
            </p>

            <div className="mt-9 flex items-center gap-3 flex-wrap justify-center">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0F4C5C] text-white px-6 py-3 text-[15px] font-semibold hover:bg-[#0a3a47] transition-colors shadow-sm"
              >
                {isUrdu ? "مفت شروع کریں" : "Get started free"}
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-xl border border-[#d1ece5] bg-white text-text-primary px-6 py-3 text-[15px] font-medium hover:border-primary/30 hover:bg-[#f0faf7] transition-colors"
              >
                {isUrdu ? "لاگ اِن" : "Log In"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
