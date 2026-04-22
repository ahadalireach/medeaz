"use client";

import { useGetTodayQueueQuery, useGetDoctorProfileQuery } from "@/store/api/doctorApi";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import DoctorRevenueChart from "@/components/doctor/DoctorRevenueChart";
import DoctorStats from "@/components/doctor/DoctorStats";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import AlarmClockPlusIcon from "@/icons/alarm-clock-plus-icon";
import RightChevronIcon from "@/icons/right-chevron";
import PenIcon from "@/icons/pen-icon";
import AccessibilityIcon from "@/icons/accessibility-icon";
import { useTranslations } from "next-intl";

export default function DoctorDashboard() {
  const t = useTranslations();
  const { data, isLoading } = useGetTodayQueueQuery(undefined);
  const { data: profileData } = useGetDoctorProfileQuery(undefined);

  const todayQueue = data?.data?.appointments || [];
  const stats = {
    total: data?.data?.stats?.total || 0,
    pending: data?.data?.stats?.pending || 0,
    completed: data?.data?.stats?.completed || 0,
    inProgress: data?.data?.stats?.inProgress || 0,
  };

  const averageRating = profileData?.data?.averageRating || 4.8;
  const monthlyRevenue = data?.data?.stats?.thisMonthRevenue || 0;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in pb-20">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">
          {t('nav.dashboard')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg font-medium">
          {t('doctor.dashboard.welcomeBack')} {profileData?.data?.fullName?.split(' ')[0] || 'Member'}
        </p>
      </div>

      <DoctorStats
        totalSessions={stats.total}
        pendingQueue={stats.pending}
        averageRating={averageRating}
        monthlyRevenue={monthlyRevenue}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-xl">{t('doctor.dashboard.todaysAppointments')}</CardTitle>
            <Link href="/dashboard/doctor/appointments" className="text-sm font-bold text-primary hover:underline hover:underline-offset-4">
              {t('doctor.dashboard.viewSchedule')}
            </Link>
          </CardHeader>
          <CardContent>
            {todayQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-gray-400 group-hover:scale-110 transition-transform">
                  <AlarmClockPlusIcon className="w-8 h-8" />
                </div>
                  <p className="text-sm font-bold text-gray-500 dark:text-[#a1a1aa] uppercase tracking-widest">{t('doctor.dashboard.queueClear')}</p>
                  <p className="text-[10px] font-medium text-gray-400 mt-1">{t('doctor.dashboard.checkBackLater')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayQueue.slice(0, 5).map((appointment: any) => (
                  <div
                    key={appointment._id}
                    className="group relative rounded-2xl border border-gray-100 p-5 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all hover:scale-[1.01] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-5 min-w-0">
                      <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        {appointment.patientId?.photo ? (
                          <img
                            src={appointment.patientId.photo}
                            alt={appointment.patientId?.name || "Patient"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <AccessibilityIcon className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 dark:text-white truncate text-base">{appointment.patientId?.name || "Patient"}</h4>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-bold">{new Date(appointment.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="font-semibold uppercase bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md sm:bg-transparent sm:p-0">{appointment.status}</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/doctor/appointments`}
                      className="p-3 rounded-full bg-gray-100/50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 group-hover:bg-primary group-hover:text-white transition-all shadow-sm"
                    >
                      <RightChevronIcon className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
            {todayQueue.length > 5 && (
              <Link href="/dashboard/doctor/appointments" className="mt-4 block text-center py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-sm font-bold text-gray-500 uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                + {todayQueue.length - 5} {t('common.viewAll')}
              </Link>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t('doctor.dashboard.practiceTools')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/dashboard/doctor/prescriptions/new"
                  className="p-6 bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-primary/50 transition-all group shadow-sm flex flex-col items-center text-center"
                >
                  <div className="h-14 w-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <PenIcon className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('doctor.dashboard.newPrescription')}</h3>
                </Link>
                <Link
                  href="/dashboard/doctor/appointments"
                  className="p-6 bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-gray-800 rounded-2xl hover:border-blue-500/50 transition-all group shadow-sm flex flex-col items-center text-center"
                >
                  <div className="h-14 w-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <AccessibilityIcon className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('doctor.dashboard.advancedQueue')}</h3>
                </Link>
              </div>
            </CardContent>
          </Card>

          <DoctorRevenueChart />
        </div>
      </div>
    </div>
  );
}
