"use client";

import { useState } from "react";
import { useGetRevenueQuery } from "@/store/api/clinicApi";
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

export default function RevenueChart() {
  const t = useTranslations();
  const format = useFormatter();
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const { data, isLoading } = useGetRevenueQuery(period);

  const chartData = Array.isArray(data?.data?.data) ? data.data.data : [];

  const formatDateTick = (isoDate: string) => {
    if (!isoDate) return "";
    const d = new Date(`${isoDate}T00:00:00`);
    if (period === "week") {
      return format.dateTime(d, { weekday: "short" });
    }
    return format.dateTime(d, { month: "short", day: "numeric" });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-xl">{t('analytics.revenueByPeriod')}</CardTitle>
        </div>
        <div className="flex bg-gray-50 dark:bg-white/5 p-1 rounded-2xl border border-black/5 dark:border-white/10">
          {(["week", "month", "year"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p
                ? "bg-white dark:bg-white/10 text-primary shadow-sm"
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                }`}
            >
              {t(`analytics.${p}`)}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="h-72 bg-gray-50 dark:bg-white/5 rounded-[2rem] animate-pulse"></div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <defs>
                   <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00b495" stopOpacity={1} />
                      <stop offset="95%" stopColor="#0fbda2" stopOpacity={0.8} />
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                <XAxis 
                  dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} 
                    interval="preserveStartEnd"
                  tickFormatter={(val) => formatDateTick(String(val))}
                    dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                  tickFormatter={(value) => `${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                  label={{ value: t('common.pkr'), angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 10, fontWeight: "bold", offset: 10 }}
                  domain={[0, (data: any) => Math.max(data.max > 15000 ? data.max : (period === 'week' ? 15000 : (period === 'month' ? 100000 : 300000)))]}
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "none",
                    borderRadius: "16px",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                  }}
                  itemStyle={{ color: "#00b495", fontWeight: 'bold', fontSize: '12px' }}
                  labelStyle={{ color: "#94a3b8", marginBottom: '4px', fontSize: '10px', fontWeight: 'bold' }}
                    labelFormatter={(val: any) => formatDateTick(String(val))}
                  formatter={(value: any) => [`${value?.toLocaleString()} ${t('common.pkr')}`, t('analytics.totalRevenue')]}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="url(#colorRevenue)" 
                  radius={[8, 8, 8, 8]} 
                  barSize={period === "month" ? 12 : 30} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
