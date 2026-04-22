"use client";

import { useMemo } from "react";
import { useGetOverviewQuery } from "@/store/api/clinicApi";
import { DollarSign, Calendar } from "lucide-react";
import UsersIcon from "@/icons/users-icon";
import UserCheckIcon from "@/icons/user-check-icon";
import { useTranslations } from "next-intl";

export default function OverviewCards() {
  const t = useTranslations();
  const { data, isLoading } = useGetOverviewQuery(undefined);

  const stats = useMemo(() => [
    {
      label: t('clinic.todayPatients'),
      value: data?.data?.todayPatients || 0,
      icon: UsersIcon,
      color: "text-[#5E4D9C]",
      bg: "bg-[#5E4D9C]/10",
      isAmount: false,
    },
    {
      label: t('clinic.activeDoctor'),
      value: data?.data?.activeDoctors || 0,
      icon: UserCheckIcon,
      color: "text-[#B45309]",
      bg: "bg-[#B45309]/10",
      isAmount: false,
    },
    {
      label: `${t('analytics.today')}`,
      value: (data?.data?.todayRevenue || 0).toLocaleString(),
      icon: DollarSign,
      color: "text-[#0F4C5C]",
      bg: "bg-[#0F4C5C]/10",
      isAmount: true,
    },
    {
      label: `${t('analytics.thisMonth')}`,
      value: (data?.data?.monthlyRevenue || 0).toLocaleString(),
      icon: Calendar,
      color: "text-[#0F4C5C]",
      bg: "bg-[#0F4C5C]/10",
      isAmount: true,
    },
  ], [data, t]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 sm:p-5 bg-card-custom border-card-custom rounded-[2rem] animate-pulse min-h-[120px]">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-surface rounded w-24" />
                <div className="h-6 bg-surface rounded w-16" />
              </div>
              <div className="h-10 w-10 bg-surface rounded-xl ml-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

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
              <p className="text-[9px] sm:text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">
                {stat.label}
              </p>
              <div className="flex items-baseline gap-1.5 min-w-0">
                {stat.isAmount && (
                  <span className="text-sm font-bold text-text-secondary shrink-0">{t('common.pkr')}</span>
                )}
                <p className="text-lg sm:text-xl lg:text-2xl font-black text-text-primary tracking-tight truncate">
                  {stat.value}
                </p>
              </div>
            </div>
            <div className="text-primary transition-all p-2 sm:p-3 bg-primary/5 rounded-xl group-hover:scale-110 duration-300 shrink-0 ml-3">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5px]" />
            </div>
            {/* Subtle glow */}
            <div className={`absolute -bottom-4 -right-4 h-16 w-16 ${stat.bg} rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity`} />
          </div>
        );
      })}
    </div>
  );
}
