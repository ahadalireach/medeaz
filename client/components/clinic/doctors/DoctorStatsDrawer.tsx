"use client";

import { useState } from "react";
import { useGetDoctorStatsQuery } from "@/store/api/clinicApi";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, Star, DollarSign, Users, ExternalLink, ArrowRight, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { resolveMediaUrl } from "@/lib/media";
import Link from "next/link";
import MiniBarChart from "./MiniBarChart";

interface DoctorStatsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  doctorId: string;
}

type PeriodType = "today" | "week" | "month" | "all";

export default function DoctorStatsDrawer({
  isOpen,
  onClose,
  doctorId,
}: DoctorStatsDrawerProps) {
  const t = useTranslations();
  const [period, setPeriod] = useState<PeriodType>("month");

  const { data, isLoading, error } = useGetDoctorStatsQuery(
    { doctorId, period },
    { skip: !isOpen || !doctorId }
  );

  const doctor = data?.data?.doctor;
  const stats = data?.data?.stats;

  const periods: { value: PeriodType; label: string }[] = [
    { value: "today", label: t("clinic.period.today") || "Today" },
    { value: "week", label: t("clinic.period.week") || "This Week" },
    { value: "month", label: t("clinic.period.month") || "This Month" },
    { value: "all", label: t("clinic.period.all") || "All Time" },
  ];

  const getStatusStyle = (status: string) => {
    const s = String(status || "").toLowerCase().trim();
    if (s === "completed") return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    if (s === "cancelled") return "bg-red-50 text-red-700 border border-red-100";
    if (s === "no-show") return "bg-gray-100 text-gray-700 border border-gray-200";
    return "bg-amber-50 text-amber-700 border border-amber-100";
  };

  // Prepare horizontal status bars
  const totalStatusAppointments = stats
    ? stats.appointmentsByStatus.completed +
      stats.appointmentsByStatus.pending +
      stats.appointmentsByStatus.cancelled +
      stats.appointmentsByStatus.noShow
    : 0;

  const statusBars = stats
    ? [
        {
          label: t("appointment.status.completed") || "Completed",
          count: stats.appointmentsByStatus.completed,
          percentage: totalStatusAppointments > 0 ? (stats.appointmentsByStatus.completed / totalStatusAppointments) * 100 : 0,
          color: "#00b495",
        },
        {
          label: t("appointment.status.pending") || "Pending",
          count: stats.appointmentsByStatus.pending,
          percentage: totalStatusAppointments > 0 ? (stats.appointmentsByStatus.pending / totalStatusAppointments) * 100 : 0,
          color: "#f59e0b",
        },
        {
          label: t("appointment.status.cancelled") || "Cancelled",
          count: stats.appointmentsByStatus.cancelled,
          percentage: totalStatusAppointments > 0 ? (stats.appointmentsByStatus.cancelled / totalStatusAppointments) * 100 : 0,
          color: "#ef4444",
        },
        {
          label: t("appointment.status.no-show") || "No Show",
          count: stats.appointmentsByStatus.noShow,
          percentage: totalStatusAppointments > 0 ? (stats.appointmentsByStatus.noShow / totalStatusAppointments) * 100 : 0,
          color: "#6b7280",
        },
      ]
    : [];

  // Parse days for mini bar chart
  const revenueChartData = stats?.revenueByDay?.map((item: any) => {
    const d = new Date(item.date);
    const dayLabel = d.toLocaleDateString(undefined, { weekday: "short" }); // Mon, Tue...
    return {
      label: dayLabel,
      value: item.amount || 0,
    };
  }) || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50 transition-opacity backdrop-blur-[1px]"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed right-0 top-0 h-full w-[480px] max-w-full bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header (Dark `#0d1f1a`) */}
            <div className="bg-[#0d1f1a] text-white p-6 relative flex flex-col gap-4">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full border-2 border-[#00b495]/40 overflow-hidden bg-white/5 flex items-center justify-center shrink-0">
                  {doctor?.avatar ? (
                    <img
                      src={resolveMediaUrl(doctor.avatar)}
                      alt={doctor.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold tracking-tight text-white">{doctor?.name || "Doctor Stats"}</h2>
                  <p className="text-xs text-gray-400 font-medium">{doctor?.specialization || "Medical Specialist"}</p>
                </div>
              </div>

              {/* Time Range Selector */}
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mt-2">
                {periods.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setPeriod(item.value)}
                    className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all ${
                      period === item.value
                        ? "bg-[#00b495] text-white shadow"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoading ? (
                // Skeleton loading state
                <div className="space-y-6 animate-pulse">
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-24 bg-gray-50 rounded-2xl border border-gray-100" />
                    ))}
                  </div>
                  <div className="h-40 bg-gray-50 rounded-2xl border border-gray-100" />
                  <div className="h-44 bg-gray-50 rounded-2xl border border-gray-100" />
                </div>
              ) : error ? (
                // Error State
                <div className="text-center py-12 space-y-3">
                  <p className="text-sm font-medium text-red-600">Failed to load doctor stats</p>
                  <p className="text-xs text-gray-400">Please verify connection or permissions.</p>
                </div>
              ) : !stats ? (
                // Empty State
                <div className="text-center py-12 text-gray-400 text-sm">No statistics available.</div>
              ) : (
                <>
                  {/* Stats Grid (2x2) */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Card 1: Total Appointments */}
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/80 hover:border-[#00b495]/20 hover:bg-white hover:shadow-lg hover:shadow-gray-100/50 transition-all flex flex-col justify-between min-h-[96px]">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Total Appointments
                        </span>
                        <span className="text-2xl font-extrabold text-gray-900 block mt-1">
                          {stats.totalAppointments}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-2">
                        {stats.totalAppointments > 0 ? "Active Schedule" : "No Appointments"}
                      </span>
                    </div>

                    {/* Card 2: Revenue */}
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/80 hover:border-[#00b495]/20 hover:bg-white hover:shadow-lg hover:shadow-gray-100/50 transition-all flex flex-col justify-between min-h-[96px]">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Total Revenue
                        </span>
                        <span className="text-2xl font-extrabold text-[#00b495] block mt-1">
                          ₨ {stats.revenue.total.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 block truncate">
                        Avg ₨ {stats.revenue.avgPerVisit.toLocaleString()} / visit
                      </span>
                    </div>

                    {/* Card 3: Patients Seen */}
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/80 hover:border-[#00b495]/20 hover:bg-white hover:shadow-lg hover:shadow-gray-100/50 transition-all flex flex-col justify-between min-h-[96px]">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Patients Seen
                        </span>
                        <span className="text-2xl font-extrabold text-gray-900 block mt-1">
                          {stats.uniquePatients}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                        {stats.returningPatients} returning patients
                      </span>
                    </div>

                    {/* Card 4: Avg Rating */}
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/80 hover:border-[#00b495]/20 hover:bg-white hover:shadow-lg hover:shadow-gray-100/50 transition-all flex flex-col justify-between min-h-[96px]">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Avg Rating
                        </span>
                        <span className="text-2xl font-extrabold text-gray-900 flex items-center gap-1.5 mt-1">
                          {stats.avgRating !== null ? (
                            <>
                              {stats.avgRating}
                              <Star className="h-5 w-5 fill-amber-400 text-amber-400 inline-block align-text-bottom" />
                            </>
                          ) : (
                            "—"
                          )}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 block">
                        from {stats.reviewCount} reviews
                      </span>
                    </div>
                  </div>

                  {/* Appointment Status Breakdown */}
                  <div className="border border-gray-100 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Appointment Breakdown
                    </h3>
                    <div className="space-y-4">
                      {statusBars.map((bar) => (
                        <div key={bar.label} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-gray-700">
                            <span>{bar.label}</span>
                            <span className="text-gray-500">
                              {bar.count} ({bar.percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${bar.percentage}%` }}
                              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                              style={{ backgroundColor: bar.color }}
                              className="h-full rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 7-Day Revenue Mini Bar Chart */}
                  <div className="border border-gray-100 rounded-2xl p-5 space-y-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Revenue Trend (Last 7 Days)
                    </h3>
                    <MiniBarChart data={revenueChartData} color="#00b495" unit="₨" />
                  </div>

                  {/* Recent Patients */}
                  <div className="border border-gray-100 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[#00b495] uppercase tracking-wider">
                        Recent Patients
                      </h3>
                      <Link
                        href={`/dashboard/clinic_admin/patients?doctorId=${doctorId}`}
                        onClick={onClose}
                        className="text-xs font-bold text-[#00b495] hover:text-[#00b495]/80 flex items-center gap-1 transition-colors"
                      >
                        View All Patients
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>

                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {stats.recentPatients.length === 0 ? (
                        <p className="text-xs text-gray-400 py-2">No patients seen yet.</p>
                      ) : (
                        stats.recentPatients.map((patient: any) => (
                          <div
                            key={patient._id}
                            className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-100 shrink-0">
                                {patient.avatar ? (
                                  <img
                                    src={resolveMediaUrl(patient.avatar)}
                                    className="h-full w-full object-cover"
                                    alt=""
                                  />
                                ) : (
                                  <User className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-800">{patient.name}</p>
                                <p className="text-[10px] text-gray-400 font-medium">
                                  {new Date(patient.lastVisit).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusStyle(
                                patient.lastStatus
                              )}`}
                            >
                              {patient.lastStatus}
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
        </>
      )}
    </AnimatePresence>
  );
}
