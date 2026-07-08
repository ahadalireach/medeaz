"use client";

import { useGetDashboardQuery } from "@/store/api/patientApi";
import { useSelector } from "react-redux";
import DashboardStats from "@/components/patient/DashboardStats";
import DoctorsVisitedCard from "@/components/patient/DoctorsVisitedCard";
import RecentPrescriptions from "@/components/patient/RecentPrescriptions";
import UpcomingAppointmentsWidget from "@/components/patient/UpcomingAppointmentsWidget";
import UpcomingFollowUpsWidget from "@/components/patient/UpcomingFollowUpsWidget";
import SpentChart from "@/components/patient/SpentChart";
import ConnectionRequestsWidget from "@/components/patient/ConnectionRequestsWidget";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import ProfileCompletenessWidget from "@/components/dashboard/ProfileCompletenessWidget";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import PageHeader from "@/components/shared/PageHeader";

export default function PatientDashboard() {
  const t = useTranslations();
  const router = useRouter();
  const { data, isLoading } = useGetDashboardQuery(undefined);
  const user = useSelector((state: any) => state.auth.user);

  const locale = useLocale();

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
  const namePart = user?.name?.split(' ')[0] || 'Member';
  const welcomeText = isUrdu 
    ? "خوش آمدید! آج کے لیے آپ کے کلینک کا جائزہ یہاں ہے۔" 
    : "Welcome back! Here is your clinic overview for today.";

  const handleOpenOnboarding = (step: number) => {
    router.push(`/dashboard/patient?onboarding=true&step=${step}`);
  };

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

      <div className="w-full">
        <ProfileCompletenessWidget
          role="patient"
          locale={locale}
          onOpenOnboarding={handleOpenOnboarding}
        />
      </div>

      <ConnectionRequestsWidget />
      <DashboardStats
        appointmentsThisWeek={data?.data?.appointmentsThisWeek || 0}
        appointmentsLastWeek={data?.data?.appointmentsLastWeek || 0}
        appointmentsThisMonth={data?.data?.appointmentsThisMonth || 0}
        appointmentsLastMonth={data?.data?.appointmentsLastMonth || 0}
        totalPrescriptions={data?.data?.totalPrescriptions || 0}
        totalSpent={data?.data?.totalSpent || 0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <SpentChart data={data?.data?.spendingTrend || []} />
        <DoctorsVisitedCard doctors={data?.data?.doctorsVisited || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <UpcomingAppointmentsWidget appointments={data?.data?.upcomingAppointments || []} />
        <RecentPrescriptions prescriptions={data?.data?.recentPrescriptions || []} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
        <UpcomingFollowUpsWidget followUps={data?.data?.upcomingFollowUps || []} />
      </div>
    </div>
  );
}
