import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  roles?: string[];
  avatar?: string;
  avatarInitials?: string;
  provider?: string;
  emailProvider?: string;
  isOnboardingComplete?: boolean;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
}

export function redirectAfterAuth(
  user: AuthUser,
  isNewUser: boolean,
  router: AppRouterInstance
) {
  const role = user.role || "patient";
  const mappedRole = role === "clinic" ? "clinic_admin" : role;
  
  const isOnboardingComplete = Boolean(
    user.isOnboardingComplete ||
    user.onboardingCompleted ||
    (user as any).onboardingComplete
  );

  // If onboarding is not completed, we redirect to dashboard with onboarding=true query parameter
  // so the OnboardingGate immediately displays the OnboardingModal.
  const query = !isOnboardingComplete ? "?onboarding=true" : "";
  
  const dashboardRoutes: Record<string, string> = {
    doctor: `/dashboard/doctor${query}`,
    patient: `/dashboard/patient${query}`,
    clinic_admin: `/dashboard/clinic_admin${query}`,
    clinic: `/dashboard/clinic_admin${query}`,
  };

  const target = dashboardRoutes[mappedRole] || `/dashboard/patient${query}`;
  router.replace(target);
}
