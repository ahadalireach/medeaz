"use client";

import { useState } from "react";
import { useGetDoctorStatsQuery } from "@/store/api/clinicApi";
import { Modal } from "../ui/Modal";
import { motion } from "framer-motion";
import { Star, Calendar, Users, DollarSign, User, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { resolveMediaUrl } from "@/lib/media";
import Link from "next/link";
import MiniBarChart from "./doctors/MiniBarChart";

interface DoctorStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorId: string;
}

type PeriodType = "today" | "week" | "month" | "all";

export default function DoctorStatsModal({
  isOpen,
  onClose,
  doctorId,
}: DoctorStatsModalProps) {
  const t = useTranslations();
  const [period, setPeriod] = useState<PeriodType>("month");

  const { data, isLoading, error } = useGetDoctorStatsQuery(
    { doctorId, period },
    { skip: !isOpen || !doctorId }
  );

  const doctor = data?.data?.doctor;
  const stats = data?.data?.stats;

  const periods: { value: PeriodType; label: string }[] = [
    { value: "today", label: t("clinic.period.today") },
    { value: "week", label: t("clinic.period.week") },
    { value: "month", label: t("clinic.period.month") },
    { value: "all", label: t("clinic.period.all") },
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
    const dayLabel = d.toLocaleDateString(undefined, { weekday: "short" });
    return {
      label: dayLabel,
      value: item.amount || 0,
    };
  }) || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={t("clinic.stats.title")}
    >
      <div className="space-y-6">
        {/* Doctor Info Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#00b495] text-white border border-white/10 shadow-md">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full border-2 border-white/30 overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
              {doctor?.avatar ? (
                <img
                  src={resolveMediaUrl(doctor.avatar)}
                  alt={doctor.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-white/60" />
              )}
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-white">{doctor?.name || "Doctor Stats"}</h2>
              <p className="text-xs text-white/80 font-medium">{doctor?.specialization || "Medical Specialist"}</p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex bg-black/10 p-1 rounded-xl border border-white/20 shrink-0 self-start sm:self-center">
            {periods.map((item) => (
              <button
                key={item.value}
                onClick={() => setPeriod(item.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  period === item.value
                    ? "bg-white text-[#00b495] shadow"
                    : "text-white/80 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-50 rounded-2xl border border-gray-100" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-48 bg-gray-50 rounded-2xl border border-gray-100" />
              <div className="h-48 bg-gray-50 rounded-2xl border border-gray-100" />
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12 space-y-3 border border-dashed border-red-200 rounded-2xl bg-red-50/30">
            <p className="text-sm font-semibold text-red-600">Failed to load doctor stats</p>
            <p className="text-xs text-gray-400">Please verify connection or permissions.</p>
          </div>
        ) : !stats ? (
          <div className="text-center py-12 text-gray-400 text-sm border border-dashed border-gray-200 rounded-2xl">
            No statistics available.
          </div>
        ) : (
          <>
            {/* Stats Grid (4 columns on lg, 2 columns on mobile) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Appointments */}
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/80 hover:border-[#00b495]/20 hover:bg-white hover:shadow-lg hover:shadow-gray-100/50 transition-all flex flex-col justify-between min-h-[96px]">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    {t("clinic.stats.totalAppointments")}
                  </span>
                  <span className="text-2xl font-extrabold text-gray-900 block mt-1">
                    {stats.totalAppointments}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-2">
                  {stats.totalAppointments > 0 ? t("clinic.stats.activeSchedule") : t("clinic.stats.noAppointments")}
                </span>
              </div>

              {/* Card 2: Revenue */}
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/80 hover:border-[#00b495]/20 hover:bg-white hover:shadow-lg hover:shadow-gray-100/50 transition-all flex flex-col justify-between min-h-[96px]">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    {t("clinic.stats.totalRevenue")}
                  </span>
                  <span className="text-2xl font-extrabold text-[#00b495] block mt-1">
                    PKR {stats.revenue.total.toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-gray-500 block truncate mt-2">
                  {t("clinic.stats.avgVisit", { amount: stats.revenue.avgPerVisit.toLocaleString() })}
                </span>
              </div>

              {/* Card 3: Patients Seen */}
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/80 hover:border-[#00b495]/20 hover:bg-white hover:shadow-lg hover:shadow-gray-100/50 transition-all flex flex-col justify-between min-h-[96px]">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    {t("clinic.stats.patientsSeen")}
                  </span>
                  <span className="text-2xl font-extrabold text-gray-900 block mt-1">
                    {stats.uniquePatients}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1 mt-2">
                  {t("clinic.stats.returning", { count: stats.returningPatients })}
                </span>
              </div>

              {/* Card 4: Avg Rating */}
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/80 hover:border-[#00b495]/20 hover:bg-white hover:shadow-lg hover:shadow-gray-100/50 transition-all flex flex-col justify-between min-h-[96px]">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    {t("clinic.stats.avgRating")}
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
                <span className="text-[10px] font-bold text-gray-500 block mt-2">
                  from {stats.reviewCount} reviews
                </span>
              </div>
            </div>

            {/* Split layout: Breakdown & Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Appointment Status Breakdown */}
              <div className="border border-gray-100 rounded-2xl p-5 space-y-4 bg-white">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {t("clinic.stats.appointmentBreakdown")}
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
              <div className="border border-gray-100 rounded-2xl p-5 space-y-2 bg-white">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {t("clinic.stats.revenueTrend")}
                </h3>
                <MiniBarChart data={revenueChartData} color="#00b495" unit="PKR" />
              </div>
            </div>

            {/* Recent Patients */}
            <div className="border border-gray-100 rounded-2xl p-5 space-y-4 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#00b495] uppercase tracking-wider">
                  {t("clinic.stats.recentPatients")}
                </h3>
                <Link
                  href={`/dashboard/clinic_admin/patients?doctorId=${doctorId}`}
                  onClick={onClose}
                  className="text-xs font-bold text-[#00b495] hover:text-[#00b495]/80 flex items-center gap-1 transition-colors"
                >
                  {t("clinic.stats.viewAllPatients")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {stats.recentPatients.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">{t("clinic.stats.noPatients")}</p>
                ) : (
                  stats.recentPatients.map((patient: any, idx: number) => (
                    <div
                      key={`${patient._id}-${idx}`}
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
    </Modal>
  );
}
