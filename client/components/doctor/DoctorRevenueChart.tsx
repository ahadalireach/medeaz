"use client";

import { useState } from "react";
import { useGetRevenueAnalyticsQuery } from "@/store/api/doctorApi";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useFormatter, useTranslations } from "next-intl";

export default function DoctorRevenueChart() {
    const t = useTranslations();
    const format = useFormatter();
    const [period, setPeriod] = useState<"day" | "month" | "year">("month");
    const { data, isLoading } = useGetRevenueAnalyticsQuery(period);

    const chartData = data?.data?.chartData || [];

    const getDayLabel = (value: unknown) => {
        const raw = String(value ?? "").trim();
        if (!raw) return "";

        if (/^\d+$/.test(raw)) {
            return format.number(Number(raw));
        }

        const shortDay = raw.slice(0, 3);
        const normalizedDay = shortDay.charAt(0).toUpperCase() + shortDay.slice(1).toLowerCase();
        const dayKey = `common.days.${normalizedDay}`;
        return t.has(dayKey) ? t(dayKey) : raw;
    };

    const getMonthLabel = (value: unknown) => {
        const raw = String(value ?? "").trim();
        if (!raw) return "";

        if (/^\d+$/.test(raw)) {
            return format.number(Number(raw));
        }

        const monthPart = raw.substring(0, 3);
        const monthKey = monthPart.charAt(0).toUpperCase() + monthPart.slice(1).toLowerCase();
        const translationKey = `common.months.${monthKey}`;
        return t.has(translationKey) ? t(translationKey) : raw;
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-xl">{t('doctor.revenue.title')}</CardTitle>
                </div>

                <div className="flex bg-background p-1 rounded-2xl border border-black/5">
                    {[
                        { id: "day", label: t('analytics.week') },
                        { id: "month", label: t('analytics.month') },
                        { id: "year", label: t('analytics.year') }
                    ].map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setPeriod(p.id as any)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p.id
                                ? "bg-white  text-primary shadow-sm"
                                : "text-text-secondary hover:text-text-secondary :text-white/70"
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <div className="h-64 bg-background rounded-4xl animate-pulse"></div>
                ) : (
                    <div className="h-70 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#78716C20" />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#78716C', fontSize: 8, fontWeight: 'bold' }}
                                    interval={period === 'month' ? 4 : (period === 'year' ? 1 : 'preserveStartEnd')}
                                    tickFormatter={(val) => {
                                        if (period === 'day') {
                                            return getDayLabel(val);
                                        }
                                        if (period === 'month' || period === 'year') {
                                            return getMonthLabel(val);
                                        }
                                        return val;
                                    }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#78716C', fontSize: 10, fontWeight: 'bold' }}
                                    tickFormatter={(value) => `${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                                    label={{ value: t('common.pkr'), angle: -90, position: "insideLeft", fill: "#78716C", fontSize: 10, fontWeight: "bold", offset: 10 }}
                                    domain={[0, (data: any) => Math.max(data.max > 50000 ? data.max : (period === 'day' ? 50000 : (period === 'month' ? 150000 : 500000)))]}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F4F3EE', opacity: 0.1 }}
                                    contentStyle={{
                                        backgroundColor: "#1C1917",
                                        border: "none",
                                        borderRadius: "16px",
                                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                    }}
                                    itemStyle={{ color: "#0F4C5C", fontWeight: 'bold', fontSize: '12px' }}
                                    labelStyle={{ color: "#78716C", marginBottom: '4px', fontSize: '10px', fontWeight: 'bold' }}
                                    labelFormatter={(val: any) => {
                                        if (period === 'day') return getDayLabel(val);
                                        return getMonthLabel(val);
                                    }}
                                    formatter={(value: any) => [`${value?.toLocaleString()} ${t('common.pkr')}`, t('analytics.totalRevenue')]}
                                />
                                <Bar
                                    dataKey="revenue"
                                    fill="url(#colorRev)"
                                    radius={[8, 8, 8, 8]}
                                    barSize={period === "day" ? 40 : 20}
                                />
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0F4C5C" stopOpacity={1} />
                                        <stop offset="95%" stopColor="#0F4C5C" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
