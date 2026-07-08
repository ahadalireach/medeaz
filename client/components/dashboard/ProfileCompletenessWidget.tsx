"use client";

import React from "react";
import { useSelector } from "react-redux";
import { useGetDoctorProfileQuery } from "@/store/api/doctorApi";
import { useGetSettingsQuery } from "@/store/api/clinicApi";
import { useGetProfileQuery } from "@/store/api/patientApi";
import type { RootState } from "@/store/store";
import { CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";

interface ProfileCompletenessWidgetProps {
  role: string;
  locale: string;
  onOpenOnboarding: (step: number) => void;
}

export default function ProfileCompletenessWidget({
  role,
  locale,
  onOpenOnboarding,
}: ProfileCompletenessWidgetProps) {
  const isUrdu = locale === "ur";
  const user = useSelector((state: RootState) => state.auth.user);

  // Fetch role-specific details
  const { data: docData, isLoading: loadingDoc } = useGetDoctorProfileQuery(undefined, { skip: role !== "doctor" });
  const { data: clinicData, isLoading: loadingClinic } = useGetSettingsQuery(undefined, { skip: role !== "clinic_admin" });
  const { data: patData, isLoading: loadingPat } = useGetProfileQuery(undefined, { skip: role !== "patient" });

  const doctorProfile = docData?.data;
  const clinicSettings = clinicData?.data;
  const patientProfile = patData?.data;

  // Check if active query is still loading to prevent 0% flash
  const queryLoading = (role === "doctor" && loadingDoc) ||
                       (role === "clinic_admin" && loadingClinic) ||
                       (role === "patient" && loadingPat);

  if (queryLoading) {
    return null;
  }

  // Percentage and Step Calculation
  let percentage = 0;
  let nextStep = 1;

  if (role === "doctor") {
    const hasName = !!(user?.name || doctorProfile?.fullName);
    const hasSpec = !!doctorProfile?.specialization;
    const hasLicense = !!doctorProfile?.licenseNo;
    const hasExp = !!(doctorProfile?.experience && Number(doctorProfile.experience) > 0);
    const hasPhoto = !!(user?.photo || doctorProfile?.photo);
    const hasSchedule = !!(doctorProfile?.schedule && Object.keys(doctorProfile.schedule).length > 0);
    const hasPrefs = !!(doctorProfile?.bio || (doctorProfile?.consultationTypes && doctorProfile.consultationTypes.length > 0));

    if (hasName) percentage += 15;
    if (hasSpec) percentage += 15;
    if (hasLicense) percentage += 15;
    if (hasExp) percentage += 15;
    if (hasPhoto) percentage += 15;
    if (hasSchedule) percentage += 15;
    if (hasPrefs) percentage += 10;

    // Determine next step
    if (!hasName || !hasSpec || !hasExp || !hasPhoto) {
      nextStep = 1;
    } else if (!doctorProfile?.clinicId) {
      nextStep = 2;
    } else if (!hasSchedule) {
      nextStep = 3;
    } else {
      nextStep = 4;
    }
  } else if (role === "clinic_admin") {
    const hasName = !!clinicSettings?.name;
    const hasType = !!clinicSettings?.clinicType;
    const hasReg = !!clinicSettings?.registrationNumber;
    const hasHours = !!(clinicSettings?.workingHours && Object.keys(clinicSettings.workingHours).length > 0);
    const hasStaff = !!(clinicSettings?.doctors?.length > 0 || clinicSettings?.staff?.length > 0);

    if (hasName) percentage += 20;
    if (hasType) percentage += 20;
    if (hasReg) percentage += 20;
    if (hasHours) percentage += 20;
    if (hasStaff) percentage += 20;

    if (!hasName || !hasType || !hasReg) {
      nextStep = 1;
    } else if (!hasHours) {
      nextStep = 2;
    } else {
      nextStep = 3;
    }
  } else {
    // Patient
    const hasName = !!(user?.name || patientProfile?.name);
    const hasDob = !!patientProfile?.dob;
    const hasBlood = !!patientProfile?.bloodGroup;
    const hasMedical = !!((patientProfile?.allergies && patientProfile.allergies.length > 0) || 
                          (patientProfile?.chronicConditions && patientProfile.chronicConditions.length > 0));

    if (hasName) percentage += 25;
    if (hasDob) percentage += 25;
    if (hasBlood) percentage += 25;
    if (hasMedical) percentage += 25;

    if (!hasName || !hasDob || !hasBlood) {
      nextStep = 1;
    } else if (!hasMedical) {
      nextStep = 2;
    } else {
      nextStep = 3;
    }
  }

  // If already 100% complete or onboardingCompleted is flagged, do not show the widget!
  if (percentage >= 100 || user?.onboardingCompleted) {
    return null;
  }

  return (
    <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center sm:justify-between gap-4 select-none">
      <div className="flex items-center space-x-4">
        {/* Radial SVG Progress ring */}
        <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-95" viewBox="0 0 36 36">
            {/* track */}
            <circle
              className="text-slate-100"
              strokeWidth="3"
              stroke="currentColor"
              fill="transparent"
              r="16"
              cx="18"
              cy="18"
            />
            {/* progress */}
            <circle
              className="text-[#00b495] transition-all duration-500 ease-out"
              strokeWidth="3.2"
              strokeDasharray="100, 100"
              strokeDashoffset={100 - percentage}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="16"
              cx="18"
              cy="18"
            />
          </svg>
          <span className="absolute text-xs font-black text-slate-700">
            {percentage}%
          </span>
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-[#00b495] shrink-0" />
            <span>{isUrdu ? "پروفائل نامکمل ہے" : "Complete your setup"}</span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5 leading-normal max-w-sm">
            {isUrdu
              ? `میڈ ایز کے تمام فوائد حاصل کرنے کے لئے اپنے پروفائل کے بقیہ حصے کو مکمل کریں۔`
              : `Your profile strength is ${percentage}%. Finish the onboarding steps to unlock all MedEaz features.`}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpenOnboarding(nextStep)}
        className="w-full sm:w-auto px-4.5 py-2.5 bg-[#00b495] hover:bg-[#009b80] text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1 transition-all hover:scale-[1.02] shadow-md shadow-teal-500/5 shrink-0"
      >
        <span>{isUrdu ? "ابھی مکمل کریں" : "Complete Now"}</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
