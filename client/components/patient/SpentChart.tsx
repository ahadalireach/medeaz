"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SpentChartProps {
  data: { label: string; spent: number }[];
}

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useTranslations } from "next-intl";

export default function SpentChart({ data }: SpentChartProps) {
  const t = useTranslations();
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl">{t('patient.revenue.title')}</CardTitle>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
          {t('patient.revenue.subtitle')}
        </p>
      </CardHeader>

      <CardContent>
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[...data].reverse()} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00b495" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#00b495" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
              <XAxis 
                dataKey="label" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }}
                interval="preserveStartEnd"
                tickFormatter={(value) => {
                    const parts = value.split(/[ -]/);
                    if (/^\d+$/.test(parts[0])) return value;
                    const monthPart = parts[0].substring(0, 3);
                    const monthKey = monthPart.charAt(0).toUpperCase() + monthPart.slice(1).toLowerCase();
                    return t(`common.months.${monthKey}`) || value;
                }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                tickFormatter={(value) => `${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                label={{ value: t('common.pkr'), angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 10, fontWeight: "bold", offset: 10 }}
              />
              <Tooltip 
                contentStyle={{
                   backgroundColor: "#18181b",
                   border: "none",
                   borderRadius: "16px",
                   boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
                itemStyle={{ color: "#00b495", fontWeight: 'bold', fontSize: '12px' }}
                labelStyle={{ color: "#94a3b8", marginBottom: '4px', fontSize: '10px', fontWeight: 'bold' }}
                labelFormatter={(value: any) => {
                    const parts = value.split(/[ -]/);
                    if (/^\d+$/.test(parts[0])) return value;
                    const monthPart = parts[0].substring(0, 3);
                    const monthKey = monthPart.charAt(0).toUpperCase() + monthPart.slice(1).toLowerCase();
                    return t(`common.months.${monthKey}`) || value;
                }}
                formatter={(value: any) => [`${value?.toLocaleString()} ${t('common.pkr')}`, t('patient.revenue.totalRevenue')]}
              />
              <Area
                type="monotone"
                dataKey="spent"
                stroke="#00b495"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSpent)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
