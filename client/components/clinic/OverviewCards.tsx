"use client";

import { useMemo } from "react";
import { useGetOverviewQuery } from "@/store/api/clinicApi";
import { DollarSign, Calendar } from "lucide-react";
import UsersIcon from "@/icons/users-icon";
import UserCheckIcon from "@/icons/user-check-icon";
import { useTranslations } from "next-intl";
import Link from "next/link";

export default function OverviewCards() {
  const t = useTranslations();
  const { data, isLoading } = useGetOverviewQuery(undefined);

  const stats = useMemo(() => [
    {
      label: t('clinic.todayPatients'),
      value: data?.data?.todayPatients || 0,
      icon: UsersIcon,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      blob: "bg-indigo-100",
      href: "/dashboard/clinic_admin/patients/search",
      isAmount: false,
    },
    {
      label: t('clinic.activeDoctor'),
      value: data?.data?.activeDoctors || 0,
      icon: UserCheckIcon,
      color: "text-amber-600",
      bg: "bg-amber-50",
      blob: "bg-amber-100",
      href: "/dashboard/clinic_admin/doctors",
      isAmount: false,
    },
    {
      label: t('analytics.today'),
      value: (data?.data?.todayRevenue || 0).toLocaleString(),
      icon: DollarSign,
      color: "text-teal-700",
      bg: "bg-teal-50",
      blob: "bg-teal-100",
      href: "/dashboard/clinic_admin/revenue",
      isAmount: true,
    },
    {
      label: t('analytics.thisMonth'),
      value: (data?.data?.monthlyRevenue || 0).toLocaleString(),
      icon: Calendar,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      blob: "bg-emerald-100",
      href: "/dashboard/clinic_admin/revenue",
      isAmount: true,
    },
  ], [data, t]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 min-[406px]:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-black/6 p-5 animate-pulse min-h-30">
            <div className="h-10 w-10 rounded-xl bg-gray-100 mb-3" />
            <div className="h-8 w-16 rounded bg-gray-100 mb-2" />
            <div className="h-3 w-24 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 min-[406px]:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Link key={stat.label} href={stat.href} className="block group">
            <div className="relative bg-white rounded-2xl shadow-sm border border-black/6 p-5 overflow-hidden transition-all hover:shadow-md min-h-30">
              {/* Decorative blob */}
              <div className={`absolute -top-6 -right-6 h-20 w-20 ${stat.blob} rounded-full blur-2xl opacity-70 group-hover:opacity-90 transition-opacity`} />

              <div className="relative">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl ${stat.bg} mb-3`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} strokeWidth={2} />
                </div>

                {/* Value */}
                <div className="flex items-baseline gap-1 min-w-0">
                  {stat.isAmount && (
                    <span className="text-sm font-bold text-text-secondary">{t('common.pkr')}</span>
                  )}
                  <p className="text-3xl font-black text-text-primary tracking-tight truncate">
                    {stat.value}
                  </p>
                </div>

                {/* Label */}
                <p className="mt-1 text-[11px] font-semibold text-text-secondary tracking-widest uppercase leading-tight">
                  {stat.label}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
