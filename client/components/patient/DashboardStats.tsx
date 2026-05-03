"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import ClockIcon from "@/icons/clock-icon";
import ArrowBigUpIcon from "@/icons/arrow-big-up-icon";
import DescriptionIcon from "@/icons/file-description-icon";
import CurrencyDollarIcon from "@/icons/currency-dollar-icon";
import Link from "next/link";

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
      color: "text-[#5E4D9C]",
      bg: "bg-[#5E4D9C]/10",
      sub: t('patient.appointmentsThisWeek'),
      subColor: "bg-[#5E4D9C]",
    },
    {
      label: t('patient.appointmentsThisMonth'),
      value: appointmentsThisMonth,
      icon: ArrowBigUpIcon,
      color: "text-[#B45309]",
      bg: "bg-[#B45309]/10",
      sub: t('patient.appointmentsThisMonth'),
      subColor: "bg-[#B45309]",
    },
    {
      label: t('nav.prescriptions'),
      value: totalPrescriptions,
      icon: DescriptionIcon,
      color: "text-[#0F4C5C]",
      bg: "bg-[#0F4C5C]/10",
      sub: t('nav.prescriptions'),
      subColor: "bg-[#0F4C5C]",
    },
    {
      label: t('patient.totalSpent'),
      value: totalSpent > 0 ? `${totalSpent.toLocaleString()}` : "0",
      icon: CurrencyDollarIcon,
      color: "text-[#0F4C5C]",
      bg: "bg-[#0F4C5C]/10",
      isAmount: true,
      sub: t('common.pkr'),
      subColor: "bg-[#0F4C5C]",
    },
  ], [appointmentsThisWeek, appointmentsThisMonth, totalPrescriptions, totalSpent, t]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        
        let href = "#";
        if (stat.label === t('patient.appointmentsThisWeek') || stat.label === t('patient.appointmentsThisMonth')) {
          href = "/dashboard/patient/appointments";
        } else if (stat.label === t('nav.prescriptions')) {
          href = "/dashboard/patient/records";
        } else if (stat.isAmount) {
          href = "/dashboard/patient/spent";
        }

        return (
          <Link 
            key={stat.label} 
            href={href} 
            className="block group"
          >
            <div className="p-4 sm:p-5 bg-card-custom border-card-custom rounded-[2rem] transition-all hover:border-primary/30 shadow-sm flex items-center justify-between min-h-[100px] sm:min-h-[120px] relative overflow-hidden">
              <div className="flex flex-col justify-center min-w-0 flex-1">
                <p className="text-[11px] sm:text-[12px] font-bold text-text-primary tracking-widest mb-1">
                  {stat.label}
                </p>
                <div className="flex items-baseline gap-1.5 min-w-0">
                  {stat.isAmount && (
                    <span className="text-sm font-bold text-text-primary shrink-0">{t('common.pkr')}</span>
                  )}
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-text-primary tracking-tight truncate">
                    {stat.value}
                  </p>
                </div>
              </div>
              <div className="text-primary transition-all p-2 sm:p-3 bg-primary/5 rounded-xl group-hover:scale-110 duration-300 shrink-0 ml-3">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5px]" />
              </div>
              <div className={`absolute -bottom-4 -right-4 h-16 w-16 ${stat.bg} rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity`} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
