"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/store/slices/authSlice";
import { redirectAfterAuth } from "@/lib/redirectAfterAuth";
import { toast } from "react-hot-toast";

export default function GoogleCallbackPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const dispatch = useDispatch();
  const syncAttempted = useRef(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      toast.error("Google authentication session not found. Please log in again.");
      router.replace("/login");
      return;
    }

    if (status === "authenticated" && session?.idToken) {
      if (syncAttempted.current) return;
      syncAttempted.current = true;
      handleBackendSync(session.idToken);
    }
  }, [status, session]);

  async function handleBackendSync(idToken: string) {
    const toastId = toast.loading("Syncing your Google profile...");
    try {
      const pendingRole = sessionStorage.getItem("pendingGoogleRole") || undefined;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

      const response = await fetch(`${apiBaseUrl}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, role: pendingRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "ROLE_REQUIRED") {
          toast.error("Please select a role to complete your signup.", { id: toastId });
          router.replace("/register?error=role_required");
          return;
        }
        throw new Error(data.error || "Authentication sync failed.");
      }

      // Clear pending role from sessionStorage
      sessionStorage.removeItem("pendingGoogleRole");

      // Clear any stale auth data from a previous user session first
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      // Save new tokens in localStorage for the RTK baseQuery
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Store credentials in Redux
      dispatch(
        setCredentials({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
        })
      );

      toast.success("Google account synced successfully!", { id: toastId });

      // Update NextAuth JWT/Session with backend data
      await update({
        user: {
          role: data.user.role,
          isOnboardingComplete: data.user.isOnboardingComplete,
          onboardingStep: data.user.onboardingStep,
          _id: data.user._id,
        },
      });

      // Route based on role and onboarding status
      redirectAfterAuth(data.user, data.isNewUser, router);
    } catch (err: any) {
      console.error("Backend sync error:", err);
      toast.error(err?.message || "Google profile sync failed. Please try again.", {
        id: toastId,
      });
      router.replace("/login");
    }
  }

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-2 border-[#00b495] border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-[14px] text-gray-500 font-medium">
          Setting up your account...
        </p>
      </div>
    </div>
  );
}
