"use client";

import { useState } from "react";
import { useGetFollowUpsQuery } from "@/store/api/patientApi";
import FollowUpCard from "@/components/patient/follow-ups/FollowUpCard";
import FollowUpTabs from "@/components/patient/follow-ups/FollowUpTabs";
import FollowUpEmptyState from "@/components/patient/follow-ups/FollowUpEmptyState";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/shared/PageHeader";

export default function FollowUpsPage() {
  const t = useTranslations("patient.followUps");
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "all">("upcoming");

  // Fetch all follow-ups to calculate counts in memory for instant tab switching
  const { data, isLoading, isError, refetch } = useGetFollowUpsQuery({ status: "all" });

  const allFollowUps = data?.data || [];

  // Categorize follow-ups
  const upcomingList = allFollowUps.filter((f: any) => f.status === "pending");
  const pastList = allFollowUps.filter(
    (f: any) => f.status === "completed" || f.status === "overdue"
  );

  const counts = {
    upcoming: upcomingList.length,
    past: pastList.length,
    all: allFollowUps.length,
  };

  const displayedList =
    activeTab === "upcoming"
      ? upcomingList
      : activeTab === "past"
      ? pastList
      : allFollowUps;

  return (
    <div className="space-y-8 pb-20 px-2 sm:px-4">
      {/* Header */}
      <PageHeader 
        title={t("pageTitle")} 
        description={t("pageDesc")} 
      />

      {/* Tabs */}
      <div className="flex justify-start">
        <FollowUpTabs activeTab={activeTab} setActiveTab={setActiveTab} counts={counts} />
      </div>

      {/* Main List Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 4].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl bg-gray-100 border border-gray-200"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 rounded-3xl border border-red-100 bg-red-50/50 flex flex-col items-center text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
          <h3 className="font-bold text-red-700">{t("failedLoad")}</h3>
          <p className="text-xs text-red-500 mt-1 max-w-sm">
            {t("errorLoading")}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
          >
            {t("retry")}
          </button>
        </div>
      ) : displayedList.length === 0 ? (
        <FollowUpEmptyState activeTab={activeTab} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedList.map((followUp: any) => (
            <FollowUpCard key={followUp._id} followUp={followUp} />
          ))}
        </div>
      )}
    </div>
  );
}
