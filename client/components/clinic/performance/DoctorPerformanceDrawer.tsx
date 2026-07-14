"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useGetDoctorPerformanceDetailQuery } from "@/store/api/clinicApi";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  Star,
  Users,
  Trophy,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  User,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { resolveMediaUrl } from "@/lib/media";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DoctorPerformanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  doctorId: string;
  period: string;
}

export default function DoctorPerformanceDrawer({
  isOpen,
  onClose,
  doctorId,
  period,
}: DoctorPerformanceDrawerProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === "ur";

  const { data, isLoading, error } = useGetDoctorPerformanceDetailQuery(
    { doctorId, period },
    { skip: !isOpen || !doctorId }
  );

  const detail = data?.data;

  // Local state for window size to support responsive animations
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isOpen) return null;

  const doctor = detail?.doctor;
  const stats = detail?.stats;
  const deltas = detail?.deltas;
  const signals = detail?.signals;
  const flags = detail?.flags || [];
  const score = detail?.score || 0;
  const label = detail?.label || "Average";
  const scoreLabelKey = `clinic.performance.labels.${label.replace(/\s+/g, "")}`;

  // Format date safely
  const formatJoinDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(locale === "ur" ? "ur-PK" : "en-US", {
        year: "numeric",
        month: "long",
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Score badge/gauge color styling
  const getScoreColor = (val: number) => {
    if (val >= 85) return { stroke: "#00b495", text: "text-[#00b495]", bg: "bg-[#00b495]/10" };
    if (val >= 70) return { stroke: "#19bca0", text: "text-[#19bca0]", bg: "bg-[#19bca0]/10" };
    if (val >= 55) return { stroke: "#f59e0b", text: "text-amber-500", bg: "bg-amber-500/10" };
    return { stroke: "#dc2626", text: "text-red-600", bg: "bg-red-600/10" };
  };

  const colors = getScoreColor(score);

  // Revenue chart data formatter
  const revenueChartData = stats?.dailyRevenue
    ? Object.entries(stats.dailyRevenue).map(([date, amount]) => {
        const d = new Date(date);
        return {
          date: d.toLocaleDateString(locale === "ur" ? "ur-PK" : "en-US", {
            month: "short",
            day: "numeric",
          }),
          revenue: amount,
        };
      })
    : [];

  // Determine drawer direction and variants
  // In RTL: slide from LEFT. In LTR: slide from RIGHT.
  // On Mobile: slide from BOTTOM.
  const drawerVariants: Variants = {
    hidden: isMobile
      ? { y: "100%", x: 0 }
      : isRtl
      ? { x: "-100%", y: 0 }
      : { x: "100%", y: 0 },
    visible: {
      x: 0,
      y: 0,
      transition: { type: "spring" as const, damping: 30, stiffness: 300 },
    },
    exit: isMobile
      ? { y: "100%", x: 0 }
      : isRtl
      ? { x: "-100%", y: 0 }
      : { x: "100%", y: 0 },
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-hidden print:hidden" style={{ direction: isRtl ? "rtl" : "ltr" }}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        />

        {/* Drawer container */}
        <div className={`absolute inset-y-0 ${isRtl ? "left-0" : "right-0"} max-w-full flex ${isMobile ? "w-full h-full" : "w-[500px]"}`}>
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full bg-[#f6f8f8] shadow-2xl flex flex-col h-full relative"
          >
            {/* Header (Medeaz Brand style) */}
            <div className="bg-[#0f4c5c] text-white p-6 relative flex flex-col gap-4">
              <button
                onClick={onClose}
                className="absolute top-6 left-6 right-auto p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                style={{ [isRtl ? "right" : "left"]: "auto", [isRtl ? "left" : "right"]: "24px" }}
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-4 mt-2">
                <div className="h-16 w-16 rounded-full border-2 border-[#00b495] overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
                  {isLoading ? (
                    <div className="h-full w-full animate-pulse bg-white/20" />
                  ) : doctor?.photo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={resolveMediaUrl(doctor.photo)}
                      alt={doctor?.name || "Doctor"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-9 w-9 text-white/50" />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <h2 className="text-xl font-bold tracking-tight !text-white">
                    {isLoading ? (
                      <span className="inline-block h-6 w-36 animate-pulse bg-white/20 rounded-lg mt-1" />
                    ) : (
                      `${t("common.doctorPrefix")} ${doctor?.name || ""}`
                    )}
                  </h2>
                  <p className="text-sm text-white/70 font-medium">
                    {isLoading ? (
                      <span className="inline-block h-4 w-24 animate-pulse bg-white/20 rounded-lg mt-1" />
                    ) : (
                      doctor?.specialization || ""
                    )}
                  </p>
                  {!isLoading && doctor?.joinDate && (
                    <p className="text-[11px] text-white/50 font-normal">
                      {t("clinic.performance.drawer.memberSince")}: {formatJoinDate(doctor.joinDate)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoading ? (
                <div className="space-y-6 animate-pulse">
                  <div className="flex items-center justify-center h-48 bg-white rounded-2xl border border-gray-100">
                    <div className="h-8 w-8 border-4 border-[#00b495] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100" />
                    ))}
                  </div>
                  <div className="h-48 bg-white rounded-2xl border border-gray-100" />
                </div>
              ) : error ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 space-y-2">
                  <p className="text-sm font-semibold text-red-500">
                    {t("clinic.performance.noData")}
                  </p>
                </div>
              ) : (
                <>
                  {/* Gauge + Alert Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* circular progress gauge */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                      <div className="relative h-28 w-28 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                          <circle
                            cx="56"
                            cy="56"
                            r="48"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            fill="transparent"
                          />
                          <motion.circle
                            cx="56"
                            cy="56"
                            r="48"
                            stroke={colors.stroke}
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 48}
                            initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                            animate={{
                              strokeDashoffset:
                                2 * Math.PI * 48 * (1 - score / 100),
                            }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="flex flex-col items-center">
                          <span className="text-3xl font-black text-gray-900 leading-none">
                            {score}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">
                            / 100
                          </span>
                        </div>
                      </div>
                      <h4 className={`text-sm font-black mt-3 ${colors.text} uppercase tracking-wider`}>
                        {t.has(scoreLabelKey) ? t(scoreLabelKey) : label}
                      </h4>
                    </div>

                    {/* Alerts / Flags card */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                          {t("clinic.performance.drawer.flags.title")}
                        </h4>
                        <div className="space-y-1.5 mt-2 max-h-[96px] overflow-y-auto">
                          {flags.length === 0 ? (
                            <p className="text-xs text-gray-500 font-medium">
                              {t("clinic.performance.drawer.flags.noIssues")}
                            </p>
                          ) : (
                            flags.map((flag: string) => (
                              <div
                                key={flag}
                                className="text-xs text-red-600 bg-red-50/50 border border-red-100 rounded-lg p-2 font-medium"
                              >
                                • {t.has(`clinic.performance.drawer.flags.${flag}`) ? t(`clinic.performance.drawer.flags.${flag}`) : flag}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Signals Breakdown */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                      {t("clinic.performance.drawer.signalBreakdown")}
                    </h3>
                    <div className="space-y-3.5">
                      {[
                        {
                          key: "A",
                          val: signals?.A || 0,
                          max: 30,
                          color: "bg-[#00b495]",
                        },
                        {
                          key: "B",
                          val: signals?.B || 0,
                          max: 25,
                          color: "bg-[#19bca0]",
                        },
                        {
                          key: "C",
                          val: signals?.C || 0,
                          max: 20,
                          color: "bg-[#4dcbb5]",
                        },
                        {
                          key: "D",
                          val: signals?.D || 0,
                          max: 15,
                          color: "bg-amber-500",
                        },
                        {
                          key: "E",
                          val: signals?.E || 0,
                          max: 10,
                          color: "bg-rose-500",
                        },
                      ].map((sig) => (
                        <div key={sig.key} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-gray-700">
                            <span>
                              {t(`clinic.performance.drawer.signals.${sig.key}`)}
                            </span>
                            <span className="text-gray-400">
                              {sig.val} / {sig.max}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(sig.val / sig.max) * 100}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={`h-full rounded-full ${sig.color}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stat Cards Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Completion Rate */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                        {t("clinic.performance.drawer.statCards.completionRate")}
                      </span>
                      <span className="text-2xl font-black text-gray-900 block mt-1">
                        {stats?.completionRate !== null
                          ? `${(stats.completionRate * 100).toFixed(0)}%`
                          : "N/A"}
                      </span>
                      <span className="text-[10px] text-gray-400 block mt-1 truncate">
                        {stats?.completed || 0} {t("clinic.performance.drawer.segments.completed").toLowerCase()}
                      </span>
                    </div>

                    {/* On-Time Rate */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                        {t("clinic.performance.drawer.statCards.onTimeRate")}
                      </span>
                      <span className="text-2xl font-black text-gray-900 block mt-1">
                        {stats?.onTimeRate !== null
                          ? `${(stats.onTimeRate * 100).toFixed(0)}%`
                          : "N/A"}
                      </span>
                      <span className="text-[10px] text-gray-400 block mt-1 truncate">
                        {stats?.followUpsCount || 0} {t("clinic.performance.drawer.statCards.returning").toLowerCase()}
                      </span>
                    </div>

                    {/* Patients Seen */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                        {t("clinic.performance.drawer.statCards.uniquePatients")}
                      </span>
                      <span className="text-2xl font-black text-gray-900 block mt-1">
                        {stats?.uniquePatients || 0}
                      </span>
                      {deltas?.uniquePatients !== undefined && (
                        <span
                          className={`text-[10px] font-bold block mt-1 ${
                            deltas.uniquePatients >= 0
                              ? "text-emerald-600"
                              : "text-red-500"
                          }`}
                        >
                          {deltas.uniquePatients >= 0 ? "+" : ""}
                          {deltas.uniquePatients} {t("clinic.performance.vsLastPeriod")}
                        </span>
                      )}
                    </div>

                    {/* Revenue */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                        {t("clinic.performance.drawer.statCards.revenue")}
                      </span>
                      <span className="text-2xl font-black text-[#00b495] block mt-1">
                        ₨ {stats?.totalRevenue?.toLocaleString() || "0"}
                      </span>
                      <span className="text-[10px] text-gray-400 block mt-1 truncate">
                        {t("clinic.performance.drawer.statCards.avgPerVisit")}: ₨{" "}
                        {stats?.avgRevenue?.toFixed(0) || "0"}
                      </span>
                    </div>
                  </div>

                  {/* Revenue Trend Chart */}
                  {revenueChartData.length > 0 && (
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-[#00b495]" />
                        {t("clinic.performance.drawer.revenueChart")}
                      </h3>
                      <div className="h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={revenueChartData}
                            margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                          >
                            <defs>
                              <linearGradient
                                id="drawerRevenue"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#00b495"
                                  stopOpacity={0.2}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#00b495"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="date"
                              tickLine={false}
                              axisLine={false}
                              tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: "bold" }}
                            />
                            <YAxis
                              tickLine={false}
                              axisLine={false}
                              tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: "bold" }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#0f4c5c",
                                border: "none",
                                borderRadius: "22px",
                                padding: "8px 12px",
                              }}
                              labelStyle={{
                                color: "#fff",
                                fontSize: "10px",
                                fontWeight: "bold",
                              }}
                              itemStyle={{
                                color: "#fff",
                                fontSize: "11px",
                                fontWeight: "bold",
                              }}
                              formatter={(value: any) => [
                                `₨ ${value?.toLocaleString()}`,
                                t("clinic.performance.revenue"),
                              ]}
                            />
                            <Area
                              type="monotone"
                              dataKey="revenue"
                              stroke="#00b495"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#drawerRevenue)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Recent Reviews List */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-[#00b495]" />
                      {t("clinic.performance.drawer.recentReviews")}
                    </h3>
                    <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                      {detail?.recentReviews?.length === 0 ? (
                        <p className="text-xs text-gray-400 font-medium py-2">
                          {t("common.noResults")}
                        </p>
                      ) : (
                        detail?.recentReviews?.map((rev: any, idx: number) => (
                          <div
                            key={idx}
                            className="border-b border-gray-50 last:border-0 pb-3 last:pb-0 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                                  {rev.patientPhoto ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                      src={resolveMediaUrl(rev.patientPhoto)}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <User className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                                <span className="text-xs font-bold text-gray-800">
                                  {rev.patientName}
                                </span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < Math.round(rev.rating)
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-gray-200"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed font-medium italic">
                              {rev.reviewText ? `"${rev.reviewText}"` : t("clinic.performance.drawer.noComment")}
                            </p>
                            <span className="text-[10px] text-gray-400 font-bold block">
                              {new Date(rev.date).toLocaleDateString(
                                locale === "ur" ? "ur-PK" : "en-US",
                                { month: "short", day: "numeric", year: "numeric" }
                              )}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
