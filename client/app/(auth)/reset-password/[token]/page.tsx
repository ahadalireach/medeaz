"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useResetPasswordMutation } from "@/store/api/authApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    try {
      await resetPassword({ token: token as string, password }).unwrap();
      setIsSuccess(true);
      toast.success("Password reset successfully!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to reset password");
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6 font-sans">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4 tracking-tight">
            Success!
          </h1>
          <p className="text-text-secondary mb-10 leading-relaxed">
            Your password has been successfully updated. You can now log in with
            your new password.
          </p>
          <Button
            onClick={() => router.push("/login")}
            className="w-full h-14 rounded-2xl font-bold"
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 font-sans">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4 tracking-tight">
          New password.
        </h1>
        <p className="text-text-secondary mb-10 leading-relaxed">
          Please enter your new password below to secure your account.
        </p>

        <form onSubmit={handleReset} className="space-y-4 text-left">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-14 tracking-wide font-medium rounded-2xl bg-surface/50 border-border shadow-none placeholder:text-text-muted px-5 text-base w-full focus-visible:ring-primary focus-visible:border-primary transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="h-14 tracking-wide font-medium rounded-2xl bg-surface/50 border-border shadow-none placeholder:text-text-muted px-5 text-base w-full focus-visible:ring-primary focus-visible:border-primary transition-all"
          />

          <Button
            type="submit"
            className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-primary/20"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
