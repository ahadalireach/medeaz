"use client";

import React, { useState } from "react";
import { Upload, Plus, Trash2, Mail, Users, ClipboardList, Clock, ChevronDown } from "lucide-react";

interface ClinicStepsProps {
  step: number;
  formData: any;
  onChange: (data: any) => void;
  errors: Record<string, string>;
  locale: string;
}

const clinicTypes = [
  "General Clinic",
  "Dental Clinic",
  "Eye Clinic",
  "Paediatric Clinic",
  "Multi-speciality",
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
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export default function ClinicSteps({ step, formData, onChange, errors, locale }: ClinicStepsProps) {
  const isUrdu = locale === "ur";

  // Invite member state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("doctor");

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMember = () => {
    if (!inviteEmail || !inviteEmail.includes("@")) {
      return;
    }
    const currentInvites = [...(formData.invites || [])];
    // Avoid duplicates
    if (currentInvites.some((inv: any) => inv.email.toLowerCase() === inviteEmail.toLowerCase())) {
      return;
    }
    currentInvites.push({
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
    });
    onChange({ invites: currentInvites });
    setInviteEmail("");
  };

  const handleRemoveMember = (email: string) => {
    const currentInvites = (formData.invites || []).filter((inv: any) => inv.email !== email);
    onChange({ invites: currentInvites });
  };

  const handleHourChange = (dayKey: string, field: string, value: any) => {
    const currentHours = { ...(formData.workingHours || {}) };
    currentHours[dayKey] = {
      ...(currentHours[dayKey] || { open: "09:00", close: "17:00", closed: false }),
      [field]: value,
    };
    onChange({ workingHours: currentHours });
  };

  if (step === 1) {
    return (
      <div className="space-y-5 animate-fadeIn">
        <div className="flex flex-col items-center justify-center space-y-3 mb-2">
          <div className="relative group">
            {formData.photo ? (
              <img
                src={formData.photo}
                alt="Clinic Logo"
                className="w-24 h-24 rounded-2xl object-cover border-4 border-slate-100 shadow-md group-hover:opacity-90 transition-opacity"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-400 group-hover:border-teal-500 transition-colors">
                <ClipboardList className="w-10 h-10" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 bg-[#00b495] text-white p-2 rounded-full cursor-pointer hover:bg-[#009b80] transition-colors shadow-lg">
              <Upload className="w-4 h-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {isUrdu ? "کلینک کا لوگو اپ لوڈ کریں" : "Upload your clinic logo (JPEG/PNG)"}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              {isUrdu ? "کلینک کا نام *" : "Clinic Name *"}
            </label>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) => onChange({ name: e.target.value })}
              className={`w-full h-11 px-4 rounded-xl border ${
                errors.name ? "border-red-500 bg-red-50/20" : "border-slate-200 focus:border-[#00b495]"
              } text-sm focus:outline-none transition-all font-medium bg-white`}
              placeholder={isUrdu ? "کلینک کا نام درج کریں" : "e.g. Medeaz Diagnostics"}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1 font-medium">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {isUrdu ? "کلینک کی قسم *" : "Clinic Type *"}
              </label>
              <div className="relative">
                <select
                  value={formData.clinicType || ""}
                  onChange={(e) => onChange({ clinicType: e.target.value })}
                  className={`w-full h-11 px-4 pr-10 rounded-xl border appearance-none ${
                    errors.clinicType ? "border-red-500 bg-red-50/20" : "border-slate-200 focus:border-[#00b495]"
                  } text-sm focus:outline-none transition-all font-medium bg-white`}
                >
                  <option value="">{isUrdu ? "انتخاب کریں" : "Select Clinic Type"}</option>
                  {clinicTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {errors.clinicType && <p className="text-xs text-red-500 mt-1 font-medium">{errors.clinicType}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {isUrdu ? "رجسٹریشن نمبر *" : "Registration Number *"}
              </label>
              <input
                type="text"
                value={formData.registrationNumber || ""}
                onChange={(e) => onChange({ registrationNumber: e.target.value })}
                className={`w-full h-11 px-4 rounded-xl border ${
                  errors.registrationNumber ? "border-red-500 bg-red-50/20" : "border-slate-200 focus:border-[#00b495]"
                } text-sm focus:outline-none transition-all font-medium bg-white`}
                placeholder={isUrdu ? "لائسنس یا رجسٹریشن نمبر" : "e.g. REG-78923"}
              />
              {errors.registrationNumber && (
                <p className="text-xs text-red-500 mt-1 font-medium">{errors.registrationNumber}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
          {isUrdu ? "کام کے اوقات کار مقرر کریں" : "Setup Operating Hours"}
        </label>
        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
          {daysOfWeek.map((day) => {
            const dayConfig = formData.workingHours?.[day.key] || { open: "09:00", close: "17:00", closed: false };
            const isClosed = dayConfig.closed;

            return (
              <div
                key={day.key}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all ${
                  isClosed ? "bg-slate-50 border-slate-150 opacity-70" : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={!isClosed}
                    onChange={(e) => handleHourChange(day.key, "closed", !e.target.checked)}
                    className="w-4.5 h-4.5 text-[#00b495] border-slate-300 rounded-lg focus:ring-[#00b495]"
                  />
                  <span className="text-sm font-bold text-slate-800 capitalize w-20">{day.key}</span>
                </div>

                {!isClosed ? (
                  <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <select
                      value={dayConfig.open}
                      onChange={(e) => handleHourChange(day.key, "open", e.target.value)}
                      className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:outline-none"
                    >
                      {timeOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <span className="text-slate-400 text-xs">to</span>
                    <select
                      value={dayConfig.close}
                      onChange={(e) => handleHourChange(day.key, "close", e.target.value)}
                      className="h-8 px-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:outline-none"
                    >
                      {timeOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider mt-1 sm:mt-0">
                    {isUrdu ? "بند ہے" : "Closed"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (step === 3) {
    const invites = formData.invites || [];

    return (
      <div className="space-y-4 animate-fadeIn">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            {isUrdu ? "ٹیم ممبرز کو مدعو کریں" : "Invite Members to Clinic"}
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder={isUrdu ? "ممبر کا ای میل ایڈریس..." : "Enter email address..."}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 focus:border-[#00b495] text-sm focus:outline-none transition-all font-medium bg-white"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="h-11 px-4 pr-9 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:outline-none select-clean appearance-none relative"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundPosition: 'right 12px center', backgroundSize: '16px', backgroundRepeat: 'no-repeat' }}
              >
                <option value="doctor">{isUrdu ? "ڈاکٹر" : "Doctor"}</option>
                <option value="staff">{isUrdu ? "اسٹاف" : "Staff"}</option>
              </select>

              <button
                type="button"
                onClick={handleAddMember}
                disabled={!inviteEmail || !inviteEmail.includes("@")}
                className="h-11 px-5 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center space-x-1 hover:bg-slate-800 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>{isUrdu ? "شامل کریں" : "Add"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Invited List Table */}
        <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col">
          <div className="bg-slate-50/50 px-4.5 py-3 border-b border-slate-150 flex items-center space-x-2">
            <Users className="w-4.5 h-4.5 text-slate-400" />
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {isUrdu ? "مدعو ممبرز کی فہرست" : "Pending Invitations List"} ({invites.length})
            </h4>
          </div>

          <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100 min-h-36 flex flex-col">
            {invites.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-400 text-center">
                <Users className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs font-semibold">{isUrdu ? "کوئی ممبر شامل نہیں کیا گیا" : "No invitations added to list yet"}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{isUrdu ? "ممبر کو شامل کرنے کے لئے اوپر فارم پر کلک کریں" : "Type an email address and click Add above"}</p>
              </div>
            ) : (
              invites.map((inv: any) => (
                <div key={inv.email} className="px-4.5 py-3 flex items-center justify-between text-sm hover:bg-slate-50/30">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-800 truncate">{inv.email}</p>
                    <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${
                      inv.role === 'doctor' ? 'bg-teal-500/10 text-[#00b495]' : 'bg-slate-500/10 text-slate-600'
                    }`}>
                      {inv.role}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(inv.email)}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
