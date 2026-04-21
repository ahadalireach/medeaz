"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import ClockIcon from "@/icons/clock-icon";
import ArrowBigUpIcon from "@/icons/arrow-big-up-icon";
import DescriptionIcon from "@/icons/file-description-icon";
import CurrencyDollarIcon from "@/icons/currency-dollar-icon";

interface DashboardStatsProps {
  appointmentsThisWeek: number;
  appointmentsLastWeek: number;
  appointmentsThisMonth: number;
  appointmentsLastMonth: number;
  totalPrescriptions: number;
  totalSpent: number;
}

export default function DashboardStats({
  appointmentsThisWeek,
  appointmentsThisMonth,
  totalPrescriptions,
  totalSpent,
}: DashboardStatsProps) {
  const t = useTranslations();

  const stats = useMemo(() => [
    {
      label: t('patient.appointmentsThisWeek'),
      value: appointmentsThisWeek,
      icon: ClockIcon,
      color: "text-[#4f46e5]",
      bg: "bg-[#4f46e5]/10",
      sub: t('patient.appointmentsThisWeek'),
      subColor: "bg-[#4f46e5]",
    },
    {
      label: t('patient.appointmentsThisMonth'),
      value: appointmentsThisMonth,
      icon: ArrowBigUpIcon,
      color: "text-[#f97316]",
      bg: "bg-[#f97316]/10",
      sub: t('patient.appointmentsThisMonth'),
      subColor: "bg-[#f97316]",
    },
    {
      label: t('nav.prescriptions'),
      value: totalPrescriptions,
      icon: DescriptionIcon,
      color: "text-[#0ea5e9]",
      bg: "bg-[#0ea5e9]/10",
      sub: t('nav.prescriptions'),
      subColor: "bg-[#0ea5e9]",
    },
    {
      label: t('patient.totalSpent'),
      value: totalSpent > 0 ? `${totalSpent.toLocaleString()}` : "0",
      icon: CurrencyDollarIcon,
      color: "text-[#10b981]",
      bg: "bg-[#10b981]/10",
      isAmount: true,
      sub: t('common.pkr'),
      subColor: "bg-[#10b981]",
    },
  ], [appointmentsThisWeek, appointmentsThisMonth, totalPrescriptions, totalSpent, t]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="p-4 sm:p-5 bg-card-custom border-card-custom rounded-[2rem] transition-all hover:border-primary/30 group shadow-sm flex items-center justify-between min-h-[100px] sm:min-h-[120px] relative overflow-hidden"
          >
            <div className="flex flex-col justify-center min-w-0 flex-1">
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                {stat.label}
              </p>
              <div className="flex items-baseline gap-1.5 min-w-0">
                {stat.isAmount && (
                  <span className="text-sm font-bold text-gray-400 shrink-0">{t('common.pkr')}</span>
                )}
                <p className="text-lg sm:text-xl lg:text-2xl font-black text-gray-900 dark:text-white tracking-tight truncate">
                  {stat.value}
                </p>
              </div>
            </div>
            <div className="text-primary transition-all p-2 sm:p-3 bg-primary/5 rounded-xl group-hover:scale-110 duration-300 shrink-0 ml-3">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5px]" />
            </div>
            {/* Subtle glow effect */}
            <div className={`absolute -bottom-4 -right-4 h-16 w-16 ${stat.bg} rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity`} />
          </div>
        );
      })}
    </div>
  );
}
