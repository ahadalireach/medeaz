"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import AppointmentFilters from "@/components/clinic/appointments/AppointmentFilters";
import AppointmentTable from "@/components/clinic/appointments/AppointmentTable";
import { useGetAppointmentsQuery, useGetPatientProfileQuery } from "@/store/api/clinicApi";
import { useAppointmentFilters } from "@/hooks/useAppointmentFilters";
import { useTranslations, useLocale } from "next-intl";
import CreateAppointmentModal from "@/components/clinic/appointments/CreateAppointmentModal";
import PageHeader from "@/components/shared/PageHeader";

function AppointmentsContent() {
  const t = useTranslations();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId") || "";
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    filters,
    searchVal,
    setSearch,
    updateFilter,
    resetFilters,
    isDirty,
    dateError,
  } = useAppointmentFilters();

  const activeFilters = patientId ? { ...filters, patientId } : filters;

  const { data, isLoading, isFetching } = useGetAppointmentsQuery(activeFilters);
  const { data: patientData } = useGetPatientProfileQuery(patientId, { skip: !patientId });

  const appointments = data?.data?.appointments || [];
  const pagination = data?.data?.pagination || { total: 0, page: 1, pages: 1, limit: 10 };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('clinic.appointments.title') || "Appointments"} 
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-[#00b495] hover:bg-[#009c81] rounded-xl transition-all shadow-md shadow-[#00b495]/10"
          >
            <Plus className="h-4 w-4" /> {t('clinic.appointments.createAppointment') || "Create Appointment"}
          </button>
        } 
      />

      {patientId && (
        <div className={`rounded-2xl border border-[#00b495]/20 bg-[#e6f8f4]/30 px-4 py-3 ${locale === 'ur' ? 'text-right font-medium' : 'text-left font-bold'}`} dir={locale === 'ur' ? 'rtl' : 'ltr'}>
          <p className="text-sm text-[#00b495]">
             {t('clinic.appointments.showingForPatient', { name: patientData?.data?.patient?.name || "..." })}
          </p>
        </div>
      )}

      <AppointmentFilters
        filters={filters}
        searchVal={searchVal}
        setSearch={setSearch}
        updateFilter={updateFilter}
        resetFilters={resetFilters}
        isDirty={isDirty}
        dateError={dateError}
      />

      <AppointmentTable
        appointments={appointments}
        pagination={pagination}
        isLoading={isLoading || isFetching}
        page={filters.page}
        setPage={(p) => updateFilter("page", p)}
        resetFilters={resetFilters}
      />

      <CreateAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

function AppointmentsPageWrapper() {
  const t = useTranslations();
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-secondary">{t('clinic.appointments.loading') || "Loading appointments..."}</div>}>
      <AppointmentsContent />
    </Suspense>
  );
}

export default function AppointmentsPage() {
  return <AppointmentsPageWrapper />;
}
