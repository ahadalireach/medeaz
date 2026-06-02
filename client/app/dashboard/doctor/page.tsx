"use client";

import { useGetTodayQueueQuery, useGetDoctorProfileQuery, useGetAppointmentsQuery } from "@/store/api/doctorApi";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
  const { data: upcomingData } = useGetAppointmentsQuery({ status: 'upcoming', limit: 5 });

  const statusPriority: Record<string, number> = {
    completed: 5,
    "in-progress": 4,
    confirmed: 3,
    pending: 2,
    reserved: 1,
    cancelled: 0,
  };

  const todayQueue = (data?.data?.appointments || []).reduce((list: any[], appointment: any) => {
    const slotKey = `${appointment.patientId?._id || appointment.patientId}-${appointment.doctorId?._id || appointment.doctorId}-${String(appointment.dateTime || "")}`;
    const existingIndex = list.findIndex((item) => `${item.patientId?._id || item.patientId}-${item.doctorId?._id || item.doctorId}-${String(item.dateTime || "")}` === slotKey);

    if (existingIndex === -1) {
      list.push(appointment);
      return list;
    }

    const existing = list[existingIndex];
    const nextPriority = statusPriority[String(appointment.status || "").toLowerCase()] ?? -1;
    const currentPriority = statusPriority[String(existing.status || "").toLowerCase()] ?? -1;

    if (nextPriority > currentPriority || (nextPriority === currentPriority && new Date(appointment.updatedAt || 0).getTime() > new Date(existing.updatedAt || 0).getTime())) {
      list[existingIndex] = appointment;
    }

    return list;
  }, []);
  const stats = {
    total: data?.data?.stats?.total || 0,
    pending: data?.data?.stats?.pending || 0,
    completed: data?.data?.stats?.completed || 0,
    inProgress: data?.data?.stats?.inProgress || 0,
  };

  const averageRating = profileData?.data?.averageRating || 4.8;
  const monthlyRevenue = data?.data?.stats?.thisMonthRevenue || 0;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-8 w-36 rounded bg-surface" />
          <div className="h-5 w-52 rounded bg-surface" />
        </div>
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-2xl bg-white shadow-sm border border-black/6 p-5 flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 rounded bg-surface" />
                <div className="h-7 w-14 rounded bg-surface" />
                <div className="h-3 w-24 rounded bg-surface" />
              </div>
              <div className="h-11 w-11 rounded-2xl bg-surface ml-3 shrink-0" />
            </div>
          ))}
        </div>
        {/* Queue + Tools/Chart row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Today's queue */}
          <div className="rounded-2xl bg-white shadow-sm border border-black/6 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="h-5 w-44 rounded bg-surface" />
              <div className="h-4 w-20 rounded bg-surface" />
            </div>
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center gap-4 rounded-2xl border border-border-light p-4">
                  <div className="h-12 w-12 rounded-lg bg-surface shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-28 rounded bg-surface" />
                    <div className="h-3 w-20 rounded bg-surface" />
                  </div>
                  <div className="h-8 w-8 rounded-full bg-surface" />
                </div>
              ))}
            </div>
          </div>
          {/* Practice tools + Revenue chart */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-white shadow-sm border border-black/6 p-6">
              <div className="h-5 w-32 rounded bg-surface mb-4" />
              <div className="grid grid-cols-2 gap-4">
                {[1,2].map(i => (
                  <div key={i} className="rounded-2xl border border-border-light p-6 flex flex-col items-center gap-3">
                    <div className="h-14 w-14 rounded-2xl bg-surface" />
                    <div className="h-4 w-24 rounded bg-surface" />
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-white shadow-sm border border-black/6 p-6">
              <div className="h-5 w-28 rounded bg-surface mb-4" />
              <div className="h-48 rounded-2xl bg-surface" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in">
      <div>
        <h1 className="text-xl font-bold text-text-primary">
          {t('nav.dashboard')}
        </h1>
        <p className="text-text-secondary mt-0.5 text-sm">
          {t('doctor.dashboard.welcomeBack')}{" "}
          <span className="font-semibold text-text-primary">
            {profileData?.data?.fullName?.split(" ")[0] || "Member"}
          </span>
        </p>
      </div>

      <DoctorStats
        totalSessions={stats.total}
        pendingQueue={stats.pending}
        averageRating={averageRating}
        monthlyRevenue={monthlyRevenue}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-xl">{t('doctor.dashboard.todaysAppointments')}</CardTitle>
            <Link href="/dashboard/doctor/appointments" className="text-sm font-bold text-primary hover:underline hover:underline-offset-4">
              {t('doctor.dashboard.viewSchedule')}
            </Link>
          </CardHeader>
          <CardContent>
            {todayQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 bg-surface/40 rounded-2xl flex items-center justify-center mb-4 text-primary/40">
                  <AlarmClockPlusIcon className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-text-primary tracking-widest">{t('doctor.dashboard.queueClear')}</p>
                <p className="text-[11px] font-medium text-text-secondary mt-1">{t('doctor.dashboard.checkBackLater')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayQueue.slice(0, 5).map((appointment: any) => (
                  <div
                    key={appointment._id}
                    className="group rounded-xl bg-gray-50 p-4 hover:bg-gray-100 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 border border-black/6 bg-white flex items-center justify-center">
                        {appointment.patientId?.photo ? (
                          <img
                            src={appointment.patientId.photo}
                            alt={appointment.patientId?.name || "Patient"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <AccessibilityIcon className="h-5 w-5 text-text-secondary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{appointment.patientId?.name || "Patient"}</p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {new Date(appointment.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {" · "}
                          <span className="capitalize">{appointment.status}</span>
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard/doctor/appointments"
                      className="p-2 rounded-lg bg-gray-100 text-text-secondary group-hover:bg-primary group-hover:text-white transition-all shrink-0"
                    >
                      <RightChevronIcon className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
            {todayQueue.length > 5 && (
              <Link href="/dashboard/doctor/appointments" className="mt-4 block text-center py-3 rounded-xl bg-gray-50 text-sm font-bold text-text-secondary tracking-wider hover:bg-gray-100 transition-colors">
                + {todayQueue.length - 5} {t('common.viewAll')}
              </Link>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upcoming Appointments</CardTitle>
              <Link href="/dashboard/doctor/appointments" className="text-sm font-semibold text-primary hover:underline hover:underline-offset-4">
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {(() => {
                const upcoming = (upcomingData?.data?.appointments || upcomingData?.data || [])
                  .filter((a: any) => new Date(a.dateTime) > new Date() && a.status !== 'cancelled')
                  .sort((a: any, b: any) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
                  .slice(0, 4);

                if (upcoming.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="h-10 w-10 rounded-xl bg-primary/8 flex items-center justify-center mb-2">
                        <AlarmClockPlusIcon className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-sm text-text-secondary">No upcoming appointments</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {upcoming.map((a: any) => {
                      const dt = new Date(a.dateTime);
                      const dateStr = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                      const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={a._id} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 hover:bg-gray-100 transition-all">
                          <div className="h-10 w-10 rounded-lg bg-white border border-black/6 flex items-center justify-center shrink-0 overflow-hidden">
                            {a.patientId?.photo
                              ? <img src={a.patientId.photo} className="h-full w-full object-cover" alt="" />
                              : <AccessibilityIcon className="h-5 w-5 text-text-secondary" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text-primary truncate">{a.patientId?.name || "Patient"}</p>
                            <p className="text-xs text-text-secondary mt-0.5">{dateStr} · {timeStr}</p>
                          </div>
                          <span className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full capitalize ${
                            a.status === 'confirmed' ? 'bg-primary/10 text-primary' :
                            a.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-text-secondary'
                          }`}>{a.status}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t('doctor.dashboard.practiceTools')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Link
                  href="/dashboard/doctor/prescriptions/new"
                  className="p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all flex flex-col items-center text-center"
                >
                  <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-3">
                    <PenIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-text-primary">{t('doctor.dashboard.newPrescription')}</h3>
                </Link>
                <Link
                  href="/dashboard/doctor/appointments"
                  className="p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all flex flex-col items-center text-center"
                >
                  <div className="h-12 w-12 bg-surface text-primary rounded-xl flex items-center justify-center mb-3">
                    <AccessibilityIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-text-primary">{t('nav.appointments')}</h3>
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
