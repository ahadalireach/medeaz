"use client";

import OverviewCards from "@/components/clinic/OverviewCards";
import PatientFlowChart from "@/components/clinic/PatientFlowChart";
import RevenueChart from "@/components/clinic/RevenueChart";
import { useSelector } from "react-redux";
import { useTranslations } from "next-intl";

export default function ClinicDashboard() {
  const t = useTranslations();
  const user = useSelector((state: any) => state.auth.user);
  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">
          {t('nav.dashboard')}
        </h1>
        <p className="text-text-secondary mt-2 text-lg font-medium">
          {t('clinic.dashboard.welcomeBack')} {user?.name?.split(' ')[0] || 'Member'}
        </p>
      </div>

      <OverviewCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PatientFlowChart />
        <RevenueChart />
      </div>
    </div>
  );
}
