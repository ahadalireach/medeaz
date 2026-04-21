"use client";

import { useState } from "react";
import { useForgotPasswordMutation } from "@/store/api/authApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");

    try {
      await forgotPassword({ email }).unwrap();
      setIsSubmitted(true);
      toast.success("Reset link sent to your email!");
    } catch (err: any) {
      toast.error(err?.data?.message || "Something went wrong");
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6 font-sans">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4 tracking-tight">
            Check your email.
          </h1>
          <p className="text-text-secondary mb-10 leading-relaxed">
            We've sent a password reset link to{" "}
            <span className="font-semibold text-foreground">{email}</span>.
          </p>
          <Link href="/login">
            <Button
              variant="outline"
              className="w-full h-12 rounded-2xl font-semibold"
            >
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6 font-sans">
      <div className="w-full max-w-sm text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-text-muted hover:text-foreground transition-colors mb-8 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to login
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-4 tracking-tight">
          Reset password.
        </h1>
        <p className="text-text-secondary mb-10 leading-relaxed">
          Enter your email address to reset your password for{" "}
          <strong>all your associated Medeaz roles</strong> (Patient, Doctor,
          Clinic).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-14 tracking-wide font-medium rounded-2xl bg-surface/50 border-border shadow-none placeholder:text-text-muted px-5 text-base w-full focus-visible:ring-primary focus-visible:border-primary transition-all"
          />
          <Button
            type="submit"
            className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-primary/20"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </div>
    </div>
  );
}
