"use client";

import StaffList from "@/components/clinic/StaffList";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/shared/PageHeader";

export default function StaffPage() {
  const t = useTranslations();
  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('clinic.staff.title')} 
      />
      <StaffList />
    </div>
  );
}
