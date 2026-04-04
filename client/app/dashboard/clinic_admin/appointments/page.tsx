"use client";

import { useState } from "react";
import AppointmentFilters from "@/components/clinic/AppointmentFilters";
import AppointmentTable from "@/components/clinic/AppointmentTable";
import { useTranslations } from "next-intl";

export default function AppointmentsPage() {
  const t = useTranslations();
  const [filters, setFilters] = useState({});

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        {t('clinic.appointments.title')}
      </h1>

      <AppointmentFilters onFilter={setFilters} />
      <AppointmentTable filters={filters} />
    </div>
  );
}
