"use client";

import React, { useState, useEffect } from "react";
import { Upload, Search, Building2, User, Clock, Check, ChevronDown } from "lucide-react";
import { useGetClinicsQuery } from "@/store/api/patientApi";
import { AnimatePresence, motion } from "framer-motion";

interface DoctorStepsProps {
  step: number;
  formData: any;
  onChange: (data: any) => void;
  errors: Record<string, string>;
  locale: string;
}

const specializations = [
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Pediatrician",
  "Gynecologist",
  "Orthopedic",
  "Neurologist",
  "Ophthalmologist",
  "Psychiatrist",
  "Dentist",
  "Other",
];

const cities = [
  "Lahore",
  "Karachi",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Other",
];

const timeOptions: string[] = [];
for (let h = 6; h <= 22; h++) {
  const hh = String(h).padStart(2, "0");
  timeOptions.push(`${hh}:00`);
  if (h !== 22) {
    timeOptions.push(`${hh}:30`);
  }
}

const daysOfWeek = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
];

export default function DoctorSteps({ step, formData, onChange, errors, locale }: DoctorStepsProps) {
  const isUrdu = locale === "ur";

  // Step 1: Photo Upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 2: Clinic Search
  const { data: clinicsData, isLoading: isLoadingClinics } = useGetClinicsQuery(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const clinicsList = clinicsData?.data || [];

  const filteredClinics = clinicsList.filter((c: any) => {
    const nameMatch = c.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const addrMatch = c.address?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || addrMatch;
  });

  if (step === 1) {
    return (
      <div className="space-y-5 animate-fadeIn">
        <div className="flex flex-col items-center justify-center space-y-3 mb-2">
          <div className="relative group">
            {formData.photo ? (
              <img
                src={formData.photo}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-md group-hover:opacity-90 transition-opacity"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-400 group-hover:border-teal-500 transition-colors">
                <User className="w-10 h-10" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 bg-[#00b495] text-white p-2 rounded-full cursor-pointer hover:bg-[#009b80] transition-colors shadow-lg">
              <Upload className="w-4 h-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {isUrdu ? "پروفائل تصویر اپ لوڈ کریں" : "Upload your profile picture (JPEG/PNG)"}
          </span>
        </div>

        <div className="space-y-4">
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
              } text-sm focus:outline-none transition-all font-medium`}
              placeholder={isUrdu ? "ڈاکٹر کا نام درج کریں" : "e.g. Dr. Muhammad Ali"}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              {isUrdu ? "خصوصیت *" : "Specialization *"}
            </label>
            <div className="relative">
              <select
                value={formData.specialization || ""}
                onChange={(e) => onChange({ specialization: e.target.value })}
                className={`w-full h-11 px-4 pr-10 rounded-xl border appearance-none ${
                  errors.specialization ? "border-red-500 bg-red-50/20" : "border-slate-200 focus:border-[#00b495]"
                } text-sm focus:outline-none transition-all font-medium bg-white`}
              >
                <option value="">{isUrdu ? "انتخاب کریں" : "Select Specialization"}</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {errors.specialization && (
              <p className="text-xs text-red-500 mt-1 font-medium">{errors.specialization}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {isUrdu ? "پی ایم ڈی سی لائسنس نمبر" : "PMDC License No"}
              </label>
              <input
                type="text"
                value={formData.licenseNo || ""}
                onChange={(e) => onChange({ licenseNo: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-[#00b495] text-sm focus:outline-none transition-all font-medium"
                placeholder={isUrdu ? "جیسے 12345-P" : "e.g. 12345-P"}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {isUrdu ? "تجربہ (سال) *" : "Years of Experience *"}
              </label>
              <input
                type="number"
                min="0"
                value={formData.experience || ""}
                onChange={(e) => onChange({ experience: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-[#00b495] text-sm focus:outline-none transition-all font-medium"
                placeholder="e.g. 8"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    const isIndependent = formData.practiceType === "independent";

    return (
      <div className="space-y-5 animate-fadeIn">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card A: Join Existing */}
          <div
            onClick={() => onChange({ practiceType: "joining", clinicId: "", location: { address: "", city: "" } })}
            className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-start space-x-3.5 ${
              formData.practiceType === "joining"
                ? "border-[#00b495] bg-teal-50/10 shadow-sm"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/30"
            }`}
          >
            <div className={`p-2.5 rounded-xl ${formData.practiceType === "joining" ? "bg-teal-100/50 text-[#00b495]" : "bg-slate-100 text-slate-500"}`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{isUrdu ? "کلینک میں شامل ہوں" : "Join Existing Clinic"}</h4>
              <p className="text-xs text-slate-500 mt-1">{isUrdu ? "کسی دوسرے سسٹم کے کلینک سے منسلک ہوں" : "Join a clinic already registered on MedEaz"}</p>
            </div>
          </div>

          {/* Card B: Independent Practice */}
          <div
            onClick={() => onChange({ practiceType: "independent", clinicId: "" })}
            className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-start space-x-3.5 ${
              formData.practiceType === "independent"
                ? "border-[#00b495] bg-teal-50/10 shadow-sm"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/30"
            }`}
          >
            <div className={`p-2.5 rounded-xl ${formData.practiceType === "independent" ? "bg-teal-100/50 text-[#00b495]" : "bg-slate-100 text-slate-500"}`}>
              <User className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{isUrdu ? "نجی پریکٹس" : "Independent Practice"}</h4>
              <p className="text-xs text-slate-500 mt-1">{isUrdu ? "اپنی ذاتی نجی کلینک یا پریکٹس سیٹ کریں" : "Set up your own private clinic or home practice"}</p>
            </div>
          </div>
        </div>

        {/* Dynamic Inner Panel */}
        <div className="border border-slate-100 rounded-2xl p-4.5 bg-slate-50/20">
          {!isIndependent ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={isUrdu ? "کلینک کا نام یا پتہ تلاش کریں..." : "Search clinics by name or location..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 focus:border-[#00b495] text-sm focus:outline-none transition-all font-medium bg-white"
                />
              </div>

              {isLoadingClinics ? (
                <div className="py-8 text-center text-sm text-slate-400 animate-pulse">
                  {isUrdu ? "کلینکس لوڈ ہو رہے ہیں..." : "Loading clinics..."}
                </div>
              ) : filteredClinics.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400 font-medium">
                  {isUrdu ? "کوئی کلینک نہیں ملا" : "No clinics found matching search"}
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {filteredClinics.map((c: any) => {
                    const isSelected = formData.clinicId === c._id;
                    return (
                      <div
                        key={c._id}
                        onClick={() => onChange({ clinicId: c._id })}
                        className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between ${
                          isSelected ? "border-[#00b495] bg-teal-50/30" : "border-slate-150 hover:bg-slate-50 bg-white"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-sm font-bold text-slate-800 truncate">{c.name}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{c.address}</p>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            {c.doctors?.length || 0} {isUrdu ? "ڈاکٹرز" : "Doctors"}
                          </span>
                          {isSelected && (
                            <div className="w-5 h-5 bg-[#00b495] rounded-full flex items-center justify-center text-white">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {errors.clinicId && <p className="text-xs text-red-500 mt-1 font-medium">{errors.clinicId}</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {isUrdu ? "پریکٹس / کلینک کا نام *" : "Practice Name *"}
                </label>
                <input
                  type="text"
                  value={formData.practiceName || ""}
                  onChange={(e) => onChange({ practiceName: e.target.value })}
                  className={`w-full h-11 px-4 rounded-xl border ${
                    errors.practiceName ? "border-red-500 bg-red-50/20" : "border-slate-200 focus:border-[#00b495]"
                  } text-sm focus:outline-none transition-all font-medium bg-white`}
                  placeholder={isUrdu ? "کلینک کا نام درج کریں" : "e.g. Health First Clinic"}
                />
                {errors.practiceName && <p className="text-xs text-red-500 mt-1 font-medium">{errors.practiceName}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isUrdu ? "شہر *" : "City *"}
                  </label>
                  <div className="relative">
                    <select
                      value={formData.city || ""}
                      onChange={(e) => onChange({ city: e.target.value })}
                      className={`w-full h-11 px-4 pr-10 rounded-xl border appearance-none ${
                        errors.city ? "border-red-500 bg-red-50/20" : "border-slate-200 focus:border-[#00b495]"
                      } text-sm focus:outline-none transition-all font-medium bg-white`}
                    >
                      <option value="">{isUrdu ? "شہر منتخب کریں" : "Select City"}</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {errors.city && <p className="text-xs text-red-500 mt-1 font-medium">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    {isUrdu ? "فیس (روپے) *" : "Consultation Fee (Rs) *"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.consultationFee || ""}
                    onChange={(e) => onChange({ consultationFee: e.target.value })}
                    className={`w-full h-11 px-4 rounded-xl border ${
                      errors.consultationFee ? "border-red-500 bg-red-50/20" : "border-slate-200 focus:border-[#00b495]"
                    } text-sm focus:outline-none transition-all font-medium bg-white`}
                    placeholder="e.g. 1500"
                  />
                  {errors.consultationFee && (
                    <p className="text-xs text-red-500 mt-1 font-medium">{errors.consultationFee}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {isUrdu ? "پتہ *" : "Address *"}
                </label>
                <textarea
                  value={formData.address || ""}
                  onChange={(e) => onChange({ address: e.target.value })}
                  className={`w-full rounded-xl border p-4 ${
                    errors.address ? "border-red-500 bg-red-50/20" : "border-slate-200 focus:border-[#00b495]"
                  } text-sm focus:outline-none transition-all font-medium bg-white`}
                  rows={2}
                  placeholder={isUrdu ? "گلی کا پتہ درج کریں..." : "e.g. Suite 4, Medical Block, DHA Phase 5"}
                />
                {errors.address && <p className="text-xs text-red-500 mt-1 font-medium">{errors.address}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 3) {
    const selectedDays = formData.scheduleDays || [];

    const handleDayToggle = (dayKey: string) => {
      let newDays = [...selectedDays];
      if (newDays.includes(dayKey)) {
        newDays = newDays.filter((d) => d !== dayKey);
      } else {
        newDays.push(dayKey);
      }

      // Initialize default times for newly selected days if not present
      const currentConfig = { ...(formData.scheduleConfig || {}) };
      if (!currentConfig[dayKey]) {
        currentConfig[dayKey] = {
          startTime: "09:00",
          endTime: "17:00",
          duration: 20,
        };
      }

      onChange({ scheduleDays: newDays, scheduleConfig: currentConfig });
    };

    const handleConfigChange = (dayKey: string, field: string, value: any) => {
      const currentConfig = { ...(formData.scheduleConfig || {}) };
      currentConfig[dayKey] = {
        ...(currentConfig[dayKey] || {}),
        [field]: value,
      };
      onChange({ scheduleConfig: currentConfig });
    };

    return (
      <div className="space-y-5 animate-fadeIn">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
            {isUrdu ? "دستیاب دن منتخب کریں" : "Select Available Days"}
          </label>
          <div className="flex flex-wrap gap-2.5">
            {daysOfWeek.map((day) => {
              const isSelected = selectedDays.includes(day.key);
              return (
                <button
                  type="button"
                  key={day.key}
                  onClick={() => handleDayToggle(day.key)}
                  className={`px-4.5 py-2.5 rounded-full text-xs font-bold transition-all border ${
                    isSelected
                      ? "bg-[#00b495] text-white border-[#00b495] shadow-sm scale-[1.03]"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {isUrdu ? day.label : day.label}
                </button>
              );
            })}
          </div>
          {errors.scheduleDays && <p className="text-xs text-red-500 mt-2 font-medium">{errors.scheduleDays}</p>}
        </div>

        {/* Dynamic Timing Configuration Rows */}
        <div className="space-y-3.5 max-h-[290px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {daysOfWeek
              .filter((d) => selectedDays.includes(d.key))
              .map((day) => {
                const config = formData.scheduleConfig?.[day.key] || {
                  startTime: "09:00",
                  endTime: "17:00",
                  duration: 20,
                };
                return (
                  <motion.div
                    key={day.key}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 gap-3">
                      <div className="flex items-center space-x-2 shrink-0">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-800 capitalize w-16">{day.key}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center space-x-1">
                          <select
                            value={config.startTime}
                            onChange={(e) => handleConfigChange(day.key, "startTime", e.target.value)}
                            className="h-9 px-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:outline-none"
                          >
                            {timeOptions.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                          <span className="text-slate-400 font-medium text-xs">→</span>
                          <select
                            value={config.endTime}
                            onChange={(e) => handleConfigChange(day.key, "endTime", e.target.value)}
                            className="h-9 px-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:outline-none"
                          >
                            {timeOptions.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            {isUrdu ? "دورانیہ:" : "Dur:"}
                          </span>
                          <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
                            {[15, 20, 30].map((dur) => (
                              <button
                                type="button"
                                key={dur}
                                onClick={() => handleConfigChange(day.key, "duration", dur)}
                                className={`px-2 py-1.5 text-[10px] font-bold transition-colors ${
                                  config.duration === dur ? "bg-slate-800 text-white" : "bg-transparent text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                {dur}m
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </AnimatePresence>
          {selectedDays.length === 0 && (
            <div className="py-12 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
              <Clock className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs font-semibold">{isUrdu ? "کوئی دن منتخب نہیں کیا گیا" : "Select days above to setup timings"}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 4) {
    const consultationTypes = formData.consultationTypes || [];

    const handleTypeToggle = (type: string) => {
      let nextTypes = [...consultationTypes];
      if (nextTypes.includes(type)) {
        nextTypes = nextTypes.filter((t) => t !== type);
      } else {
        nextTypes.push(type);
      }
      onChange({ consultationTypes: nextTypes });
    };

    const remainingChars = 300 - (formData.bio || "").length;

    return (
      <div className="space-y-5 animate-fadeIn">
        {/* Toggle Switch */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
          <div>
            <h4 className="text-sm font-bold text-slate-900">{isUrdu ? "خودکار بکنگ قبول کریں" : "Auto-accept bookings"}</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {isUrdu ? "بغیر دستی منظوری کے مریض کے اپائنٹمنٹ کو خودکار طور پر منظور کریں" : "Instantly approve patient booking requests without manual review"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ autoAcceptBookings: !formData.autoAcceptBookings })}
            className={`w-11 h-6.5 rounded-full transition-colors relative focus:outline-none ${
              formData.autoAcceptBookings ? "bg-[#00b495]" : "bg-slate-200"
            }`}
          >
            <div
              className={`w-5.5 h-5.5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${
                formData.autoAcceptBookings ? "left-5" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Consultation Types */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
            {isUrdu ? "مشاورت کی اقسام *" : "Consultation Types *"}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { key: "in-clinic", label: isUrdu ? "کلینک میں" : "In-clinic consultation" },
              { key: "video", label: isUrdu ? "ویڈیو کال" : "Video consultation" },
              { key: "chat", label: isUrdu ? "چیٹ" : "Chat consultation" },
            ].map((type) => {
              const isSelected = consultationTypes.includes(type.key);
              return (
                <div
                  key={type.key}
                  onClick={() => handleTypeToggle(type.key)}
                  className={`cursor-pointer p-3.5 rounded-xl border-2 transition-all flex items-center space-x-2.5 ${
                    isSelected ? "border-[#00b495] bg-teal-50/15" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-[#00b495] border-[#00b495] text-white" : "border-slate-300"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-bold text-slate-800">{type.label}</span>
                </div>
              );
            })}
          </div>
          {errors.consultationTypes && (
            <p className="text-xs text-red-500 mt-2 font-medium">{errors.consultationTypes}</p>
          )}
        </div>

        {/* Bio Text Area */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              {isUrdu ? "مختصر تعارف / بائیو" : "Short Bio / Summary"}
            </label>
            <span className={`text-[10px] font-bold ${remainingChars < 20 ? "text-red-500" : "text-slate-400"}`}>
              {remainingChars} {isUrdu ? "حروف باقی" : "chars left"}
            </span>
          </div>
          <textarea
            value={formData.bio || ""}
            onChange={(e) => onChange({ bio: e.target.value.slice(0, 300) })}
            className="w-full rounded-xl border border-slate-200 p-4 text-sm focus:border-[#00b495] focus:outline-none transition-all font-medium"
            rows={3}
            placeholder={isUrdu ? "اپنے بارے میں کچھ لکھیں..." : "e.g. Specializing in family medicine and pediatric consultations..."}
          />
        </div>
      </div>
    );
  }

  return null;
}
