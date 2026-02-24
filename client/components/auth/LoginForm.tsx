"use client";

import { useState } from "react";
import { useLoginMutation } from "@/store/api/authApi";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "react-hot-toast";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  const [login, { isLoading }] = useLoginMutation();
  const router = useRouter();
  const dispatch = useDispatch();

  const validateForm = () => {
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }
    if (!password) {
      toast.error("Please enter your password.");
      return false;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const toastId = toast.loading("Authenticating...");

    try {
      const res = await login({ email, password }).unwrap();

      // Store credentials in Redux
      dispatch(
        setCredentials({ user: res.data, accessToken: res.accessToken }),
      );

      if (res.data.roles && res.data.roles.length > 1) {
        setUserRoles(res.data.roles);
        setShowRoleSelector(true);
        toast.dismiss(toastId);
      } else {
        const role = res.data.roles[0] || "patient";
        toast.success("Welcome back!", { id: toastId });
        router.push(`/dashboard/${role}`);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Invalid credentials", { id: toastId });
    }
  };

  const handleRoleSelect = (role: string) => {
    toast.success(`Accessing ${role} dashboard...`);
    router.push(`/dashboard/${role}`);
  };

  if (showRoleSelector) {
    return (
      <div className="w-full max-w-md text-center animate-in fade-in zoom-in duration-300">
        <h1 className="text-3xl font-bold text-foreground mb-4 tracking-tight">
          Select Portal
        </h1>
        <p className="text-text-secondary mb-10 leading-relaxed">
          Which account would you like to access today?
        </p>

        <div className="grid gap-4">
          {userRoles.map((role) => (
            <Button
              key={role}
              variant="outline"
              onClick={() => handleRoleSelect(role)}
              className="h-20 rounded-2xl border-2 border-border-light hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center transition-all group"
            >
              <span className="text-lg font-bold capitalize text-foreground group-hover:text-primary">
                {role.replace("_", " ")}
              </span>
              <span className="text-xs text-text-muted capitalize">
                Access {role} Dashboard
              </span>
            </Button>
          ))}
        </div>

        <button
          onClick={() => setShowRoleSelector(false)}
          className="mt-8 text-sm font-semibold text-text-muted hover:text-foreground transition-colors"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md text-center">
      <h1 className="text-heading font-semibold text-4xl md:text-5xl tracking-tight text-foreground mb-10 leading-[1.2]">
        Welcome back.
      </h1>

      <form onSubmit={handleLogin} className="space-y-4 text-left">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-14 tracking-wide font-medium rounded-2xl bg-surface/50 border-border shadow-none placeholder:text-text-muted px-5 text-base w-full focus-visible:ring-primary focus-visible:border-primary transition-all"
        />
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-14 tracking-wide font-medium rounded-2xl bg-surface/50 border-border shadow-none placeholder:text-text-muted pl-5 pr-24 text-base w-full focus-visible:ring-primary focus-visible:border-primary transition-all"
          />
          <div className="absolute right-2 top-2 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-10 h-10 rounded-xl text-text-muted hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </Button>
            <Button
              type="submit"
              size="icon"
              className="group w-10 h-10 rounded-xl shadow-none hover:shadow-md transition-shadow"
              disabled={isLoading}
            >
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        <div className="text-left mt-2 pl-2">
          <Link
            href="/forgot-password"
            className="text-xs text-text-secondary font-medium hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </form>

      <p className="mt-12 text-[13px] text-text-secondary font-medium">
        Don't have an account?{" "}
        <Link
          href="/register"
          className="text-foreground font-semibold hover:underline"
        >
          Create one.
        </Link>
      </p>
    </div>
  );
}
