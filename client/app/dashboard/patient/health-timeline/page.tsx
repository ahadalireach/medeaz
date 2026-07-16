'use client';

import { useState, useMemo } from 'react';
import { useGetAppointmentsQuery, useGetHealthScoreQuery } from '@/store/api/patientApi';
import { useSelector } from 'react-redux';
import { useTranslations, useLocale } from 'next-intl';
import { Calendar, CheckCircle2, XCircle, Clock, HeartPulse, Stethoscope, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HealthScoreGauge } from '@/components/shared/HealthScoreGauge';

export default function HealthTimelinePage() {
  const t = useTranslations();
  const locale = useLocale();
  const { data: appointmentsResponse, isLoading } = useGetAppointmentsQuery('all');
  const user = useSelector((state: any) => state.auth.user);
  const { data: healthScoreData, isLoading: isScoreLoading } = useGetHealthScoreQuery(user?._id, {
    skip: !user?._id,
  });

  const appointments = useMemo(() => {
    return appointmentsResponse?.data || [];
  }, [appointmentsResponse]);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a: any, b: any) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [appointments]);

  const stats = useMemo(() => {
    const total = appointments.length;
    const completed = appointments.filter((a: any) => a.status === 'completed').length;
    const missed = appointments.filter((a: any) => ['cancelled', 'no-show'].includes(a.status)).length;
    const upcoming = appointments.filter((a: any) => new Date(a.dateTime) > new Date() && a.status === 'confirmed').length;

    return { total, completed, missed, upcoming };
  }, [appointments]);

  const isUrduLang = locale === 'ur';

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500" dir={isUrduLang ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Timeline Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-black tracking-tight text-text-primary flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
                <HeartPulse size={28} />
              </div>
              {isUrduLang ? 'ہیلتھ ٹائم لائن' : 'Health Timeline'}
            </h1>
            <p className="text-text-secondary mt-2 text-sm leading-relaxed max-w-2xl">
              {isUrduLang 
                ? 'آپ کے تمام دورے، اپائنٹمنٹ، اور طبی تاریخ کی مکمل ٹائم لائن۔'
                : 'A comprehensive timeline of all your visits, appointments, and medical history.'}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-black/5 shadow-sm flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                <Calendar size={12} />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-xl font-bold text-text-primary leading-none">{stats.total}</p>
                <p className="text-[9px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider truncate">{isUrduLang ? 'کل اپائنٹمنٹس' : 'Total Visits'}</p>
              </div>
            </div>
            <div className="bg-white p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-black/5 shadow-sm flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-green-50 text-green-500 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={12} />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-xl font-bold text-text-primary leading-none">{stats.completed}</p>
                <p className="text-[9px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider truncate">{isUrduLang ? 'مکمل شدہ' : 'Completed'}</p>
              </div>
            </div>
            <div className="bg-white p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-black/5 shadow-sm flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
                <Clock size={12} />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-xl font-bold text-text-primary leading-none">{stats.upcoming}</p>
                <p className="text-[9px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider truncate">{isUrduLang ? 'آنے والی' : 'Upcoming'}</p>
              </div>
            </div>
            <div className="bg-white p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-black/5 shadow-sm flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                <XCircle size={12} />
              </div>
              <div className="min-w-0">
                <p className="text-base sm:text-xl font-bold text-text-primary leading-none">{stats.missed}</p>
                <p className="text-[9px] sm:text-xs font-semibold text-text-secondary uppercase tracking-wider truncate">{isUrduLang ? 'منسوخ شدہ' : 'Missed'}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-6 sm:p-10">
            <h2 className="text-lg font-bold text-text-primary mb-8 flex items-center gap-2">
              <Stethoscope size={20} className="text-primary" />
              {isUrduLang ? 'آپ کی ہسٹری' : 'Your History'}
            </h2>

            {sortedAppointments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <FileText size={24} />
                </div>
                <p className="text-text-primary font-medium">{isUrduLang ? 'کوئی ڈیٹا نہیں ملا' : 'No history found'}</p>
                <p className="text-sm text-text-secondary mt-1">{isUrduLang ? 'آپ کی اپائنٹمنٹس کی ٹائم لائن یہاں ظاہر ہوگی۔' : 'Your appointment timeline will appear here.'}</p>
              </div>
            ) : (
              <div className="space-y-0">
                {sortedAppointments.map((apt: any, idx: number) => {
                  const isPast = new Date(apt.dateTime) < new Date();
                  const isCompleted = apt.status === 'completed';
                  const isMissed = ['cancelled', 'no-show'].includes(apt.status);
                  const isLast = idx === sortedAppointments.length - 1;

                  let Icon = Calendar;
                  let iconColor = "text-primary bg-primary/10";

                  if (isCompleted) {
                    Icon = CheckCircle2;
                    iconColor = "text-green-600 bg-green-50";
                  } else if (isMissed) {
                    Icon = XCircle;
                    iconColor = "text-red-500 bg-red-50";
                  } else if (!isPast) {
                    Icon = Clock;
                    iconColor = "text-orange-500 bg-orange-50";
                  }

                  return (
                    <div key={apt._id} className="relative flex gap-4 sm:gap-5">
                      {/* Node + connecting line */}
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "flex items-center justify-center w-11 h-11 rounded-full border-4 border-white shrink-0 shadow-sm ring-1 ring-black/5",
                          iconColor
                        )}>
                          <Icon size={18} />
                        </div>
                        {!isLast && <div className="w-0.5 flex-1 bg-border/70 my-1 rounded-full" />}
                      </div>

                      {/* Card */}
                      <div className={cn(
                        "flex-1 min-w-0 p-4 sm:p-5 rounded-2xl bg-white border border-black/5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all",
                        isLast ? "mb-0" : "mb-6"
                      )}>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-sm font-bold text-primary">
                            {new Date(apt.dateTime).toLocaleDateString(isUrduLang ? 'ur-PK' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className={cn(
                            "text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full whitespace-nowrap",
                            isCompleted ? "bg-green-100 text-green-700" :
                            isMissed ? "bg-red-100 text-red-700" :
                            "bg-orange-100 text-orange-700"
                          )}>
                            {t(`appointment.status.${apt.status}`)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
                            {apt.doctorId?.photo ? (
                              <img src={apt.doctorId.photo} alt={apt.doctorId.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                {apt.doctorId?.name?.charAt(0) || 'D'}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-text-primary text-base leading-tight truncate">Dr. {apt.doctorId?.name || 'Unknown'}</h3>
                            <p className="text-sm text-text-secondary mt-0.5 truncate">
                              {apt.clinicId?.name || t('appointment.clinic')}
                            </p>
                          </div>
                        </div>
                        {apt.reason && (
                          <div className="mt-4 pt-4 border-t border-black/5">
                            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                              <span className="font-semibold text-gray-900 mr-1 rtl:ml-1 rtl:mr-0">{isUrduLang ? 'وجہ:' : 'Reason:'}</span>
                              {apt.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Health Engagement Score Card */}
        <div className="lg:sticky lg:top-8 flex justify-center lg:justify-end">
          <HealthScoreGauge
            size="lg"
            score={healthScoreData?.data?.score || 0}
            breakdown={healthScoreData?.data?.breakdown}
            isNewPatient={healthScoreData?.data?.isNewPatient}
            showMotivation={true}
            loading={isScoreLoading}
          />
        </div>
      </div>
    </div>
  );
}
