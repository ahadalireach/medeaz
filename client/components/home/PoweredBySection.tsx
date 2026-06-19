"use client";

import {
  BrainCircuit,
  Globe2,
  Layers,
  Radio,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

type PillarTone = "teal" | "cream" | "lavender" | "mint";

type Pillar = {
  icon: LucideIcon;
  title: string;
  description: string;
  stack: string[];
  tone: PillarTone;
};

const TONE_STYLES: Record<PillarTone, { panel: string; iconBg: string }> = {
  teal: {
    panel: "bg-[linear-gradient(135deg,#e3eff2_0%,#f0f5f2_100%)]",
    iconBg: "bg-white",
  },
  cream: {
    panel: "bg-[linear-gradient(135deg,#fdf4e7_0%,#f6f1ea_100%)]",
    iconBg: "bg-white",
  },
  lavender: {
    panel: "bg-[linear-gradient(135deg,#ede9f7_0%,#f1edfa_100%)]",
    iconBg: "bg-white",
  },
  mint: {
    panel: "bg-[linear-gradient(135deg,#d7e6ea_0%,#e6eef1_100%)]",
    iconBg: "bg-white",
  },
};

export function PoweredBySection() {
  const { language } = useLanguage();
  const isUrdu = language === "ur";

  const pillars: Pillar[] = isUrdu
    ? [
        {
          icon: BrainCircuit,
          title: "AI انٹیلیجنس",
          description:
            "وائس ٹرانسکرپشن اور کلینیکل سمریز کو قابلِ عمل نوٹس میں تبدیل کریں۔",
          stack: ["Google Gemini", "وائس NLP", "اردو + انگلش"],
          tone: "teal",
        },
        {
          icon: Radio,
          title: "ریئل ٹائم سنک",
          description:
            "ڈاکٹر، کلینک اور پیشنٹ پورٹلز کو لائیو WebSocket چینلز پر جوڑیں۔",
          stack: ["Socket.io", "Upstash Redis", "Event Streams"],
          tone: "lavender",
        },
        {
          icon: ShieldCheck,
          title: "محفوظ بنیاد",
          description:
            "انکرپٹڈ ریکارڈز، JWT توثیق اور ہر اسکیما پر اسٹرکچرڈ ویلیڈیشن۔",
          stack: ["MongoDB", "JWT + bcrypt", "Joi Validation"],
          tone: "cream",
        },
        {
          icon: Layers,
          title: "ماڈرن تجربہ",
          description:
            "تیز لوڈ، رسپانسیو UI اور ہموار موشن جو ہر ڈیوائس پر شاندار لگے۔",
          stack: ["Next.js 16", "React 19", "Tailwind + Motion"],
          tone: "mint",
        },
      ]
    : [
        {
          icon: BrainCircuit,
          title: "AI intelligence",
          description:
            "Turn voice transcripts and clinical summaries into actionable notes.",
          stack: ["Google Gemini", "Voice NLP", "Urdu + English"],
          tone: "teal",
        },
        {
          icon: Radio,
          title: "Real-time sync",
          description:
            "Keep doctor, clinic, and patient portals connected over live WebSocket channels.",
          stack: ["Socket.io", "Upstash Redis", "Event streams"],
          tone: "lavender",
        },
        {
          icon: ShieldCheck,
          title: "Secure foundation",
          description:
            "Encrypted records, JWT authentication, and structured validation on every schema.",
          stack: ["MongoDB", "JWT + bcrypt", "Joi validation"],
          tone: "cream",
        },
        {
          icon: Layers,
          title: "Modern experience",
          description:
            "Fast loads, responsive UI, and smooth motion that feels great on every device.",
          stack: ["Next.js 16", "React 19", "Tailwind + Motion"],
          tone: "mint",
        },
      ];

  const trustItems = isUrdu
    ? [
        { icon: Globe2, label: "اردو + انگلش" },
        { icon: Zap, label: "ریئل ٹائم اپ ڈیٹس" },
        { icon: ShieldCheck, label: "ڈیزائن سے محفوظ" },
        { icon: Sparkles, label: "AI اسسٹڈ ورک فلو" },
      ]
    : [
        { icon: Globe2, label: "Urdu + English" },
        { icon: Zap, label: "Real-time updates" },
        { icon: ShieldCheck, label: "Secure by design" },
        { icon: Sparkles, label: "AI-assisted workflow" },
      ];

  return (
    <section className="px-4 sm:px-6 lg:px-10 py-16 sm:py-28">
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-[900px] text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-muted px-3 py-1.5 text-[11px] sm:text-[12px] font-semibold tracking-wide uppercase text-primary">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
            {isUrdu ? "جدید کلینکس کے لیے" : "Built for modern clinics"}
          </div>
          <h2 className="mt-5 sm:mt-6 font-display text-[clamp(1.85rem,6.5vw,3.25rem)] leading-[1.08] sm:leading-[1.05] tracking-[-0.02em] text-text-primary">
            {isUrdu
              ? "AI، ریئل ٹائم انفراسٹرکچر، اور ملٹی لنگول ورک فلوز سے تقویت یافتہ"
              : "Powered by AI, real-time infrastructure, and multilingual workflows"}
          </h2>
          <p className="mt-4 sm:mt-5 text-[15px] sm:text-[17px] text-text-secondary max-w-xl mx-auto leading-relaxed">
            {isUrdu
              ? "Medeaz ایک ہی پلیٹ فارم پر ڈاکٹروں، کلینکس اور مریضوں کی سپورٹ کے لیے Next.js، Node.js، MongoDB، Redis، WebSockets اور AI سروسز استعمال کرتا ہے۔"
              : "Medeaz combines Next.js, Node.js, MongoDB, Redis, WebSockets, and AI services to support doctors, clinics, and patients on one platform."}
          </p>
        </div>

        <div className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {pillars.map((pillar) => (
            <PillarCard key={pillar.title} {...pillar} />
          ))}
        </div>

        <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
          {trustItems.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-border-light bg-white/70 backdrop-blur-sm px-3 py-1.5 text-[11.5px] sm:text-[12.5px] font-medium text-text-primary"
            >
              <Icon
                className="h-3.5 w-3.5 text-primary"
                strokeWidth={2.2}
              />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function PillarCard({ icon: Icon, title, description, stack, tone }: Pillar) {
  const styles = TONE_STYLES[tone];

  return (
    <article
      className={`relative overflow-hidden rounded-[20px] border border-border-light ${styles.panel} p-5 sm:p-6 flex flex-col gap-4 min-h-[240px] sm:min-h-[260px]`}
    >
      <div
        className={`${styles.iconBg} h-11 w-11 rounded-xl border border-border-light/70 flex items-center justify-center shadow-[0_4px_14px_-8px_rgba(15,76,92,0.2)]`}
      >
        <Icon className="h-5 w-5 text-primary" strokeWidth={1.9} />
      </div>

      <div>
        <h3 className="font-display text-[18px] sm:text-[19px] font-semibold tracking-[-0.01em] text-text-primary">
          {title}
        </h3>
        <p className="mt-1.5 text-[13px] sm:text-[13.5px] leading-relaxed text-text-secondary">
          {description}
        </p>
      </div>

      <ul className="mt-auto flex flex-wrap gap-1.5">
        {stack.map((item) => (
          <li
            key={item}
            className="inline-flex items-center rounded-full bg-white/85 border border-border-light/70 px-2.5 py-1 text-[11px] sm:text-[11.5px] font-medium text-text-primary/85"
          >
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
