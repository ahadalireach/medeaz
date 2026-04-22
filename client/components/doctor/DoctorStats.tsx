"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import LayoutDashboardIcon from "@/icons/layout-dashboard-icon";
import UsersIcon from "@/icons/users-icon";
import StarIcon from "@/icons/star-icon";
import CurrencyDollarIcon from "@/icons/currency-dollar-icon";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DoctorStatsProps {
    totalSessions: number;
    pendingQueue: number;
    averageRating: number;
    monthlyRevenue: number;
}

export default function DoctorStats({
    totalSessions,
    pendingQueue,
    averageRating,
    monthlyRevenue,
}: DoctorStatsProps) {
    const t = useTranslations();
    const stats = useMemo(() => [
        {
            label: t('doctor.dashboard.todaysSessions'),
            value: totalSessions,
            icon: LayoutDashboardIcon,
            color: "text-[#4f46e5]",
            bg: "bg-[#4f46e5]/10",
            trend: t('doctor.dashboard.dailyThroughput'),
            trendColor: "bg-[#4f46e5]",
        },
        {
            label: t('doctor.dashboard.activeQueue'),
            value: pendingQueue,
            icon: UsersIcon,
            color: "text-[#f97316]",
            bg: "bg-[#f97316]/10",
            trend: t('doctor.dashboard.patientsWaiting'),
            trendColor: "bg-[#f97316]",
        },
        {
            label: t('doctor.dashboard.patientRating'),
            value: averageRating.toFixed(1),
            icon: StarIcon,
            color: "text-[#f59e0b]",
            bg: "bg-[#f59e0b]/10",
            trend: t('doctor.dashboard.qualityScore'),
            trendColor: "bg-[#f59e0b]",
        },
        {
            label: t('doctor.dashboard.monthlyRevenue'),
            value: `${t('common.pkr')} ${monthlyRevenue.toLocaleString()}`,
            icon: CurrencyDollarIcon,
            color: "text-[#10b981]",
            bg: "bg-[#10b981]/10",
            trend: t('doctor.dashboard.earnedShare'),
            trendColor: "bg-[#10b981]",
        },
    ], [totalSessions, pendingQueue, averageRating, monthlyRevenue, t]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((stat) => {
                const Icon = stat.icon;
                const isRevenue = stat.label === t('doctor.dashboard.monthlyRevenue');
                const card = (
                    <div
                        key={stat.label}
                        className="p-4 sm:p-5 bg-card-custom border-card-custom rounded-[2rem] transition-all hover:border-primary/30 group shadow-sm flex items-center justify-between min-h-[100px] sm:min-h-[120px] relative"
                    >
                        <div className="flex flex-col justify-center min-w-0 flex-1">
                            <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                                {stat.label}
                            </p>
                            <div className="flex items-baseline gap-1.5 min-w-0">
                                {isRevenue && (
                                    <span className="text-sm font-bold text-gray-400 shrink-0">{t('common.pkr')}</span>
                                )}
                                <p className={cn(
                                    "text-lg sm:text-xl lg:text-2xl font-black text-gray-900 dark:text-white tracking-tight",
                                    isRevenue ? "" : "whitespace-nowrap truncate"
                                )}>
                                    {typeof stat.value === 'string' && stat.value.startsWith(`${t('common.pkr')} `)
                                        ? stat.value.replace(`${t('common.pkr')} `, '')
                                        : stat.value}
                                </p>
                            </div>
                        </div>
                        <div className="text-primary transition-all p-2 bg-primary/5 rounded-xl group-hover:scale-110 duration-300 shrink-0 ml-2">
                            <Icon className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5px]" />
                        </div>
                    </div>
                );

                if (isRevenue) {
                    return (
                        <Link key={stat.label} href="/dashboard/doctor/revenue" className="block">
                            {card}
                        </Link>
                    );
                }

                return card;
            })}
        </div>
    );
}
