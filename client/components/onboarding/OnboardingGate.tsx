"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSelector } from "react-redux";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";

import type { RootState } from "@/store/store";
import OnboardingModal from "./OnboardingModal";

interface OnboardingGateProps {
  children: React.ReactNode;
  role?: string;
}

function OnboardingGateContent({ children, role }: OnboardingGateProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<number | null>(null);

  const finalRole = role || user?.role || "patient";
  const onboardingCompleted = Boolean(
    user?.onboardingCompleted ||
    user?.onboardingComplete ||
    user?.isOnboardingComplete
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !user) return;

    // Check query params to force-open onboarding modal
    const showOnboarding = searchParams?.get("onboarding") === "true";
    const targetStepStr = searchParams?.get("step");
    const targetStep = targetStepStr ? Number(targetStepStr) : null;

    if (!onboardingCompleted || showOnboarding) {
      setModalOpen(true);
      setModalStep(targetStep);
    } else {
      setModalOpen(false);
      setModalStep(null);
    }
  }, [mounted, onboardingCompleted, searchParams, user]);

  const handleCloseModal = () => {
    setModalOpen(false);
    // Clear URL parameters if set
    if (searchParams?.get("onboarding") === "true") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("onboarding");
      params.delete("step");
      const cleanUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      router.replace(cleanUrl);
    }
  };

  if (!mounted || !user) return null;

  return (
    <>
      {modalOpen && (
        <OnboardingModal
          role={finalRole}
          locale={locale}
          onClose={handleCloseModal}
          forceOpenStep={modalStep}
        />
      )}
      {children}
    </>
  );
}

export default function OnboardingGate({ children, role }: OnboardingGateProps) {
  return (
    <Suspense fallback={null}>
      <OnboardingGateContent role={role}>{children}</OnboardingGateContent>
    </Suspense>
  );
}
