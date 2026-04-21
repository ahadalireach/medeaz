"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ClinicSidebar from "@/components/clinic/ClinicSidebar";
import ClinicTopbar from "@/components/clinic/ClinicTopbar";
import Footer from "@/components/ui/Footer";
import { useTranslations } from "next-intl";
import MedicalBackground from "@/components/ui/MedicalBackground";

export default function ClinicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const accessToken = localStorage.getItem("accessToken");

    if (!userStr || !accessToken) {
      router.push("/login");
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      if (!userData.roles || !userData.roles.includes("clinic_admin")) {
        router.push("/login");
        return;
      }
    } catch {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen relative">
      <MedicalBackground />
      <div className="flex flex-1 transition-colors duration-300 w-full">
        <ClinicSidebar />
        <div className="flex-1 flex flex-col">
          <ClinicTopbar title={t('nav.clinicDashboard')} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-in bg-transparent transition-all duration-300">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
