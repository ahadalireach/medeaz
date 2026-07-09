"use client";

import OverviewCards from "@/components/clinic/OverviewCards";
import PatientFlowChart from "@/components/clinic/PatientFlowChart";
import RevenueChart from "@/components/clinic/RevenueChart";
import { useSelector } from "react-redux";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import ProfileCompletenessWidget from "@/components/dashboard/ProfileCompletenessWidget";
import { useGetOverviewQuery } from "@/store/api/clinicApi";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import PageHeader from "@/components/shared/PageHeader";

export default function ClinicDashboard() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);
  const { isLoading } = useGetOverviewQuery(undefined);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    const isUrdu = locale === "ur";
    if (hour >= 4 && hour < 12) return isUrdu ? "صبح بخیر" : "Good morning";
    if (hour >= 12 && hour < 17) return isUrdu ? "سہ پہر بخیر" : "Good afternoon";
    if (hour >= 17 && hour < 21) return isUrdu ? "شام بخیر" : "Good evening";
    return isUrdu ? "شب بخیر" : "Good night";
  };

  const isUrdu = locale === "ur";
  const namePart = user?.name?.split(' ')[0] || 'Admin';
  const welcomeText = isUrdu 
    ? "خوش آمدید! اپنے آج کے کلینک آپریشنز اور اعدادوشمار کا جائزہ لیں۔" 
    : "Welcome back! Here is your clinic overview for today.";

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight flex items-center gap-2">
          {getGreeting()}, {namePart} 👋
        </h1>
        <p className="text-text-secondary text-sm sm:text-base font-medium">
          {welcomeText}
        </p>
      </div>

      <ProfileCompletenessWidget
        role="clinic_admin"
        locale={locale}
        onOpenOnboarding={(step) => router.push(`/dashboard/clinic_admin?onboarding=true&step=${step}`)}
      />

      <OverviewCards />

      <div className="grid grid-cols-1 min-[800px]:grid-cols-2 gap-4 lg:gap-6">
        <PatientFlowChart />
        <RevenueChart />
      </div>
    </div>
  );
}
