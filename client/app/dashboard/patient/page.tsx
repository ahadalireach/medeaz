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
import { useTranslations } from "next-intl";

export default function PatientDashboard() {
  const t = useTranslations();
  const { data, isLoading } = useGetDashboardQuery(undefined);
  const user = useSelector((state: any) => state.auth.user);

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('nav.dashboard')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg font-medium">
          {t('patient.dashboard.welcomeBack')} {user?.name?.split(' ')[0] || 'Member'}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : (
        <>
          <ConnectionRequestsWidget />
          <DashboardStats
            appointmentsThisWeek={data?.data?.appointmentsThisWeek || 0}
            appointmentsLastWeek={data?.data?.appointmentsLastWeek || 0}
            appointmentsThisMonth={data?.data?.appointmentsThisMonth || 0}
            appointmentsLastMonth={data?.data?.appointmentsLastMonth || 0}
            totalPrescriptions={data?.data?.totalPrescriptions || 0}
            totalSpent={data?.data?.totalSpent || 0}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SpentChart data={data?.data?.spendingTrend || []} />
            <DoctorsVisitedCard doctors={data?.data?.doctorsVisited || []} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <UpcomingAppointmentsWidget appointments={data?.data?.upcomingAppointments || []} />
            <RecentPrescriptions prescriptions={data?.data?.recentPrescriptions || []} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
            <UpcomingFollowUpsWidget followUps={data?.data?.upcomingFollowUps || []} />
          </div>
        </>
      )}
    </div>
  );
}
