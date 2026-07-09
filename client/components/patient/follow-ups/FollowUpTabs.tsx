"use client";

import { useTranslations } from "next-intl";

interface FollowUpTabsProps {
  activeTab: "upcoming" | "past" | "all";
  setActiveTab: (tab: "upcoming" | "past" | "all") => void;
  counts: {
    upcoming: number;
    past: number;
    all: number;
  };
}

export default function FollowUpTabs({ activeTab, setActiveTab, counts }: FollowUpTabsProps) {
  const t = useTranslations("patient.followUps");

  const tabs = [
    { id: "upcoming" as const, label: t("tabs.upcoming"), count: counts.upcoming },
    { id: "past" as const, label: t("tabs.past"), count: counts.past },
    { id: "all" as const, label: t("tabs.all"), count: counts.all },
  ];

  return (
    <div className="flex bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200/50 w-full sm:w-fit gap-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              isActive
                ? "bg-[#00b495] text-white shadow-sm"
                : "text-[#374151] hover:bg-gray-200/60"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-gray-250 text-gray-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
