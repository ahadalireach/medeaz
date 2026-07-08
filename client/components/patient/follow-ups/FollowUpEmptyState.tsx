"use client";

import { CalendarCheck2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface FollowUpEmptyStateProps {
  activeTab: "upcoming" | "past" | "all";
}

export default function FollowUpEmptyState({ activeTab }: FollowUpEmptyStateProps) {
  const t = useTranslations("patient.followUps");

  const getMessages = () => {
    switch (activeTab) {
      case "upcoming":
        return {
          title: t("empty.upcomingTitle"),
          description: t("empty.upcomingDesc"),
        };
      case "past":
        return {
          title: t("empty.pastTitle"),
          description: t("empty.pastDesc"),
        };
      default:
        return {
          title: t("empty.allTitle"),
          description: t("empty.allDesc"),
        };
    }
  };

  const msgs = getMessages();

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white rounded-3xl border border-gray-250/70 shadow-sm">
      <div className="h-16 w-16 rounded-2xl bg-[#e6f8f4] flex items-center justify-center text-[#00b495] mb-4">
        <CalendarCheck2 className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-2">
        {msgs.title}
      </h3>
      <p className="text-sm text-gray-400 font-semibold max-w-sm mb-6">
        {msgs.description}
      </p>
      <Link
        href="/dashboard/patient/book-appointment"
        className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#00b495] text-white hover:bg-[#009b80] font-bold rounded-xl text-xs transition-all shadow-md shadow-[#00b495]/15"
      >
        {t("card.bookAppointment")}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
