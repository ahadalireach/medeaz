"use client";

import { BarChart3, BellRing, FileText, Mic } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

type Tone = "peach" | "rose" | "blue" | "green";

type ResultCardData = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  tone: Tone;
};

const TONES: Record<Tone, { fill: string; icon: string }> = {
  peach: { fill: "#e3eff2", icon: "text-primary" },
  rose: { fill: "#fdf4e7", icon: "text-primary" },
  blue: { fill: "#ede9f7", icon: "text-primary" },
  green: { fill: "#d7e6ea", icon: "text-primary" },
};

const CLOUD_PATH =
  "M0,0 L85,0 C100,0 108,8 110,22 C128,20 138,36 130,50 C146,56 142,72 126,74 C128,92 112,100 98,90 C94,108 74,108 66,92 C54,108 32,102 34,84 C16,88 2,72 14,58 L0,50 Z";

export function ResultsSection() {
  const { language } = useLanguage();
  const isUrdu = language === "ur";

  const cards: ResultCardData[] = isUrdu
    ? [
        {
          icon: Mic,
          eyebrow: "تیز آغاز",
          title: "وائس ڈرافٹ سے فوری پریسکرپشن",
          body: "ڈاکٹر کی گفتگو کو اسٹرکچرڈ نوٹس اور پریسکرپشن ڈرافٹ میں تبدیل کریں۔",
          tone: "peach",
        },
        {
          icon: BarChart3,
          eyebrow: "کم لاگت",
          title: "کلینک انسائٹس ایک ہی اسکرین میں",
          body: "اپائنٹمنٹ فلو، فالو اپ ریٹ اور پرفارمنس ٹرینڈز کو ایک ساتھ دیکھیں۔",
          tone: "rose",
        },
        {
          icon: FileText,
          eyebrow: "اسکیل ایبل",
          title: "ریکارڈز کے ساتھ مسلسل کیئر",
          body: "پیشنٹ ہسٹری، وزٹ نوٹس اور پریسکرپشن کو مستقل ٹائم لائن میں منظم رکھیں۔",
          tone: "blue",
        },
        {
          icon: BellRing,
          eyebrow: "محفوظ اور مستقل",
          title: "فالو اپ اور نوٹیفکیشن کنٹرول",
          body: "یاددہانی اور کمیونیکیشن فلو کے ساتھ مریض کی مسلسل انگیجمنٹ برقرار رکھیں۔",
          tone: "green",
        },
      ]
    : [
        {
          icon: Mic,
          eyebrow: "Fastest",
          title: "Instant drafts from voice consultations",
          body: "Convert doctor conversation into structured notes and prescription-ready drafts.",
          tone: "peach",
        },
        {
          icon: BarChart3,
          eyebrow: "Cost-effective",
          title: "Clinic insights in one operational view",
          body: "Track appointment flow, follow-up rate, and performance trends in one place.",
          tone: "rose",
        },
        {
          icon: FileText,
          eyebrow: "Scalable",
          title: "Continuity with connected records",
          body: "Keep patient history, visit notes, and prescriptions organized on a single timeline.",
          tone: "blue",
        },
        {
          icon: BellRing,
          eyebrow: "Secure and consistent",
          title: "Follow-up and notification control",
          body: "Maintain patient engagement with reminders and consistent communication flow.",
          tone: "green",
        },
      ];

  return (
    <section className="px-4 sm:px-6 lg:px-10 py-16 sm:py-28">
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
  tone,
}: ResultCardData) {
  const accent = TONES[tone];
  const patternId = `result-grid-${tone}`;

  return (
    <article className="relative overflow-hidden rounded-[20px] sm:rounded-[24px] border border-border-light bg-white min-h-[150px] sm:min-h-[170px]">
      <svg
        viewBox="0 0 150 110"
        className="absolute left-0 top-0 w-[104px] h-[80px] sm:w-[140px] sm:h-[108px] lg:w-[160px] lg:h-[122px]"
        aria-hidden
      >
        <defs>
          <pattern
            id={patternId}
            x="0"
            y="0"
            width="13"
            height="13"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M13 0 L0 0 0 13"
              fill="none"
              stroke="white"
              strokeOpacity="0.55"
              strokeWidth="0.7"
            />
          </pattern>
        </defs>
        <path d={CLOUD_PATH} fill={accent.fill} />
        <path d={CLOUD_PATH} fill={`url(#${patternId})`} />
      </svg>

      <div className="absolute left-[18px] top-[16px] sm:left-[26px] sm:top-[22px] lg:left-[32px] lg:top-[28px] z-10">
        <Icon
          className={`h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 ${accent.icon}`}
          strokeWidth={1.9}
        />
      </div>

      <div className="relative ml-[108px] sm:ml-[144px] lg:ml-[170px] py-4 sm:py-6 pr-4 sm:pr-6 lg:pr-7 flex flex-col justify-center min-h-[150px] sm:min-h-[170px]">
        <p className="text-[14px] sm:text-[16px] lg:text-[17px] leading-[1.45] text-text-secondary">
          <span className="font-semibold text-text-primary">{eyebrow}.</span>{" "}
          {title}.
        </p>
        <p className="mt-2 text-[12.5px] sm:text-[13px] lg:text-[14px] leading-relaxed text-text-secondary/80 max-w-[46ch]">
          {body}
        </p>
      </div>
    </article>
  );
}
