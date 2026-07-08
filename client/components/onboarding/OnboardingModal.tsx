"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

import StepSidebar from "./StepSidebar";
import StepProgressBar from "./StepProgressBar";
import DoctorSteps from "./steps/DoctorSteps";
import ClinicSteps from "./steps/ClinicSteps";
import PatientSteps from "./steps/PatientSteps";

import {
  useUpdateOnboardingMutation,
  useUpdateOnboardingProfileMutation,
} from "@/store/api/authApi";
import { useUpdateDoctorProfileMutation, useUpdateScheduleMutation, doctorApi } from "@/store/api/doctorApi";
import { useSaveSettingsMutation, useAddDoctorMutation, useAddStaffMutation, clinicApi } from "@/store/api/clinicApi";
import { useUpdateProfileMutation, useUpdatePasswordMutation, patientApi } from "@/store/api/patientApi";
import { setCredentials } from "@/store/slices/authSlice";
import type { RootState } from "@/store/store";

interface OnboardingModalProps {
  role: string;
  locale: string;
  onClose?: () => void;
  forceOpenStep?: number | null;
}

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  speed: number;
}

const doctorStepsInfo = [
  { number: 1, label: "Profile Details", labelUr: "پروفائل کی معلومات" },
  { number: 2, label: "Clinic Association", labelUr: "کلینک کا انتخاب" },
  { number: 3, label: "Weekly Schedule", labelUr: "اوقات کار" },
  { number: 4, label: "Settings", labelUr: "ترجیحات" },
];

const clinicStepsInfo = [
  { number: 1, label: "Clinic Details", labelUr: "کلینک کی معلومات" },
  { number: 2, label: "Working Hours", labelUr: "کام کے اوقات" },
  { number: 3, label: "Invite Staff", labelUr: "ٹیم ممبرز" },
];

const patientStepsInfo = [
  { number: 1, label: "Basic Details", labelUr: "بنیادی معلومات" },
  { number: 2, label: "Medical Summary", labelUr: "طبی معلومات" },
  { number: 3, label: "Security & Preferences", labelUr: "سیکیورٹی" },
];

const daysOfWeek = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export default function OnboardingModal({ role, locale, onClose, forceOpenStep }: OnboardingModalProps) {
  const isUrdu = locale === "ur";
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const currentToken = useSelector((state: RootState) => state.auth.accessToken) || "";

  // 1. Determine steps info
  const stepsInfo =
    role === "doctor"
      ? doctorStepsInfo
      : role === "clinic_admin"
      ? clinicStepsInfo
      : patientStepsInfo;
  const totalSteps = stepsInfo.length;

  // Local storage keys
  const storageKeyPrefix = `medeaz_onb_${role}_${user?._id || "guest"}`;

  // 2. Initialize step number
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // 3. Initialize Form State
  const [formData, setFormData] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`${storageKeyPrefix}_data`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback to defaults
        }
      }
    }

    // Default states
    if (role === "doctor") {
      return {
        name: user?.name || "",
        specialization: "",
        licenseNo: "",
        experience: "",
        photo: user?.photo || "",
        practiceType: "joining",
        clinicId: "",
        practiceName: "",
        city: "",
        address: "",
        consultationFee: "1500",
        scheduleDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        scheduleConfig: {
          monday: { startTime: "09:00", endTime: "17:00", duration: 20 },
          tuesday: { startTime: "09:00", endTime: "17:00", duration: 20 },
          wednesday: { startTime: "09:00", endTime: "17:00", duration: 20 },
          thursday: { startTime: "09:00", endTime: "17:00", duration: 20 },
          friday: { startTime: "09:00", endTime: "17:00", duration: 20 },
        },
        autoAcceptBookings: true,
        consultationTypes: ["in-clinic", "video"],
        bio: "",
      };
    } else if (role === "clinic_admin") {
      return {
        name: "",
        clinicType: "",
        registrationNumber: "",
        photo: "",
        workingHours: {
          monday: { open: "09:00", close: "17:00", closed: false },
          tuesday: { open: "09:00", close: "17:00", closed: false },
          wednesday: { open: "09:00", close: "17:00", closed: false },
          thursday: { open: "09:00", close: "17:00", closed: false },
          friday: { open: "09:00", close: "17:00", closed: false },
          saturday: { open: "09:00", close: "17:00", closed: true },
          sunday: { open: "09:00", close: "17:00", closed: true },
        },
        invites: [],
      };
    } else {
      // Patient
      return {
        name: user?.name || "",
        gender: "",
        dob: "",
        bloodGroup: "",
        allergies: [],
        chronicConditions: [],
        phone: user?.phone || "",
        changePassword: false,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        notifications: { email: true, whatsapp: false, sms: false },
      };
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiParticles, setConfettiParticles] = useState<ConfettiParticle[]>([]);

  // Mutations
  const [updateOnboarding] = useUpdateOnboardingMutation();
  const [updateOnboardingProfile] = useUpdateOnboardingProfileMutation();
  const [updateDoctorProfile] = useUpdateDoctorProfileMutation();
  const [updateSchedule] = useUpdateScheduleMutation();
  const [saveClinicSettings] = useSaveSettingsMutation();
  const [addDoctor] = useAddDoctorMutation();
  const [addStaff] = useAddStaffMutation();
  const [updatePatientProfile] = useUpdateProfileMutation();
  const [updatePatientPassword] = useUpdatePasswordMutation();

  // 4. Sync form data to localStorage
  useEffect(() => {
    localStorage.setItem(`${storageKeyPrefix}_data`, JSON.stringify(formData));
  }, [formData, storageKeyPrefix]);

  // 5. Initial Step Setup (skippedStep checks)
  useEffect(() => {
    if (forceOpenStep) {
      setCurrentStep(forceOpenStep);
      return;
    }
    const backendSkip = user?.skippedStep;
    if (typeof backendSkip === "number") {
      setCurrentStep(backendSkip);
    } else {
      const savedStep = localStorage.getItem(`${storageKeyPrefix}_step`);
      if (savedStep) {
        setCurrentStep(Number(savedStep));
      }
    }
  }, [user, forceOpenStep, storageKeyPrefix]);

  // Sync step changes to localStorage
  useEffect(() => {
    localStorage.setItem(`${storageKeyPrefix}_step`, String(currentStep));
  }, [currentStep, storageKeyPrefix]);

  const handleUpdateFormData = (fields: any) => {
    setFormData((prev: any) => ({ ...prev, ...fields }));
    // Clear validation error when editing field
    setErrors((prev) => {
      const copy = { ...prev };
      Object.keys(fields).forEach((k) => delete copy[k]);
      return copy;
    });
  };

  // 6. Confetti particle trigger helper
  const triggerConfetti = () => {
    const colors = ["#00b495", "#38bdf8", "#fbbf24", "#f43f5e", "#a855f7"];
    const particles: ConfettiParticle[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        id: Math.random() + i,
        x: 50,
        y: 40,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 6,
        angle: Math.random() * 360,
        speed: Math.random() * 12 + 8,
      });
    }
    setConfettiParticles(particles);
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      setConfettiParticles([]);
    }, 4000);
  };

  // 7. Validation Logic
  const validateStep = (): boolean => {
    const stepErrors: Record<string, string> = {};

    if (role === "doctor") {
      if (currentStep === 1) {
        if (!formData.name?.trim()) stepErrors.name = isUrdu ? "نام لکھنا لازمی ہے" : "Name is required";
        if (!formData.specialization)
          stepErrors.specialization = isUrdu ? "شعبہ منتخب کرنا لازمی ہے" : "Specialization is required";
      } else if (currentStep === 2) {
        if (formData.practiceType === "joining") {
          if (!formData.clinicId)
            stepErrors.clinicId = isUrdu ? "براہ کرم فہرست سے ایک کلینک منتخب کریں" : "Please select a clinic from the list";
        } else {
          if (!formData.practiceName?.trim())
            stepErrors.practiceName = isUrdu ? "کلینک کا نام لکھنا لازمی ہے" : "Practice Name is required";
          if (!formData.city) stepErrors.city = isUrdu ? "شہر منتخب کریں" : "City is required";
          if (!formData.address?.trim()) stepErrors.address = isUrdu ? "پتہ لکھنا لازمی ہے" : "Address is required";
          if (!formData.consultationFee || Number(formData.consultationFee) <= 0)
            stepErrors.consultationFee = isUrdu ? "درست فیس درج کریں" : "Valid Consultation Fee is required";
        }
      } else if (currentStep === 3) {
        if (!formData.scheduleDays || formData.scheduleDays.length === 0) {
          stepErrors.scheduleDays = isUrdu ? "کم از کم ایک دن منتخب کریں" : "Select at least one day";
        }
      } else if (currentStep === 4) {
        if (!formData.consultationTypes || formData.consultationTypes.length === 0) {
          stepErrors.consultationTypes = isUrdu ? "کم از کم ایک قسم منتخب کریں" : "Select at least one consultation type";
        }
      }
    } else if (role === "clinic_admin") {
      if (currentStep === 1) {
        if (!formData.name?.trim())
          stepErrors.name = isUrdu ? "کلینک کا نام لکھنا لازمی ہے" : "Clinic Name is required";
        if (!formData.clinicType)
          stepErrors.clinicType = isUrdu ? "کلینک کی قسم منتخب کریں" : "Clinic Type is required";
        if (!formData.registrationNumber?.trim())
          stepErrors.registrationNumber = isUrdu ? "رجسٹریشن نمبر لکھنا لازمی ہے" : "Registration number is required";
      }
    } else if (role === "patient") {
      if (currentStep === 1) {
        if (!formData.name?.trim()) stepErrors.name = isUrdu ? "مکمل نام لکھنا لازمی ہے" : "Full Name is required";
        if (!formData.gender) stepErrors.gender = isUrdu ? "صنف منتخب کریں" : "Gender is required";
        if (!formData.dob) stepErrors.dob = isUrdu ? "تاریخ پیدائش منتخب کریں" : "Date of Birth is required";
        if (!formData.bloodGroup)
          stepErrors.bloodGroup = isUrdu ? "خون کا گروپ منتخب کریں" : "Blood Group is required";
      } else if (currentStep === 3) {
        if (!formData.phone?.trim())
          stepErrors.phone = isUrdu ? "فون نمبر لکھنا لازمی ہے" : "Phone number is required";
        if (formData.changePassword) {
          if (!formData.currentPassword)
            stepErrors.currentPassword = isUrdu ? "موجودہ پاس ورڈ لکھیں" : "Current password is required";
          if (!formData.newPassword || formData.newPassword.length < 6)
            stepErrors.newPassword = isUrdu ? "پاس ورڈ کم از کم 6 حروف کا ہونا چاہئے" : "Password must be at least 6 characters";
          if (formData.newPassword !== formData.confirmPassword)
            stepErrors.confirmPassword = isUrdu ? "پاس ورڈ میچ نہیں کر رہے" : "Passwords do not match";
        }
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // 8. Navigation & API Submission
  const handleNext = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);

    try {
      if (role === "doctor") {
        if (currentStep === 1) {
          // Save Profile Info
          const response = await updateOnboardingProfile({
            name: formData.name,
            specialization: formData.specialization,
            licenseNo: formData.licenseNo,
            experience: formData.experience,
            photo: formData.photo,
          }).unwrap();
          dispatch(setCredentials({ user: response.data, accessToken: currentToken }));
          await updateOnboarding({ step: 1 }).unwrap();
        } else if (currentStep === 2) {
          // Clinic details association
          if (formData.practiceType === "joining") {
            const response = await updateOnboardingProfile({
              clinicId: formData.clinicId,
            }).unwrap();
            dispatch(setCredentials({ user: response.data, accessToken: currentToken }));
          } else {
            // Independent practice - create/link clinic details via doctor profile update
            const response = await updateOnboardingProfile({
              name: formData.name,
              specialization: formData.specialization,
              licenseNo: formData.licenseNo,
              experience: formData.experience,
              photo: formData.photo,
            }).unwrap();
            dispatch(setCredentials({ user: response.data, accessToken: currentToken }));
          }
          await updateOnboarding({ step: 2 }).unwrap();
        } else if (currentStep === 3) {
          // Setup weekly schedule slots
          const schedulePayload: Record<string, string[]> = {};
          daysOfWeek.forEach((day) => {
            const isSel = formData.scheduleDays.includes(day.key);
            if (isSel) {
              const config = formData.scheduleConfig[day.key] || { startTime: "09:00", endTime: "17:00", duration: 20 };
              // generate time slots helper
              schedulePayload[day.key] = generateSlots(config.startTime, config.endTime, config.duration);
            } else {
              schedulePayload[day.key] = [];
            }
          });
          await updateSchedule({ schedule: schedulePayload }).unwrap();
          await updateOnboarding({ step: 3 }).unwrap();
        } else if (currentStep === 4) {
          // Preferences & Bio (Final step)
          await updateDoctorProfile({
            bio: formData.bio,
            autoAcceptBookings: formData.autoAcceptBookings,
            consultationTypes: formData.consultationTypes,
          }).unwrap();

          const response = await updateOnboarding({ allDone: true }).unwrap();
          dispatch(setCredentials({ user: response.data, accessToken: currentToken }));
          handleFinishOnboarding();
          return;
        }
      } else if (role === "clinic_admin") {
        if (currentStep === 1) {
          const response = await updateOnboardingProfile({
            name: formData.name,
            clinicType: formData.clinicType,
            registrationNumber: formData.registrationNumber,
            photo: formData.photo,
          }).unwrap();
          dispatch(setCredentials({ user: response.data, accessToken: currentToken }));
          await updateOnboarding({ step: 1 }).unwrap();
        } else if (currentStep === 2) {
          // Save operating hours
          await saveClinicSettings({
            workingHours: formData.workingHours,
          }).unwrap();
          await updateOnboarding({ step: 2 }).unwrap();
        } else if (currentStep === 3) {
          // Invite members (Final step)
          const invitePromises = formData.invites.map((inv: any) => {
            if (inv.role === "doctor") {
              return addDoctor({ email: inv.email }).unwrap();
            } else {
              return addStaff({ email: inv.email, role: "receptionist", name: "Staff Member" }).unwrap();
            }
          });
          await Promise.all(invitePromises);

          const response = await updateOnboarding({ allDone: true }).unwrap();
          dispatch(setCredentials({ user: response.data, accessToken: currentToken }));
          handleFinishOnboarding();
          return;
        }
      } else if (role === "patient") {
        if (currentStep === 1) {
          const response = await updateOnboardingProfile({
            name: formData.name,
            gender: formData.gender,
            dob: formData.dob,
            bloodGroup: formData.bloodGroup,
          }).unwrap();
          dispatch(setCredentials({ user: response.data, accessToken: currentToken }));
          await updateOnboarding({ step: 1 }).unwrap();
        } else if (currentStep === 2) {
          const response = await updateOnboardingProfile({
            allergies: formData.allergies,
            chronicConditions: formData.chronicConditions,
          }).unwrap();
          dispatch(setCredentials({ user: response.data, accessToken: currentToken }));
          await updateOnboarding({ step: 2 }).unwrap();
        } else if (currentStep === 3) {
          // Phone & security (Final step)
          // Only attempt password change for non-Google users
          const isGoogleUser = user?.provider === "google" || user?.emailProvider === "google";
          if (formData.changePassword && !isGoogleUser) {
            await updatePatientPassword({
              currentPassword: formData.currentPassword,
              newPassword: formData.newPassword,
            }).unwrap();
          }

          // Save phone & complete
          const profileResponse = await updatePatientProfile({
            phone: formData.phone,
          }).unwrap();
          dispatch(setCredentials({ user: profileResponse.data || user, accessToken: currentToken }));

          const response = await updateOnboarding({ allDone: true }).unwrap();
          dispatch(setCredentials({ user: response.data, accessToken: currentToken }));
          handleFinishOnboarding();
          return;
        }
      }

      // Invalidate tags based on role to refresh profiles/dashboards immediately
      if (role === "doctor") {
        dispatch(doctorApi.util.invalidateTags(["DoctorProfile", "Schedule"]));
      } else if (role === "clinic_admin" || role === "clinic") {
        dispatch(clinicApi.util.invalidateTags(["Settings", "Overview", "Doctors", "Staff"]));
      } else if (role === "patient") {
        dispatch(patientApi.util.invalidateTags(["Profile", "Dashboard"]));
      }

      // Progress to next step locally
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.data?.message || "Failed to save details. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      // Mark as skipped — backend sets onboardingCompleted=true so modal won't reopen
      const response = await updateOnboarding({ allDone: true }).unwrap();
      // Merge the response user with the existing user to preserve roles array
      const mergedUser = { ...user, ...(response.data || {}), onboardingCompleted: true, isOnboardingComplete: true };
      dispatch(setCredentials({ user: mergedUser as any, accessToken: currentToken }));
      // Also update localStorage directly to avoid race condition
      localStorage.setItem("user", JSON.stringify(mergedUser));
      // Invalidate tags based on role
      if (role === "doctor") {
        dispatch(doctorApi.util.invalidateTags(["DoctorProfile", "Schedule"]));
      } else if (role === "clinic_admin" || role === "clinic") {
        dispatch(clinicApi.util.invalidateTags(["Settings", "Overview", "Doctors", "Staff"]));
      } else if (role === "patient") {
        dispatch(patientApi.util.invalidateTags(["Profile", "Dashboard"]));
      }
      toast.success(isUrdu ? "سیٹ اپ بعد میں مکمل کریں" : "Setup skipped. You can complete it from your profile.");
      if (onClose) onClose();
    } catch (err: any) {
      // If API fails, still close the modal locally to avoid infinite loop
      const mergedUser = { ...user, onboardingCompleted: true, isOnboardingComplete: true };
      dispatch(setCredentials({ user: mergedUser as any, accessToken: currentToken }));
      localStorage.setItem("user", JSON.stringify(mergedUser));
      if (role === "doctor") {
        dispatch(doctorApi.util.invalidateTags(["DoctorProfile", "Schedule"]));
      } else if (role === "clinic_admin" || role === "clinic") {
        dispatch(clinicApi.util.invalidateTags(["Settings", "Overview", "Doctors", "Staff"]));
      } else if (role === "patient") {
        dispatch(patientApi.util.invalidateTags(["Profile", "Dashboard"]));
      }
      if (onClose) onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishOnboarding = () => {
    // Clear storage caches
    localStorage.removeItem(`${storageKeyPrefix}_data`);
    localStorage.removeItem(`${storageKeyPrefix}_step`);

    triggerConfetti();

    toast.success(isUrdu ? "ان بورڈنگ سیٹ اپ کامیابی کے ساتھ مکمل!" : "Onboarding setup completed successfully!");

    // Invalidate tags based on role
    if (role === "doctor") {
      dispatch(doctorApi.util.invalidateTags(["DoctorProfile", "Schedule"]));
    } else if (role === "clinic_admin" || role === "clinic") {
      dispatch(clinicApi.util.invalidateTags(["Settings", "Overview", "Doctors", "Staff"]));
    } else if (role === "patient") {
      dispatch(patientApi.util.invalidateTags(["Profile", "Dashboard"]));
    }

    setTimeout(() => {
      if (onClose) onClose();
    }, 2800);
  };

  // Timings slots helper generator
  const generateSlots = (startTime: string, endTime: string, duration: number): string[] => {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    let startTotal = startHour * 60 + startMin;
    const endTotal = endHour * 60 + endMin;

    const slots: string[] = [];
    while (startTotal + duration <= endTotal) {
      const h = Math.floor(startTotal / 60);
      const m = startTotal % 60;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      startTotal += duration;
    }
    return slots;
  };

  // Get current step details
  const stepDetail = stepsInfo[currentStep - 1];

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 select-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      {/* Confetti Overlay */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {confettiParticles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                backgroundColor: p.color,
                width: p.size,
                height: p.size,
                left: `${p.x}%`,
                top: `${p.y}%`,
              }}
              initial={{ scale: 0.1, x: 0, y: 0, opacity: 1 }}
              animate={{
                x: Math.cos((p.angle * Math.PI) / 180) * p.speed * 45,
                y: Math.sin((p.angle * Math.PI) / 180) * p.speed * 45 + 400,
                rotate: p.angle * 5,
                opacity: [1, 1, 0],
                scale: [1, 1.3, 0.3],
              }}
              transition={{
                duration: Math.random() * 2 + 1.8,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="relative bg-white w-full h-full md:h-auto md:max-h-[85vh] md:max-w-[780px] md:rounded-[20px] shadow-2xl flex flex-col md:flex-row overflow-hidden z-10"
      >
        {/* Left Column (Desktop Step Indicator Sidebar) */}
        <div className="hidden md:flex shrink-0">
          <StepSidebar steps={stepsInfo} currentStep={currentStep} locale={locale} />
        </div>

        {/* Mobile Horizontal Progress Bar */}
        <div className="block md:hidden shrink-0">
          <StepProgressBar currentStep={currentStep} totalSteps={totalSteps} locale={locale} />
        </div>

        {/* Right Column (Contents & Navigation) */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Scrollable Form Body */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[70vh]">
            {/* Step Header */}
            <div className="mb-6">
              <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight leading-tight">
                {stepDetail ? (isUrdu ? stepDetail.labelUr : stepDetail.label) : ""}
              </h2>
              <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium leading-relaxed">
                {role === "doctor" &&
                  (currentStep === 1
                    ? "Fill in your professional medical profile details to build trust."
                    : currentStep === 2
                    ? "Select where you practice, or register a new independent clinic."
                    : currentStep === 3
                    ? "Setup weekly slots when you are available to receive appointments."
                    : "Select consultation formats and write a summary bio.")}
                {role === "clinic_admin" &&
                  (currentStep === 1
                    ? "Setup the identity details of your healthcare clinic."
                    : currentStep === 2
                    ? "Select operating times for your medical facility."
                    : "Send invites to doctors and receptionist staff members.")}
                {role === "patient" &&
                  (currentStep === 1
                    ? "Provide basic profile credentials to customize your experience."
                    : currentStep === 2
                    ? "Declare allergy records to ensure safer medical prescriptions."
                    : "Setup notification preferences and account parameters.")}
              </p>
            </div>

            {/* Step Input Views (Framer Motion Slides) */}
            <div className="relative">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={{
                    enter: (dir: number) => ({
                      x: dir > 0 ? 50 : -50,
                      opacity: 0,
                    }),
                    center: {
                      x: 0,
                      opacity: 1,
                    },
                    exit: (dir: number) => ({
                      x: dir > 0 ? -50 : 50,
                      opacity: 0,
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                >
                  {role === "doctor" && (
                    <DoctorSteps
                      step={currentStep}
                      formData={formData}
                      onChange={handleUpdateFormData}
                      errors={errors}
                      locale={locale}
                    />
                  )}
                  {role === "clinic_admin" && (
                    <ClinicSteps
                      step={currentStep}
                      formData={formData}
                      onChange={handleUpdateFormData}
                      errors={errors}
                      locale={locale}
                    />
                  )}
                  {role === "patient" && (
                    <PatientSteps
                      step={currentStep}
                      formData={formData}
                      onChange={handleUpdateFormData}
                      errors={errors}
                      locale={locale}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Fixed Navigation Row */}
          <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
            {/* Back Button */}
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isUrdu ? "پیچھے" : "Back"}</span>
              </button>
            ) : (
              <div />
            )}

            {/* Skip Button (always visible except on final step if desired, but we allow skip on all) */}
            {currentStep < totalSteps && (
              <button
                type="button"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
              >
                {isUrdu ? "بعد میں کریں" : "Skip Setup"}
              </button>
            )}

            {/* Next / Finish Button */}
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-6.5 py-2.5 rounded-xl bg-[#00b495] hover:bg-[#009b80] text-white text-xs font-black transition-all shadow-md shadow-teal-500/10 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : currentStep === totalSteps ? (
                <span>{isUrdu ? "سیٹ اپ مکمل کریں" : "Complete Setup"}</span>
              ) : (
                <>
                  <span>{isUrdu ? "اگلا مرحلہ" : "Continue"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}
