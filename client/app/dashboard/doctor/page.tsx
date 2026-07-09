"use client";

import { useGetTodayQueueQuery, useGetDoctorProfileQuery } from "@/store/api/doctorApi";
import Link from "next/link";
import PageHeader from "@/components/shared/PageHeader";
import { ArrowRight } from "lucide-react";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import DoctorRevenueChart from "@/components/doctor/DoctorRevenueChart";
import DoctorStats from "@/components/doctor/DoctorStats";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import AlarmClockPlusIcon from "@/icons/alarm-clock-plus-icon";
import RightChevronIcon from "@/icons/right-chevron";
import PenIcon from "@/icons/pen-icon";
import AccessibilityIcon from "@/icons/accessibility-icon";
import { useTranslations, useLocale } from "next-intl";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import ProfileCompletenessWidget from "@/components/dashboard/ProfileCompletenessWidget";
import OPDQueueWidget from "@/components/doctor/OPDQueueWidget";

export default function DoctorDashboard() {
  const t = useTranslations();
  const router = useRouter();
  const user = useSelector((state: any) => state.auth.user);
  const { data, isLoading } = useGetTodayQueueQuery(undefined);
  const { data: profileData } = useGetDoctorProfileQuery(undefined);

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
  const clinic = profileData?.data?.clinicId;

  const locale = useLocale();
  const getGreeting = () => {
    const hour = new Date().getHours();
    const isUrdu = locale === "ur";
    if (hour >= 4 && hour < 12) return isUrdu ? "صبح بخیر" : "Good morning";
    if (hour >= 12 && hour < 17) return isUrdu ? "سہ پہر بخیر" : "Good afternoon";
    if (hour >= 17 && hour < 21) return isUrdu ? "شام بخیر" : "Good evening";
    return isUrdu ? "شب بخیر" : "Good night";
  };

  const isUrdu = locale === "ur";
  const getUrduDayShort = (engDay: string) => {
    const mapping: Record<string, string> = {
      monday: 'پیر',
      tuesday: 'منگل',
      wednesday: 'بدھ',
      thursday: 'جمعرات',
      friday: 'جمعہ',
      saturday: 'ہفتہ',
      sunday: 'اتوار'
    };
    return mapping[engDay.toLowerCase()] || engDay;
  };
  const rawName = profileData?.data?.fullName || user?.name || 'Doctor';
  let cleanName = rawName;
  if (cleanName.toLowerCase().startsWith('dr.')) {
    cleanName = cleanName.substring(3).trim();
  } else if (cleanName.toLowerCase().startsWith('dr ')) {
    cleanName = cleanName.substring(2).trim();
  }
  if (cleanName.startsWith('ڈاکٹر ')) {
    cleanName = cleanName.substring(6).trim();
  }
  const namePart = cleanName;

  const formatTime12h = (timeStr: string) => {
    if (!timeStr) return "";
    const [hoursStr, minutesStr] = timeStr.split(':');
    const hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours}:${minutesStr} ${ampm}`;
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
          {getGreeting()}{isUrdu ? "، ڈاکٹر " : ", Dr. "}{namePart} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base font-semibold">
          {isUrdu ? "خوش آمدید! آج کے لیے آپ کا جائزہ یہاں ہے۔" : "Welcome back! Here is your overview for today."}
        </p>
      </div>

      <ProfileCompletenessWidget
        role="doctor"
        locale={locale}
        onOpenOnboarding={(step) => router.push(`/dashboard/doctor?onboarding=true&step=${step}`)}
      />

      <DoctorStats
        totalSessions={stats.total}
        pendingQueue={stats.pending}
        averageRating={averageRating}
        monthlyRevenue={monthlyRevenue}
      />

      <OPDQueueWidget />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="space-y-6">
          <Card className="flex flex-col h-fit">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-white/5 pb-4">
              <CardTitle className="text-xl">{t('doctor.dashboard.todaysAppointments')}</CardTitle>
              <Link href="/dashboard/doctor/appointments" className="text-sm font-bold text-primary hover:underline hover:underline-offset-4">
                {t('doctor.dashboard.viewSchedule')}
              </Link>
            </CardHeader>
            <CardContent className="pt-4">
              {todayQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-gray-400 group-hover:scale-110 transition-transform">
                    <AlarmClockPlusIcon className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-gray-500 dark:text-[#a1a1aa] tracking-widest">{t('doctor.dashboard.queueClear')}</p>
                  <p className="text-[10px] font-medium text-gray-400 mt-1">{t('doctor.dashboard.checkBackLater')}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                  {todayQueue.map((appointment: any) => (
                    <div
                      key={appointment._id}
                      className="group relative rounded-xl border border-gray-100 p-3.5 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all hover:scale-[1.01] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0 border border-black/5 dark:border-white/10 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          {appointment.patientId?.photo ? (
                            <img
                              src={appointment.patientId.photo}
                              alt={appointment.patientId?.name || "Patient"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <AccessibilityIcon className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-900 dark:text-white truncate text-sm">{appointment.patientId?.name || "Patient"}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                            <span className="font-bold">{new Date(appointment.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span className={`font-bold px-2 py-0.5 rounded text-[8px] uppercase tracking-wider ${
                              appointment.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                              appointment.status === 'cancelled' ? 'bg-rose-500/10 text-rose-500' :
                              appointment.status === 'in-progress' ? 'bg-blue-500/10 text-blue-500' :
                              'bg-amber-500/10 text-amber-500'
                            }`}>{appointment.status}</span>
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/doctor/appointments`}
                        className="p-2.5 rounded-full bg-gray-100/50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 group-hover:bg-primary group-hover:text-white transition-all shadow-sm"
                      >
                        <RightChevronIcon className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <DoctorRevenueChart />
        </div>

        <div className="space-y-6">
          {/* Associated Clinic Card */}
          <Card>
            <CardHeader className="border-b border-gray-100 dark:border-white/5 pb-4">
              <CardTitle className="text-xl">{isUrdu ? "منسلک کلینک" : "Associated Clinic"}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {clinic ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="h-14 w-14 rounded-2xl overflow-hidden shrink-0 border border-black/5 dark:border-white/10 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                      {clinic.photo ? (
                        <img
                          src={clinic.photo.startsWith('http') || clinic.photo.startsWith('data:') ? clinic.photo : `${process.env.NEXT_PUBLIC_API_URL}${clinic.photo}`}
                          alt={clinic.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-primary font-black text-xl">{clinic.name.substring(0, 2).toUpperCase()}</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 w-full">
                      <h4 className="font-extrabold text-gray-900 dark:text-white text-base leading-tight truncate">{clinic.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-words">{clinic.address}</p>
                      <div className="flex flex-col min-[450px]:flex-row min-[450px]:items-center gap-1 min-[450px]:gap-3 mt-1.5 text-[11px] sm:text-xs text-text-secondary">
                        <span className="font-semibold whitespace-nowrap" dir="ltr">📞 {clinic.phone}</span>
                        <span className="hidden min-[450px]:inline text-gray-300 dark:text-white/20">|</span>
                        <span className="font-semibold truncate max-w-full" title={clinic.email} dir="ltr">✉️ {clinic.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-white/5 pt-3">
                    <h5 className="text-[10px] font-black uppercase text-primary tracking-widest mb-2">{isUrdu ? "کلینک کے اوقات کار" : "Clinic Operating Hours"}</h5>
                    <div className="grid grid-cols-1 min-[450px]:grid-cols-2 xl:grid-cols-2 gap-2 text-xs" dir="ltr">
                      {Object.entries(clinic.workingHours || {}).map(([day, hours]: [string, any]) => (
                        <div key={day} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 capitalize">
                          <span className="font-bold text-gray-700 dark:text-gray-300">{isUrdu ? getUrduDayShort(day) : day.substring(0, 3)}</span>
                          <span className={`font-semibold ${hours.closed ? 'text-amber-500' : 'text-primary'}`}>
                            {hours.closed ? (isUrdu ? 'بند' : 'Closed') : `${formatTime12h(hours.open)} - ${formatTime12h(hours.close)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-3 text-amber-500 font-bold text-lg">
                    ⚠️
                  </div>
                  <p className="text-sm font-bold text-gray-500 dark:text-[#a1a1aa] tracking-wide">{isUrdu ? "کوئی منسلک کلینک نہیں ہے" : "No Associated Clinic"}</p>
                  <p className="text-[10px] font-medium text-gray-400 mt-1">{isUrdu ? "براہ کرم اپنے کلینک کے منتظم سے کہیں کہ وہ اپنے کلینک میں آپ کا ای میل شامل کریں۔" : "Please ask your clinic administrator to add your email to their clinic."}</p>
                </div>
              )}
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
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('nav.appointments')}</h3>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
