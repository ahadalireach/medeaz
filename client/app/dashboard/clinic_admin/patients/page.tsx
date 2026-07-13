"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGetPatientsQuery, useGetDoctorsQuery } from "@/store/api/clinicApi";
import { useTranslations, useLocale } from "next-intl";
import { Search, UserCircle2, User, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { HealthScoreGauge } from "@/components/shared/HealthScoreGauge";
import { useGetHealthScoreQuery } from "@/store/api/patientApi";
import PageHeader from "@/components/shared/PageHeader";

const PatientHealthScoreBadge = ({ patientId }: { patientId: string }) => {
  const { data, isLoading } = useGetHealthScoreQuery(patientId);
  return (
    <HealthScoreGauge
      size="sm"
      score={data?.data?.score || 0}
      breakdown={data?.data?.breakdown}
      isNewPatient={data?.data?.isNewPatient}
      loading={isLoading}
    />
  );
};

function PatientsListContent() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("doctorId") || "";

  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading } = useGetPatientsQuery({ doctorId, page, limit });
  const { data: doctorsData } = useGetDoctorsQuery(undefined);

  // Find target doctor if doctorId is provided
  const targetDoctor = doctorsData?.data?.doctors?.find(
    (d: any) => d._id === doctorId || d.userId?._id === doctorId
  );

  const doctorName = targetDoctor
    ? targetDoctor.fullName || targetDoctor.userId?.name
    : "";

  const patients = data?.data?.patients || [];
  const pagination = data?.data?.pagination;

  const getPatientAvatar = (patient: any) => {
    const raw = patient.photo || patient.patientProfile?.profilePhoto || "";
    if (!raw) return "";
    if (raw.startsWith("http") || raw.startsWith("data:")) return raw;
    const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");
    return `${base}${raw.startsWith("/") ? "" : "/"}${raw}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader 
        label={doctorId ? (locale === 'ur' ? 'ڈاکٹر فلٹرنگ' : 'Doctor Filtering') : undefined} 
        title={
          doctorId ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
              >
                <ChevronLeft className="h-5 w-5 text-text-primary" />
              </button>
              {locale === 'ur' ? `ڈاکٹر ${doctorName || "Doctor"} کے مریض` : `Patients of Dr. ${doctorName || "Doctor"}`}
            </div>
          ) : (t("nav.patients") || "Patients")
        } 
        action={
          <div className="flex gap-3">
            <Link
              href="/dashboard/clinic_admin/patients/search"
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-white/5 text-text-primary rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-all text-xs sm:text-sm shadow-xs"
            >
              <Search className="h-4 w-4" /> {t("common.search") || "Search"}
            </Link>
            <Link
              href="/dashboard/clinic_admin/patients/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all text-xs sm:text-sm shadow-sm"
            >
              + {t("patients.addPatient") || "Add Patient"}
            </Link>
          </div>
        } 
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-gray-50 dark:bg-white/5 animate-pulse rounded-xl border border-black/5 dark:border-white/5" />
          ))}
        </div>
      ) : patients.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {patients.map((patient: any) => (
              <div
                key={patient._id}
                className="bg-white dark:bg-[#18181b] p-6 rounded-xl border border-black/5 dark:border-white/10 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="h-16 w-16 rounded-2xl overflow-hidden shrink-0 border border-black/5 dark:border-white/5 bg-primary/10 flex items-center justify-center">
                      {getPatientAvatar(patient) ? (
                        <img
                          src={getPatientAvatar(patient)}
                          alt={patient.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserCircle2 className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                        {patient.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {patient.email}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <PatientHealthScoreBadge patientId={patient._id} />
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-4 text-left p-3.5 bg-gray-50 dark:bg-white/5 rounded-2xl mb-4 border border-black/5 dark:border-white/5">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t("form.gender") || "Gender"}</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white capitalize mt-0.5">
                      {patient.patientProfile?.gender || patient.gender || "Not Provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t("clinic.patientSearch.totalVisits") || "Visits"}</p>
                    <p className="text-sm font-black text-primary mt-0.5">{patient.totalVisits || 0}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    onClick={() => router.push(`/dashboard/clinic_admin/patients/${patient._id}`)}
                    className="w-full py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-all font-bold text-[10px] uppercase tracking-widest shadow-xs"
                  >
                    {t("clinic.patientSearch.viewProfile") || "Profile"}
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/clinic_admin/appointments?patientId=${patient._id}`)}
                    className="w-full py-2.5 bg-white dark:bg-[#18181b] text-primary border border-primary rounded-xl hover:bg-primary/5 transition-all font-bold text-[10px] uppercase tracking-widest shadow-xs"
                  >
                    {t("clinic.appointments.title") || "Appointments"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-4">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5 text-xs font-bold disabled:opacity-50 text-text-primary"
                >
                  {t("common.previous") || "Prev"}
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, pagination.pages))}
                  disabled={page >= pagination.pages}
                  className="px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5 text-xs font-bold disabled:opacity-50 text-text-primary"
                >
                  {t("common.next") || "Next"}
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-[#18181b] p-16 rounded-xl border border-black/5 dark:border-white/10 text-center shadow-xs">
          <div className="h-16 w-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {doctorId
              ? (locale === 'ur' ? 'اس ڈاکٹر کے لیے کوئی مریض نہیں ملا۔' : 'No patients found for this doctor.')
              : (locale === 'ur' ? 'کوئی مریض نہیں ملا۔' : 'No patients found.')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 font-medium">
            {locale === 'ur'
              ? 'جن مریضوں نے اپائنٹمنٹس شیڈول کی ہیں یا مکمل کی ہیں وہ یہاں نظر آئیں گے۔'
              : 'Patients who have scheduled or completed appointments will be displayed here.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function PatientsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-12 w-48 bg-gray-50 dark:bg-white/5 animate-pulse rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-gray-50 dark:bg-white/5 animate-pulse rounded-xl border border-black/5 dark:border-white/5" />
            ))}
          </div>
        </div>
      }
    >
      <PatientsListContent />
    </Suspense>
  );
}
