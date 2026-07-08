"use client";

import React, { useState } from "react";
import { Plus, X, ShieldAlert, HeartPulse, User, Check, ChevronDown } from "lucide-react";

interface PatientStepsProps {
  step: number;
  formData: any;
  onChange: (data: any) => void;
  errors: Record<string, string>;
  locale: string;
}

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];

const commonAllergies = [
  "Penicillin",
  "Sulfa drugs",
  "Peanuts",
  "Pollen",
  "Dust mites",
  "Latex",
];

const commonConditions = [
  "Diabetes",
  "Hypertension",
  "Asthma",
  "Heart disease",
  "Arthritis",
  "Kidney disease",
];

export default function PatientSteps({ step, formData, onChange, errors, locale }: PatientStepsProps) {
  const isUrdu = locale === "ur";

  // State for custom input fields
  const [customAllergy, setCustomAllergy] = useState("");
  const [customCondition, setCustomCondition] = useState("");

  const handleAllergyToggle = (allergy: string) => {
    let list = [...(formData.allergies || [])];
    if (list.includes(allergy)) {
      list = list.filter((a) => a !== allergy);
    } else {
      list.push(allergy);
    }
    onChange({ allergies: list });
  };

  const handleAddCustomAllergy = () => {
    if (!customAllergy.trim()) return;
    const list = [...(formData.allergies || [])];
    if (!list.includes(customAllergy.trim())) {
      list.push(customAllergy.trim());
    }
    onChange({ allergies: list });
    setCustomAllergy("");
  };

  const handleConditionToggle = (condition: string) => {
    let list = [...(formData.chronicConditions || [])];
    if (list.includes(condition)) {
      list = list.filter((c) => c !== condition);
    } else {
      list.push(condition);
    }
    onChange({ chronicConditions: list });
  };

  const handleAddCustomCondition = () => {
    if (!customCondition.trim()) return;
    const list = [...(formData.chronicConditions || [])];
    if (!list.includes(customCondition.trim())) {
      list.push(customCondition.trim());
    }
    onChange({ chronicConditions: list });
    setCustomCondition("");
  };

  const handleNotifPreferenceToggle = (prefKey: string) => {
    const currentNotif = { ...(formData.notifications || { email: true, whatsapp: false, sms: false }) };
    currentNotif[prefKey] = !currentNotif[prefKey];
    onChange({ notifications: currentNotif });
  };

  if (step === 1) {
    return (
      <div className="space-y-4.5 animate-fadeIn">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            {isUrdu ? "مکمل نام *" : "Full Name *"}
          </label>
          <input
            type="text"
            value={formData.name || ""}
            onChange={(e) => onChange({ name: e.target.value })}
            className={`w-full h-11 px-4 rounded-xl border ${
              errors.name ? "border-red-500 bg-red-50/20" : "border-slate-200 focus:border-[#00b495]"
            } text-sm focus:outline-none transition-all font-medium bg-white`}
            placeholder={isUrdu ? "مریض کا نام درج کریں" : "e.g. Ayesha Fatima"}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              {isUrdu ? "صنف *" : "Gender *"}
            </label>
            <div className="relative">
              <select
                value={formData.gender || ""}
                onChange={(e) => onChange({ gender: e.target.value })}
                className={`w-full h-11 px-4 pr-10 rounded-xl border appearance-none ${
                  errors.gender ? "border-red-500 bg-red-50/20" : "border-slate-200 focus:border-[#00b495]"
                } text-sm focus:outline-none transition-all font-medium bg-white`}
              >
                <option value="">{ isUrdu ? "صنف منتخب کریں" : "Select Gender"}</option>
                <option value="male">{isUrdu ? "مرد" : "Male"}</option>
                <option value="female">{isUrdu ? "عورت" : "Female"}</option>
                <option value="other">{isUrdu ? "دیگر" : "Other"}</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {errors.gender && <p className="text-xs text-red-500 mt-1 font-medium">{errors.gender}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              {isUrdu ? "خون کا گروپ *" : "Blood Group *"}
            </label>
            <div className="relative">
              <select
                value={formData.bloodGroup || ""}
                onChange={(e) => onChange({ bloodGroup: e.target.value })}
                className={`w-full h-11 px-4 pr-10 rounded-xl border appearance-none ${
                  errors.bloodGroup ? "border-red-500 bg-red-50/20" : "border-slate-200 focus:border-[#00b495]"
                } text-sm focus:outline-none transition-all font-medium bg-white`}
              >
                <option value="">{isUrdu ? "گروپ منتخب کریں" : "Select Blood Group"}</option>
                {bloodGroups.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {errors.bloodGroup && <p className="text-xs text-red-500 mt-1 font-medium">{errors.bloodGroup}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            {isUrdu ? "تاریخ پیدائش *" : "Date of Birth *"}
          </label>
          <input
            type="date"
            value={formData.dob || ""}
            onChange={(e) => onChange({ dob: e.target.value })}
            className={`w-full h-11 px-4 rounded-xl border ${
              errors.dob ? "border-red-500 bg-red-50/20" : "border-slate-200 focus:border-[#00b495]"
            } text-sm focus:outline-none transition-all font-medium bg-white`}
          />
          {errors.dob && <p className="text-xs text-red-500 mt-1 font-medium">{errors.dob}</p>}
        </div>
      </div>
    );
  }

  if (step === 2) {
    const selectedAllergies = formData.allergies || [];
    const selectedConditions = formData.chronicConditions || [];

    return (
      <div className="space-y-5 animate-fadeIn max-h-[360px] overflow-y-auto pr-1">
        {/* Allergies section */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <ShieldAlert className="w-4.5 h-4.5 text-amber-500" />
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {isUrdu ? "الرجی (کوئی ایک یا زیادہ منتخب کریں)" : "Allergies (Select all that apply)"}
            </label>
          </div>
          <div className="flex flex-wrap gap-2.5 mb-2.5">
            {commonAllergies.map((allergy) => {
              const isSelected = selectedAllergies.includes(allergy);
              return (
                <button
                  type="button"
                  key={allergy}
                  onClick={() => handleAllergyToggle(allergy)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isSelected
                      ? "bg-amber-500/10 text-amber-600 border-amber-300"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {allergy}
                </button>
              );
            })}
          </div>

          {/* Custom Allergy input */}
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder={isUrdu ? "دیگر الرجی لکھیں..." : "Add other allergy..."}
              value={customAllergy}
              onChange={(e) => setCustomAllergy(e.target.value)}
              className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-xs font-medium focus:border-[#00b495] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddCustomAllergy}
              className="h-9 px-3.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Custom Badges list */}
          {selectedAllergies.filter((a: string) => !commonAllergies.includes(a)).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedAllergies
                .filter((a: string) => !commonAllergies.includes(a))
                .map((a: string) => (
                  <span
                    key={a}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-600 capitalize"
                  >
                    <span>{a}</span>
                    <button type="button" onClick={() => handleAllergyToggle(a)}>
                      <X className="w-2.5 h-2.5 hover:text-amber-800" />
                    </button>
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* Chronic Conditions section */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center space-x-2 mb-2">
            <HeartPulse className="w-4.5 h-4.5 text-red-500" />
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {isUrdu ? "دائمی بیماریاں (سلیکٹ کریں)" : "Chronic Conditions (Select all that apply)"}
            </label>
          </div>
          <div className="flex flex-wrap gap-2.5 mb-2.5">
            {commonConditions.map((condition) => {
              const isSelected = selectedConditions.includes(condition);
              return (
                <button
                  type="button"
                  key={condition}
                  onClick={() => handleConditionToggle(condition)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isSelected
                      ? "bg-red-500/10 text-red-600 border-red-300"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {condition}
                </button>
              );
            })}
          </div>

          {/* Custom Condition input */}
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder={isUrdu ? "دیگر دائمی بیماری لکھیں..." : "Add other condition..."}
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-xs font-medium focus:border-[#00b495] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddCustomCondition}
              className="h-9 px-3.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Custom Conditions list */}
          {selectedConditions.filter((c: string) => !commonConditions.includes(c)).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedConditions
                .filter((c: string) => !commonConditions.includes(c))
                .map((c: string) => (
                  <span
                    key={c}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[10px] font-bold text-red-600 capitalize"
                  >
                    <span>{c}</span>
                    <button type="button" onClick={() => handleConditionToggle(c)}>
                      <X className="w-2.5 h-2.5 hover:text-red-800" />
                    </button>
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 3) {
    const showPasswordFields = formData.changePassword;
    const notifs = formData.notifications || { email: true, whatsapp: false, sms: false };

    return (
      <div className="space-y-4.5 animate-fadeIn max-h-[370px] overflow-y-auto pr-1">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            {isUrdu ? "فون نمبر *" : "Phone Number *"}
          </label>
          <input
            type="text"
            value={formData.phone || ""}
            onChange={(e) => onChange({ phone: e.target.value })}
            className={`w-full h-11 px-4 rounded-xl border ${
              errors.phone ? "border-red-500 bg-red-50/20" : "border-slate-200 focus:border-[#00b495]"
            } text-sm focus:outline-none transition-all font-medium bg-white`}
            placeholder={isUrdu ? "فون نمبر درج کریں" : "e.g. 03001234567"}
          />
          {errors.phone && <p className="text-xs text-red-500 mt-1 font-medium">{errors.phone}</p>}
        </div>

        {/* Change Password Toggle */}
        <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900">{isUrdu ? "پاس ورڈ تبدیل کریں" : "Change Account Password"}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {isUrdu ? "اپنے اکاؤنٹ کی حفاظت کے لئے نیا پاس ورڈ سیٹ کریں" : "Setup a new password for your security"}
              </p>
            </div>
            <input
              type="checkbox"
              checked={showPasswordFields}
              onChange={(e) => onChange({ changePassword: e.target.checked })}
              className="w-4.5 h-4.5 text-[#00b495] border-slate-300 rounded focus:ring-[#00b495]"
            />
          </div>

          {showPasswordFields && (
            <div className="space-y-3.5 mt-3 pt-3 border-t border-slate-150 animate-in">
              <div>
                <input
                  type="password"
                  placeholder={isUrdu ? "موجودہ پاس ورڈ" : "Current Password"}
                  value={formData.currentPassword || ""}
                  onChange={(e) => onChange({ currentPassword: e.target.value })}
                  className={`w-full h-9 px-3 rounded-lg border ${
                    errors.currentPassword ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-[#00b495]"
                  } text-xs font-medium focus:outline-none bg-white`}
                />
                {errors.currentPassword && <p className="text-[10px] text-red-500 mt-0.5 font-medium">{errors.currentPassword}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="password"
                    placeholder={isUrdu ? "نیا پاس ورڈ" : "New Password"}
                    value={formData.newPassword || ""}
                    onChange={(e) => onChange({ newPassword: e.target.value })}
                    className={`w-full h-9 px-3 rounded-lg border ${
                      errors.newPassword ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-[#00b495]"
                    } text-xs font-medium focus:outline-none bg-white`}
                  />
                  {errors.newPassword && <p className="text-[10px] text-red-500 mt-0.5 font-medium">{errors.newPassword}</p>}
                </div>
                <div>
                  <input
                    type="password"
                    placeholder={isUrdu ? "نیا پاس ورڈ دوبارہ لکھیں" : "Confirm New Password"}
                    value={formData.confirmPassword || ""}
                    onChange={(e) => onChange({ confirmPassword: e.target.value })}
                    className={`w-full h-9 px-3 rounded-lg border ${
                      errors.confirmPassword ? "border-red-400 bg-red-50/20" : "border-slate-200 focus:border-[#00b495]"
                    } text-xs font-medium focus:outline-none bg-white`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-[10px] text-red-500 mt-0.5 font-medium">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notification preferences */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            {isUrdu ? "اطلاعات کی ترجیحات" : "Notification Preferences"}
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { key: "email", label: "Email" },
              { key: "whatsapp", label: "WhatsApp" },
              { key: "sms", label: "SMS" },
            ].map((pref) => {
              const isSelected = notifs[pref.key];
              return (
                <div
                  key={pref.key}
                  onClick={() => handleNotifPreferenceToggle(pref.key)}
                  className={`cursor-pointer p-2.5 rounded-xl border transition-all flex items-center justify-center space-x-1.5 ${
                    isSelected ? "border-[#00b495] bg-teal-50/15" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-[#00b495] border-[#00b495] text-white" : "border-slate-300"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-xs font-bold text-slate-800">{pref.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
