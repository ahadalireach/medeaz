"use client";

import { signIn, getSession } from "next-auth/react";
import { useGoogleAuthMutation } from "@/store/api/authApi";
import { setCredentials } from "@/store/slices/authSlice";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";

interface UseGoogleAuthProps {
  mode: "login" | "register";
  role?: string;
}

export function useGoogleAuth({ mode, role }: UseGoogleAuthProps) {
  const t = useTranslations();
  const dispatch = useDispatch();
  const router = useRouter();
  const [googleAuth, { isLoading }] = useGoogleAuthMutation();

  const handleGoogleAuth = async () => {
    if (mode === "register" && !role) {
      toast.error(t("auth.selectRoleFirst") || "Please select your role first");
      return;
    }

    const toastId = toast.loading(
      mode === "register" ? "Creating your account..." : "Authenticating..."
    );

    try {
      // Trigger Google OAuth popup without redirect
      const result = await signIn("google", { redirect: false });
      
      // If popup dismissed or failed
      if (!result || result.error) {
        toast.dismiss(toastId);
        return;
      }

      // Fetch the session to extract the id_token
      const session = await getSession();
      const idToken = (session as any)?.id_token;

      if (!idToken) {
        toast.error("Failed to retrieve Google credentials", { id: toastId });
        return;
      }

      // Call MedEaz Express backend
      const res = await googleAuth({
        idToken,
        role: role,
      }).unwrap();

      // Store tokens and user state in Redux
      dispatch(
        setCredentials({
          user: res.data || res.user,
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
        })
      );

      // Show success toast
      if (mode === "register") {
        toast.success(t("toast.accountCreated") || "Account created successfully", {
          id: toastId,
        });
      } else {
        toast.success(t("toast.welcomeBack") || "Welcome back!", {
          id: toastId,
        });
      }

      // Redirect to role-specific dashboard
      const redirectRole = res.data?.role || res.user?.role || role;
      router.push(`/dashboard/${redirectRole}`);
    } catch (err: any) {
      const errorMessage = err?.data?.message;

      // Handle specific localized errors
      if (errorMessage === "An account with this email already exists under a different role.") {
        toast.error(t("auth.roleConflict") || errorMessage, { id: toastId });
      } else if (errorMessage === "This email is registered with a password. Please use email login.") {
        toast.error(t("auth.useEmailLogin") || errorMessage, { id: toastId });
      } else if (errorMessage === "No account found. Please register first.") {
        toast.error(t("auth.noAccountFound") || errorMessage, { id: toastId });
      } else {
        toast.error(errorMessage || t("common.error") || "Authentication failed", {
          id: toastId,
        });
      }
    }
  };

  return { handleGoogleAuth, isLoading };
}
