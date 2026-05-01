"use client";

import { useGetPatientFlowQuery } from "@/store/api/clinicApi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { useFormatter, useTranslations } from "next-intl";

export default function PatientFlowChart() {
  const t = useTranslations();
  const format = useFormatter();
  const { data, isLoading } = useGetPatientFlowQuery(undefined);

  if (isLoading) {
    return (
      <div className="h-80 bg-background rounded-[2.5rem] animate-pulse"></div>
    );
  }

  const chartData = Array.isArray(data?.data) ? data.data : [];

  const formatAxisDate = (isoDate: string) => {
    if (!isoDate) return "";
    const d = new Date(`${isoDate}T00:00:00`);
    return format.dateTime(d, { month: "short", day: "numeric" });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl">{t('clinic.dashboard.todaysOverview')}</CardTitle>
        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1">
          {t('analytics.patientFlow')}
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="h-[280px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F4C5C" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#0F4C5C" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#78716C20" />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 'medium' }}
                interval="preserveStartEnd"
                tickFormatter={formatAxisDate}
                height={55}
                label={{ value: t('common.date'), position: "insideBottom", offset: -5, fill: "#94a3b8", fontSize: 10, fontWeight: "bold" }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                allowDecimals={false}
                label={{ value: t('clinic.appointments.patient'), angle: -90, position: "insideLeft", fill: "#94a3b8", fontSize: 10, fontWeight: "bold" }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "#1C1917",
                  border: "none",
                  borderRadius: "16px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
                itemStyle={{ color: "#FFFFFF", fontWeight: 'bold', fontSize: '12px' }}
                labelStyle={{ color: "#FFFFFF", marginBottom: '4px', fontSize: '10px', fontWeight: 'bold' }}
                labelFormatter={(value: any) => formatAxisDate(String(value))}
                formatter={(value: any) => [value, t('clinic.appointments.patient')]}
              />
              <Area
                type="monotone"
                dataKey="patients"
                stroke="#0F4C5C"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorFlow)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
