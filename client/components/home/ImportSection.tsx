"use client";

import {
  BellRing,
  Building2,
  Check,
  CheckCircle2,
  FileText,
  Stethoscope,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

type TimelineEntryTone = "teal" | "lavender" | "cream";

const TONE_STYLES: Record<TimelineEntryTone, string> = {
  teal: "bg-surface text-primary",
  lavender: "bg-surface-lavender text-primary",
  cream: "bg-surface-cream text-primary",
};

export function ImportSection() {
  const { language } = useLanguage();
  const isUrdu = language === "ur";

  const points = isUrdu
    ? [
        "ڈیجیٹل پیشنٹ ریکارڈز کو ایک ہی ٹائم لائن میں منظم کریں",
        "اپائنٹمنٹس، پریسکرپشنز اور فالو اپس کو کنیکٹڈ پورٹلز سے مینیج کریں",
        "ڈاکٹر، کلینک اور پیشنٹ ڈیٹا کو ریئل ٹائم میں سنک رکھیں",
      ]
    : [
        "Create and organize digital patient records in one timeline",
        "Manage appointments, prescriptions, and follow-ups from connected portals",
        "Keep doctor, clinic, and patient data synchronized in real time",
      ];

  const patient = isUrdu
    ? {
        name: "احد علی",
        meta: "MRN-2487 · آخری وزٹ 3 دن پہلے",
        initials: "AS",
      }
    : {
        name: "Ahad Ali",
        meta: "MRN-2487 · Last visit 3d ago",
        initials: "AS",
      };

  const timeline = isUrdu
    ? [
        {
          icon: Stethoscope,
          title: "وائس کنسلٹیشن",
          meta: "ڈاکٹر خان · 12 منٹ",
          date: "آج",
          tone: "teal" as TimelineEntryTone,
        },
        {
          icon: FileText,
          title: "پریسکرپشن جاری",
          meta: "5 ادویات · سائن شدہ",
          date: "آج",
          tone: "lavender" as TimelineEntryTone,
        },
        {
          icon: BellRing,
          title: "فالو اپ طے",
          meta: "29 اپریل · 10:30 صبح",
          date: "7 دن میں",
          tone: "cream" as TimelineEntryTone,
        },
      ]
    : [
        {
          icon: Stethoscope,
          title: "Voice consultation",
          meta: "Dr. Khan · 12 min",
          date: "Today",
          tone: "teal" as TimelineEntryTone,
        },
        {
          icon: FileText,
          title: "Prescription issued",
          meta: "5 items · signed",
          date: "Today",
          tone: "lavender" as TimelineEntryTone,
        },
        {
          icon: BellRing,
          title: "Follow-up scheduled",
          meta: "Apr 29 · 10:30 AM",
          date: "In 7 days",
          tone: "cream" as TimelineEntryTone,
        },
      ];

  const portals = [
    { icon: Stethoscope, bg: "bg-primary", iconColor: "text-white" },
    { icon: Building2, bg: "bg-surface-lavender", iconColor: "text-primary" },
    { icon: UserRound, bg: "bg-surface-cream", iconColor: "text-primary" },
  ];

  return (
    <section className="px-4 sm:px-6 lg:px-10 py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div>
          <h2 className="font-display text-[clamp(2rem,4vw,3.25rem)] leading-[1.05] tracking-[-0.02em] text-text-primary max-w-md">
            {isUrdu
              ? "ہر پیشنٹ ہسٹری کو محفوظ، سرچ ایبل، اور ہمیشہ دستیاب رکھیں"
              : "Keep every patient history secure, searchable, and always available"}
          </h2>
          <ul className="mt-10 space-y-4 max-w-md">
            {points.map((p) => (
              <li
                key={p}
                className="flex items-start gap-3 text-[15px] leading-relaxed text-text-secondary"
              >
                <span className="mt-0.5 flex-none inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className="text-text-primary/80">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/3] rounded-[20px] bg-gradient-to-br from-surface via-surface-lavender/60 to-surface-cream overflow-hidden border border-border-light p-4 sm:p-6">
            <div className="absolute inset-0 bg-surface-overlay" />

            <div className="relative h-full rounded-[16px] bg-white border border-border-light shadow-[0_20px_50px_-24px_rgba(15,76,92,0.28)] flex flex-col overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light bg-gradient-to-r from-primary-bg to-transparent">
                <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center text-[12px] font-semibold">
                  {patient.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-text-primary truncate">
                    {patient.name}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-text-secondary truncate">
                    {patient.meta}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white border border-border-light">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {isUrdu ? "لائیو" : "Live"}
                  </span>
                </div>
              </div>

              <div className="flex-1 px-4 py-3 flex flex-col justify-center gap-2 sm:gap-2.5">
                {timeline.map((entry) => (
                  <TimelineEntry key={entry.title} {...entry} />
                ))}
              </div>

              <div className="px-4 py-3 border-t border-border-light bg-background/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-medium text-text-secondary whitespace-nowrap">
                    {isUrdu ? "سنک:" : "Synced:"}
                  </span>
                  <div className="flex -space-x-1.5">
                    {portals.map((portal, i) => (
                      <div
                        key={i}
                        className={`h-6 w-6 rounded-full ${portal.bg} border-2 border-white flex items-center justify-center`}
                      >
                        <portal.icon
                          className={`h-3 w-3 ${portal.iconColor}`}
                          strokeWidth={2.2}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-primary whitespace-nowrap">
                  <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                  <span className="font-semibold">
                    {isUrdu ? "اپ ٹو ڈیٹ" : "Up to date"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineEntry({
  icon: Icon,
  title,
  meta,
  date,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  meta: string;
  date: string;
  tone: TimelineEntryTone;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-light/70 bg-white px-3 py-2">
      <div
        className={`h-8 w-8 flex-none rounded-lg ${TONE_STYLES[tone]} flex items-center justify-center`}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] sm:text-[13px] font-semibold text-text-primary truncate">
          {title}
        </p>
        <p className="text-[10px] sm:text-[11px] text-text-secondary truncate">
          {meta}
        </p>
      </div>
      <span className="text-[10px] sm:text-[11px] font-medium text-text-secondary whitespace-nowrap">
        {date}
      </span>
    </div>
  );
}
