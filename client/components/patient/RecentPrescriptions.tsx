"use client";

import Link from "next/link";

interface Prescription {
  _id: string;
  diagnosis: string;
  createdAt: string;
  doctorId: {
    name: string;
    doctorProfile?: {
      fullName: string;
      specialization: string;
    };
  };
  clinicId: {
    name: string;
  };
}

interface RecentPrescriptionsProps {
  prescriptions: Prescription[];
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useFormatter, useLocale, useTranslations } from "next-intl";

export default function RecentPrescriptions({ prescriptions }: RecentPrescriptionsProps) {
  const t = useTranslations();
  const format = useFormatter();
  const locale = useLocale();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format.dateTime(date, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">{t('patient.recentPrescriptions')}</CardTitle>
        <Link
          href="/dashboard/patient/records"
          className="text-sm font-bold text-primary hover:underline hover:underline-offset-4"
        >
          {t('patient.dashboard.viewAll')}
        </Link>
      </CardHeader>
      <CardContent>
        {prescriptions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-[#a1a1aa] py-4">
            {t('patient.records.noRecords')}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {prescriptions.map((prescription) => (
              <Link
                key={prescription._id}
                href={`/dashboard/patient/records/${prescription._id}`}
                className="block rounded-2xl border border-gray-100 p-5 transition-all hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 hover:scale-[1.01]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                      {prescription.diagnosis}
                    </p>
                    <p className="mt-1.5 text-[13px] font-semibold text-gray-600 dark:text-[#a1a1aa] leading-tight">
                      {t('patient.bookAppointmentPage.doctorPrefix')} {prescription.doctorId?.doctorProfile?.fullName || prescription.doctorId?.name}
                    </p>
                    <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 italic">
                      {prescription.doctorId?.doctorProfile?.specialization || t('appointment.doctor')}
                    </p>
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-black/5 dark:border-white/5 pt-3">
                      <span className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-widest truncate max-w-[120px] sm:max-w-[150px]">
                        {prescription.clinicId?.name}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 shrink-0">
                        {formatDate(prescription.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
