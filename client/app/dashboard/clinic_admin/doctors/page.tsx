"use client";

import DoctorList from "@/components/clinic/DoctorList";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/shared/PageHeader";

export default function DoctorsPage() {
  const t = useTranslations();
  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('nav.doctors')} 
      />
      <DoctorList />
    </div>
  );
}
