"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DoctorSidebar from "@/components/doctor/DoctorSidebar";
import DoctorTopbar from "@/components/doctor/DoctorTopbar";
import OnboardingGate from "@/components/onboarding/OnboardingGate";
import MedicalBackground from "@/components/ui/MedicalBackground";
import { ChatSocketProvider } from "@/providers/ChatSocketProvider";
import { useTranslations } from "next-intl";
import { Footer } from "@/components/home/Footer";

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const accessToken = localStorage.getItem("accessToken");

    if (!userStr || !accessToken) {
      router.replace("/login");
      setIsCheckingAuth(false);
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      if (!userData.roles || !userData.roles.includes("doctor")) {
        router.replace("/login");
        setIsCheckingAuth(false);
        return;
      }
      setIsAuthorized(true);
    } catch {
      router.replace("/login");
    } finally {
      setIsCheckingAuth(false);
    }
  }, [router]);

  if (isCheckingAuth || !isAuthorized) return null;

  return (
    <ChatSocketProvider>
      <div className="flex flex-col min-h-screen relative">
        <MedicalBackground />
        <div className="flex flex-1 transition-colors duration-300 w-full">
          <DoctorSidebar />
          <div className="flex-1 flex flex-col">
            <DoctorTopbar title={t('nav.doctorDashboard')} />
            <OnboardingGate role="doctor" />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-in bg-transparent transition-all duration-300">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
            <Footer/>
          </div>
        </div>
      </div>
    </ChatSocketProvider>
  );
}
