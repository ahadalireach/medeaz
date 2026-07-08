"use client";

import React, { useState } from "react";
import {
  useGetPerformanceLeaderboardQuery,
} from "@/store/api/clinicApi";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import {
  Trophy,
  ArrowUp,
  ArrowDown,
  Minus,
  Download,
  Users,
  Star,
  Activity,
  DollarSign,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { resolveMediaUrl } from "@/lib/media";
import DoctorPerformanceDrawer from "@/components/clinic/performance/DoctorPerformanceDrawer";

type PeriodType = "week" | "month" | "quarter" | "all";

export default function PerformanceLeaderboardPage() {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === "ur";

  const [period, setPeriod] = useState<PeriodType>("month");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useGetPerformanceLeaderboardQuery(period);

  const leaderboard = data?.data?.leaderboard || [];
  const totals = data?.data?.clinicTotals;
  const prevTotals = data?.data?.prevTotals;

  // Split into top 3 (podium) and the rest (table)
  // Standard podium layout: 2nd place on Left, 1st place in Center, 3rd place on Right
  const topThree = leaderboard.slice(0, 3);
  const remainingDoctors = leaderboard.slice(3);

  // Reorder top 3 for Olympic layout: [2nd, 1st, 3rd]
  const podiumDoctors = (() => {
    if (topThree.length === 0) return [];
    if (topThree.length === 1) return [topThree[0]];
    if (topThree.length === 2) return [topThree[1], topThree[0]];
    return [topThree[1], topThree[0], topThree[2]];
  })();

  const handleExport = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken") || "";
      const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
      const response = await fetch(
        `${apiBaseUrl}/clinic/performance/export?period=${period}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export CSV");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `performance_${period}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to export performance data. Please try again.");
    }
  };


  const getRankChangeIcon = (change: number, isDarkBg?: boolean) => {
    if (change > 0) {
      return (
        <span className="flex items-center gap-0.5 text-xs font-black text-emerald-600">
          <ArrowUp className="h-3 w-3 shrink-0" />
          {change}
        </span>
      );
    }
    if (change < 0) {
      return (
        <span className="flex items-center gap-0.5 text-xs font-black text-red-500">
          <ArrowDown className="h-3 w-3 shrink-0" />
          {Math.abs(change)}
        </span>
      );
    }
    return (
      <span className={isDarkBg ? "text-white" : "text-black"}>
        <Minus className="h-3 w-3" />
      </span>
    );
  };


  const getScoreBadgeStyle = (score: number) => {
    if (score >= 85) return "bg-[#00b495]/10 text-[#00b495] border-[#00b495]/20";
    if (score >= 70) return "bg-[#19bca0]/10 text-[#19bca0] border-[#19bca0]/20";
    if (score >= 55) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    return "bg-red-500/10 text-red-600 border-red-500/20";
  };

  return (
    <div className="space-y-8 animate-in" style={{ direction: isRtl ? "rtl" : "ltr" }}>
      {/* Header Panel */}
      <PageHeader
        title={t("clinic.performance.title")}
        description={t("clinic.performance.description")}
        action={
          <div className="flex flex-wrap items-center gap-3">
            {/* Period Selector */}
            <div className="flex bg-white p-1 rounded-2xl border border-black/5 shadow-sm">
              {(["week", "month", "quarter", "all"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    period === p
                      ? "bg-[#00b495] text-white shadow-sm"
                      : "text-text-primary hover:text-[#00b495]"
                  }`}
                >
                  {t(`clinic.period.${p}`)}
                </button>
              ))}
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExport}
              disabled={leaderboard.length === 0}
              className="flex items-center gap-2 bg-[#00b495] text-white px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#00b495]/90 transition-all shadow-lg shadow-[#00b495]/20 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:shadow-none disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              {t("clinic.performance.exportCSV")}
            </button>

          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-6">
          <div className="h-64 bg-white rounded-3xl animate-pulse" />
          <div className="h-96 bg-white rounded-3xl animate-pulse" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-black/5 shadow-sm text-center">
          <Trophy className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-sm font-semibold text-text-primary">
            {t("clinic.performance.noData")}
          </p>
        </div>
      ) : (
        <>
          {/* Clinic Summary Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all">
              <span className="text-[10px] font-black text-black uppercase tracking-widest block">
                {t("clinic.performance.bestDoctor")}
              </span>
              <span className="text-lg font-black text-gray-900 block mt-1 truncate">
                {leaderboard[0]?.fullName}
              </span>
              <span className="text-[10px] text-[#00b495] font-bold block mt-1">
                {t("clinic.performance.score")}: {leaderboard[0]?.score}/100
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all">
              <span className="text-[10px] font-black text-black uppercase tracking-widest block">
                {t("clinic.performance.avgClinicRating")}
              </span>
              <span className="text-2xl font-black text-gray-900 block mt-1">
                {totals?.avgRating !== null ? (
                  <span className="flex items-center gap-1">
                    {totals?.avgRating?.toFixed(1)}
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400 inline" />
                  </span>
                ) : (
                  "—"
                )}
              </span>
              <span className="text-[10px] text-black font-bold block mt-1">
                {t("clinic.performance.acrossAllDoctors")}
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all">
              <span className="text-[10px] font-black text-black uppercase tracking-widest block">
                {t("clinic.performance.totalAppointments")}
              </span>
              <span className="text-2xl font-black text-gray-900 block mt-1">
                {totals?.totalAppointments?.toLocaleString() || "0"}
              </span>
              {prevTotals?.totalAppointments !== undefined && (
                <span
                  className={`text-[10px] font-bold block mt-1 ${
                    totals.totalAppointments - prevTotals.totalAppointments >= 0
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {totals.totalAppointments - prevTotals.totalAppointments >= 0 ? "+" : ""}
                  {(totals.totalAppointments - prevTotals.totalAppointments).toLocaleString()}{" "}
                  {t("clinic.performance.vsLastPeriod")}
                </span>
              )}
            </div>

            <div className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all">
              <span className="text-[10px] font-black text-black uppercase tracking-widest block">
                {t("clinic.performance.clinicRevenue")}
              </span>
              <span className="text-2xl font-black text-[#00b495] block mt-1">
                ₨ {totals?.totalRevenue?.toLocaleString() || "0"}
              </span>
              {prevTotals?.totalRevenue !== undefined && (
                <span
                  className={`text-[10px] font-bold block mt-1 ${
                    totals.totalRevenue - prevTotals.totalRevenue >= 0
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {totals.totalRevenue - prevTotals.totalRevenue >= 0 ? "+" : ""}
                  ₨ {(totals.totalRevenue - prevTotals.totalRevenue).toLocaleString()}{" "}
                  {t("clinic.performance.vsLastPeriod")}
                </span>
              )}
            </div>
          </div>

          {/* Podium Component */}
          <div className="bg-[#0f4c5c] rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden shadow-xl border border-[#0f4c5c]">
            {/* Background design accents */}
            <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-0 bottom-0 w-80 h-80 bg-[#00b495]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2 !text-white">
                <Trophy className="h-5 w-5 text-amber-400" />
                {t("clinic.performance.podium")}
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-3.5 py-1.5 rounded-full border border-white/5">
                {t(`clinic.period.${period}`)}
              </span>
            </div>

            {/* Podium structure */}
            <div className="flex items-end justify-center gap-4 lg:gap-8 min-h-[300px] pt-12 max-w-2xl mx-auto relative z-10">
              {podiumDoctors.map((doc: any, index: number) => {
                // Determine placement based on our reordering: [2nd, 1st, 3rd]
                const isFirst = doc.rank === 1;
                const isSecond = doc.rank === 2;
                const isThird = doc.rank === 3;

                // Set styles per rank
                let heightClass = "h-36";
                let badgeColor = "bg-gray-400";
                let podiumColor = "bg-white/10";
                if (isFirst) {
                  heightClass = "h-48";
                  badgeColor = "bg-amber-400 text-[#0f4c5c]";
                  podiumColor = "bg-white/20 border-b-4 border-[#00b495]";
                } else if (isSecond) {
                  heightClass = "h-40";
                  badgeColor = "bg-slate-300 text-[#0f4c5c]";
                } else if (isThird) {
                  heightClass = "h-32";
                  badgeColor = "bg-amber-600";
                }

                return (
                  <motion.div
                    key={doc.doctorId}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 80,
                      damping: 15,
                      delay: index * 0.1,
                    }}
                    onClick={() => setSelectedDoctorId(doc.doctorId)}
                    className="flex-1 flex flex-col items-center cursor-pointer group"
                  >
                    {/* Doctor Avatar */}
                    <div className="relative mb-3 flex flex-col items-center">
                      <div
                        className={`h-14 w-14 lg:h-18 lg:w-18 rounded-full overflow-hidden border-2 bg-[#0f4c5c] shrink-0 transition-transform group-hover:scale-105 ${
                          isFirst ? "border-amber-400 ring-4 ring-amber-400/20" : "border-white/20"
                        }`}
                      >
                        {doc.photo ? (
                          <img
                            src={resolveMediaUrl(doc.photo)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-white font-bold">
                            {doc.fullName?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div
                        className={`absolute -bottom-1.5 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-md ${badgeColor}`}
                      >
                        {doc.rank}
                      </div>
                    </div>

                    {/* Name */}
                    <p className="text-xs lg:text-sm font-black text-center max-w-[120px] truncate !text-white">
                      {doc.fullName}
                    </p>
                    <p className="text-[10px] text-white font-bold tracking-wider mt-0.5">
                      {doc.score} {t("clinic.performance.score").toLowerCase()}
                    </p>

                    {/* Podium block */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: isFirst ? 140 : isSecond ? 110 : 80 }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                      className={`w-full ${podiumColor} rounded-t-2xl mt-4 flex items-center justify-center flex-col p-3`}
                    >
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                        {t("clinic.performance.rank")} {doc.rank}
                      </span>
                      <span className="mt-1">{getRankChangeIcon(doc.rankChange, true)}</span>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Table / Leaderboard List */}
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900">
                {t("clinic.performance.leaderboard")}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" style={{ textAlign: isRtl ? "right" : "left" }}>
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-black text-black uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">{t("clinic.performance.rank")}</th>
                    <th className="px-6 py-4">{t("clinic.performance.doctor")}</th>
                    <th className="px-6 py-4">{t("clinic.performance.appointments")}</th>
                    <th className="px-6 py-4">{t("clinic.performance.completion")}</th>
                    <th className="px-6 py-4">{t("clinic.performance.rating")}</th>
                    <th className="px-6 py-4">{t("clinic.performance.onTime")}</th>
                    <th className="px-6 py-4">{t("clinic.performance.revenue")}</th>
                    <th className="px-6 py-4 text-center">{t("clinic.performance.score")}</th>
                    <th className="px-6 py-4 text-center">{t("clinic.performance.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leaderboard.map((doc: any) => (
                    <tr
                      key={doc.doctorId}
                      onClick={() => setSelectedDoctorId(doc.doctorId)}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                    >
                      {/* Rank */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-gray-900">#{doc.rank}</span>
                          <span>{getRankChangeIcon(doc.rankChange)}</span>
                        </div>
                      </td>

                      {/* Doctor Info */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full overflow-hidden bg-[#0f4c5c]/5 flex items-center justify-center shrink-0 border border-gray-100">
                            {doc.photo ? (
                              <img
                                src={resolveMediaUrl(doc.photo)}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="text-xs font-bold text-[#0f4c5c]">
                                {doc.fullName?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900 group-hover:text-[#00b495] transition-colors">
                              {doc.fullName}
                            </p>
                            <p className="text-[10px] text-black font-bold">
                              {doc.specialization || ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Appointments count */}
                      <td className="px-6 py-4.5 text-xs font-bold text-black">
                        {doc.totalAppointments}
                      </td>

                      {/* Completion rate */}
                      <td className="px-6 py-4.5 text-xs font-bold text-black">
                        {doc.completionRate !== null
                          ? `${(doc.completionRate * 100).toFixed(0)}%`
                          : "—"}
                      </td>

                      {/* Avg Rating */}
                      <td className="px-6 py-4.5">
                        {doc.avgRating !== null ? (
                          <div className="flex items-center gap-1 text-xs font-bold text-black">
                            {doc.avgRating.toFixed(1)}
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          </div>
                        ) : (
                          <span className="text-xs text-black">—</span>
                        )}
                      </td>

                      {/* On-Time Rate */}
                      <td className="px-6 py-4.5 text-xs font-bold text-black">
                        {doc.onTimeRate !== null
                          ? `${(doc.onTimeRate * 100).toFixed(0)}%`
                          : "—"}
                      </td>

                      {/* Revenue */}
                      <td className="px-6 py-4.5 text-xs font-bold text-black">
                        ₨ {doc.totalRevenue?.toLocaleString() || "0"}
                      </td>

                      {/* Composite Score */}
                      <td className="px-6 py-4.5 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-black border ${getScoreBadgeStyle(
                            doc.score
                          )}`}
                        >
                          {doc.score}
                        </span>
                      </td>

                      {/* View Details Button */}
                      <td className="px-6 py-4.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedDoctorId(doc.doctorId)}
                          className="text-xs font-black text-[#00b495] hover:text-[#00b495]/80 transition-colors uppercase tracking-wider"
                        >
                          {t("clinic.performance.viewDetails")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Slide-out Deep-Dive Drawer */}
      {selectedDoctorId && (
        <DoctorPerformanceDrawer
          isOpen={!!selectedDoctorId}
          onClose={() => setSelectedDoctorId(null)}
          doctorId={selectedDoctorId}
          period={period}
        />
      )}
    </div>
  );
}
