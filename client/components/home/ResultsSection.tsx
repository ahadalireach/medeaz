"use client";

import { BarChart3, BellRing, FileText, Mic } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

type ResultCardData = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
};


export function ResultsSection() {
  const { language } = useLanguage();
  const isUrdu = language === "ur";

  const cards: ResultCardData[] = isUrdu
    ? [
        { icon: Mic,      eyebrow: "تیز آغاز",       title: "وائس ڈرافٹ سے فوری پریسکرپشن",     body: "ڈاکٹر کی گفتگو کو اسٹرکچرڈ نوٹس اور پریسکرپشن ڈرافٹ میں تبدیل کریں۔" },
        { icon: BarChart3, eyebrow: "کم لاگت",        title: "کلینک انسائٹس ایک ہی اسکرین میں",  body: "اپائنٹمنٹ فلو، فالو اپ ریٹ اور پرفارمنس ٹرینڈز کو ایک ساتھ دیکھیں۔" },
        { icon: FileText,  eyebrow: "اسکیل ایبل",     title: "ریکارڈز کے ساتھ مسلسل کیئر",       body: "پیشنٹ ہسٹری، وزٹ نوٹس اور پریسکرپشن کو مستقل ٹائم لائن میں منظم رکھیں۔" },
        { icon: BellRing,  eyebrow: "محفوظ اور مستقل", title: "فالو اپ اور نوٹیفکیشن کنٹرول",   body: "یاددہانی اور کمیونیکیشن فلو کے ساتھ مریض کی مسلسل انگیجمنٹ برقرار رکھیں۔" },
      ]
    : [
        { icon: Mic,      eyebrow: "Fastest",            title: "Instant drafts from voice consultations",   body: "Convert doctor conversation into structured notes and prescription-ready drafts." },
        { icon: BarChart3, eyebrow: "Cost-effective",    title: "Clinic insights in one operational view",   body: "Track appointment flow, follow-up rate, and performance trends in one place." },
        { icon: FileText,  eyebrow: "Scalable",          title: "Continuity with connected records",         body: "Keep patient history, visit notes, and prescriptions organized on a single timeline." },
        { icon: BellRing,  eyebrow: "Secure and consistent", title: "Follow-up and notification control",   body: "Maintain patient engagement with reminders and consistent communication flow." },
      ];

  return (
    <section className="px-4 sm:px-6 lg:px-10 py-16 sm:py-28 bg-[#f8faf9]">
      <div className="mx-auto max-w-[900px] text-center">
        <h2 className="font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] tracking-[-0.02em] text-text-primary">
          {isUrdu ? (
            <>
              Medeaz ماڈیولز کو
              <br className="hidden sm:block" /> حقیقی کلینک نتائج میں بدلیں
            </>
          ) : (
            <>
              Turn Medeaz modules
              <br className="hidden sm:block" /> into measurable clinic outcomes
            </>
          )}
        </h2>
        <p className="mt-4 sm:mt-5 text-[15px] sm:text-[17px] text-text-secondary max-w-xl mx-auto leading-relaxed">
          {isUrdu
            ? "چار بنیادی صلاحیتیں، ایک متحد ورک فلو۔ ہر حصہ ڈاکٹر، کلینک اور پیشنٹ کے حقیقی استعمال کے لیے ڈیزائن کیا گیا ہے۔"
            : "Four core capabilities, one connected workflow. Each block is built for real doctor, clinic, and patient usage."}
        </p>
      </div>

      <div className="mx-auto max-w-[1300px] mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {cards.map((card) => (
          <ResultCard key={card.title} {...card} />
        ))}
      </div>
    </section>
  );
}

function ResultCard({
  icon: Icon,
  eyebrow,
  title,
  body,
}: Omit<ResultCardData, "tone">) {
  return (
    <article className="flex gap-4 sm:gap-5 rounded-2xl border border-[#d1ece5] bg-white p-5 sm:p-6 hover:shadow-sm transition-shadow">
      <div className="flex-none h-11 w-11 rounded-xl bg-[#f0faf7] flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" strokeWidth={1.9} />
      </div>
      <div className="min-w-0">
        <p className="text-[15px] sm:text-[16px] leading-snug text-text-primary font-semibold">
          {eyebrow}
        </p>
        <p className="mt-0.5 text-[14px] sm:text-[15px] leading-snug text-text-secondary font-normal">
          {title}
        </p>
        <p className="mt-2.5 text-[13px] sm:text-[13.5px] leading-relaxed text-text-secondary/80">
          {body}
        </p>
      </div>
    </article>
  );
}
