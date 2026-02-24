"use client";

import { useState } from "react";
import { useRegisterMutation } from "@/store/api/authApi";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import {
  ArrowRight,
  UserPlus,
  Stethoscope,
  Building2,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"patient" | "doctor" | "clinic_admin">(
    "patient",
  );
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Profile-specific fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [address, setAddress] = useState("");

  const [register, { isLoading }] = useRegisterMutation();
  const router = useRouter();
  const dispatch = useDispatch();

  const validateForm = () => {
    if (!email.trim()) {
      toast.error("Please enter an email address.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }
    if (!password) {
      toast.error("Please enter a password.");
      return false;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return false;
    }

    // Role-specific validation
    if (role === "patient") {
      if (!fullName.trim() || !phone.trim()) {
        toast.error("Please fill in all patient details.");
        return false;
      }
    } else if (role === "doctor") {
      if (!fullName.trim() || !specialization.trim() || !licenseNo.trim()) {
        toast.error("Please fill in all doctor details.");
        return false;
      }
    } else if (role === "clinic_admin") {
      if (!clinicName.trim() || !address.trim() || !phone.trim()) {
        toast.error("Please fill in all clinic details.");
        return false;
      }
    }

    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const toastId = toast.loading("Processing...");

    // Prepare profile data based on role
    let profileData = {};
    if (role === "patient") {
      profileData = { fullName, phone };
    } else if (role === "doctor") {
      profileData = { fullName, specialization, licenseNo };
    } else if (role === "clinic_admin") {
      profileData = { clinicName, address, phone };
    }

    try {
      await register({ email, password, role, profileData }).unwrap();
      setIsSubmitted(true);
      toast.success("Verification email sent!", { id: toastId });
    } catch (err: any) {
      toast.error(err?.data?.message || "Registration failed", { id: toastId });
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-md text-center py-12">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-in zoom-in duration-500">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4 tracking-tight">
          Check your inbox.
        </h1>
        <p className="text-text-secondary text-base leading-relaxed mb-10 max-w-[320px] mx-auto">
          We've sent a verification link to <br />
          <span className="font-semibold text-foreground">{email}</span>.
        </p>
        <Link href="/login">
          <Button
            variant="outline"
            className="h-12 px-8 rounded-2xl font-semibold"
          >
            Back to Login
          </Button>
        </Link>
      </div>
    );
  }

  const RoleCard = ({ type, icon: Icon, label }: any) => {
    const isSelected = role === type;
    return (
      <div
        onClick={() => setRole(type)}
        className={cn(
          "flex items-center justify-center py-3 px-4 transition-all cursor-pointer rounded-full border-2 text-sm font-semibold flex-1",
          isSelected
            ? "border-primary bg-primary text-white shadow-sm"
            : "border-border-light bg-white text-text-primary transition-shadow",
        )}
      >
        <Icon
          className={cn(
            "w-4 h-4 mr-2",
            isSelected ? "text-white" : "text-text-muted",
          )}
        />
        {label}
      </div>
    );
  };

  return (
    <div className="w-full max-w-md text-center pt-8 md:pt-0">
      <h1 className="text-heading font-semibold tracking-tight text-4xl md:text-5xl text-foreground mb-10 leading-[1.2]">
        Create account.
      </h1>

      <form onSubmit={handleRegister} className="space-y-5 text-left">
        <div>
          <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider ml-1 block mb-3">
            I am a...
          </label>
          <div className="flex gap-3 mb-2 flex-wrap sm:flex-nowrap">
            <RoleCard type="patient" icon={UserPlus} label="Patient" />
            <RoleCard type="doctor" icon={Stethoscope} label="Doctor" />
            <RoleCard type="clinic_admin" icon={Building2} label="Clinic" />
          </div>
        </div>

        <div className="space-y-4">
          {/* Shared Fields */}
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
              placeholder="Secure password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-14 tracking-wide font-medium rounded-2xl bg-surface/50 border-border shadow-none placeholder:text-text-muted pl-5 pr-14 text-base w-full focus-visible:ring-primary focus-visible:border-primary transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="h-px bg-border-light/50 my-6" />

          {/* Role-Specific Fields */}
          {(role === "patient" || role === "doctor") && (
            <Input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-14 tracking-wide font-medium rounded-2xl bg-surface/50 border-border shadow-none placeholder:text-text-muted px-5 text-base w-full focus-visible:ring-primary focus-visible:border-primary transition-all animate-in slide-in-from-left duration-300"
            />
          )}

          {role === "doctor" && (
            <>
              <Input
                type="text"
                placeholder="Specialization (e.g. Cardiologist)"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                required
                className="h-14 tracking-wide font-medium rounded-2xl bg-surface/50 border-border shadow-none placeholder:text-text-muted px-5 text-base w-full focus-visible:ring-primary focus-visible:border-primary transition-all animate-in slide-in-from-left duration-300"
              />
              <Input
                type="text"
                placeholder="Medical License Number"
                value={licenseNo}
                onChange={(e) => setLicenseNo(e.target.value)}
                required
                className="h-14 tracking-wide font-medium rounded-2xl bg-surface/50 border-border shadow-none placeholder:text-text-muted px-5 text-base w-full focus-visible:ring-primary focus-visible:border-primary transition-all animate-in slide-in-from-left duration-300"
              />
            </>
          )}

          {role === "clinic_admin" && (
            <>
              <Input
                type="text"
                placeholder="Clinic Name"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                required
                className="h-14 tracking-wide font-medium rounded-2xl bg-surface/50 border-border shadow-none placeholder:text-text-muted px-5 text-base w-full focus-visible:ring-primary focus-visible:border-primary transition-all animate-in slide-in-from-left duration-300"
              />
              <Input
                type="text"
                placeholder="Clinic Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="h-14 tracking-wide font-medium rounded-2xl bg-surface/50 border-border shadow-none placeholder:text-text-muted px-5 text-base w-full focus-visible:ring-primary focus-visible:border-primary transition-all animate-in slide-in-from-left duration-300"
              />
            </>
          )}

          {(role === "patient" || role === "clinic_admin") && (
            <Input
              type="tel"
              placeholder="Contact Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="h-14 tracking-wide font-medium rounded-2xl bg-surface/50 border-border shadow-none placeholder:text-text-muted px-5 text-base w-full focus-visible:ring-primary focus-visible:border-primary transition-all animate-in slide-in-from-left duration-300"
            />
          )}

          <Button
            type="submit"
            className="w-full h-14 rounded-2xl font-bold shadow-lg shadow-primary/20 mt-4 group"
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Create Account"}
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </form>

      <p className="mt-12 text-[13px] text-text-secondary font-medium">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-foreground font-semibold hover:underline"
        >
          Login.
        </Link>
      </p>
    </div>
  );
}
