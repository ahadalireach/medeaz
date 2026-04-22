"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

const FAQS_EN = [
  {
    q: "What is Medeaz?",
    a: "Medeaz is a voice-enabled digital healthcare platform for doctors, clinics, and patients. It centralizes records, prescriptions, communication, and operational insights.",
  },
  {
    q: "Who can use Medeaz?",
    a: "Doctors, clinic admins, and patients can each use dedicated modules. Doctors manage consultations and prescriptions, clinics monitor operations, and patients track records and appointments.",
  },
  {
    q: "Does Medeaz support voice-based workflows?",
    a: "Yes. Medeaz is designed around voice-assisted workflows, including voice-to-prescription drafting to reduce manual writing time for healthcare providers.",
  },
  {
    q: "Does Medeaz support Urdu and English?",
    a: "Yes. Medeaz provides multilingual interaction with Urdu and English support to improve accessibility for diverse users.",
  },
  {
    q: "What analytics does Medeaz provide for clinics?",
    a: "Clinic admins can monitor patient flow, scheduling activity, and revenue-related trends to improve operations and decision-making.",
  },
  {
    q: "How does Medeaz improve continuity of care?",
    a: "By keeping appointments, prescriptions, notes, and records connected in one system, Medeaz helps teams and patients avoid fragmented or missing information.",
  },
];

const FAQS_UR = [
  {
    q: "Medeaz کیا ہے؟",
    a: "Medeaz ایک وائس اینیبلڈ ڈیجیٹل ہیلتھ کیئر پلیٹ فارم ہے جو ڈاکٹروں، کلینکس اور مریضوں کے لیے ریکارڈز، پریسکرپشنز، کمیونیکیشن اور آپریشنل انسائٹس کو ایک جگہ لاتا ہے۔",
  },
  {
    q: "Medeaz کون استعمال کر سکتا ہے؟",
    a: "ڈاکٹرز، کلینک ایڈمنز اور مریض سب اپنے متعلقہ ماڈیولز استعمال کر سکتے ہیں۔ ڈاکٹرز کنسلٹیشن اور پریسکرپشنز سنبھالتے ہیں، کلینکس آپریشنز دیکھتے ہیں، اور مریض ریکارڈز اور اپائنٹمنٹس ٹریک کرتے ہیں۔",
  },
  {
    q: "کیا Medeaz وائس بیسڈ ورک فلو سپورٹ کرتا ہے؟",
    a: "جی ہاں، Medeaz وائس اسسٹڈ ورک فلوز کے لیے ڈیزائن کیا گیا ہے، جن میں وائس ٹو پریسکرپشن ڈرافٹنگ شامل ہے تاکہ دستی لکھائی کا وقت کم ہو۔",
  },
  {
    q: "کیا Medeaz اردو اور انگلش سپورٹ کرتا ہے؟",
    a: "جی ہاں، Medeaz متنوع صارفین کے لیے اردو اور انگلش میں ملٹی لنگول انٹریکشن فراہم کرتا ہے۔",
  },
  {
    q: "کلینکس کے لیے Medeaz کون سی اینالیٹکس دیتا ہے؟",
    a: "کلینک ایڈمنز پیشنٹ فلو، شیڈولنگ ایکٹیویٹی، اور ریونیو سے متعلق ٹرینڈز مانیٹر کر سکتے ہیں تاکہ آپریشنز اور فیصلے بہتر ہوں۔",
  },
  {
    q: "Medeaz continuity of care کیسے بہتر بناتا ہے؟",
    a: "اپائنٹمنٹس، پریسکرپشنز، نوٹس اور ریکارڈز کو ایک سسٹم میں جوڑ کر Medeaz بکھری یا گم معلومات کے مسائل کو کم کرتا ہے۔",
  },
];

export function FAQsSection() {
  const [open, setOpen] = useState<number | null>(0);
  const { language } = useLanguage();
  const isUrdu = language === "ur";
  const faqs = isUrdu ? FAQS_UR : FAQS_EN;

  return (
    <section className="px-4 sm:px-6 lg:px-10 py-20 sm:py-28">
      <div className="mx-auto max-w-[760px] text-center">
        <div className="inline-flex items-center rounded-full bg-primary-muted px-3.5 py-1.5 text-[12px] font-semibold tracking-wide uppercase text-primary">
          {isUrdu ? "سوالات" : "FAQs"}
        </div>
        <h2 className="mt-6 font-display text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-[-0.02em] text-text-primary">
          {isUrdu ? (
            <>
              سوالات ہیں؟
              <br className="hidden sm:block" /> یہ ہیں جواب
            </>
          ) : (
            <>
              Have questions?
              <br className="hidden sm:block" /> Here&apos;s the answers
            </>
          )}
        </h2>
      </div>

      <div className="mx-auto max-w-[760px] mt-12 space-y-3">
        {faqs.map((item, i) => {
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
