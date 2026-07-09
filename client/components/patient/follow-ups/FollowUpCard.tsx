"use client";

import Link from "next/link";
import { CalendarCheck, FileText, CheckCircle2, CalendarPlus, UserCheck, X, Building2, Activity, Pill } from "lucide-react";
import { useState } from "react";
import { useCompleteFollowUpMutation } from "@/store/api/patientApi";
import { toast } from "react-hot-toast";
import { useFormatter, useLocale, useTranslations } from "next-intl";

interface FollowUpCardProps {
  followUp: {
    _id: string;
    dueDate: string;
    notes?: string;
    status: "pending" | "completed" | "overdue";
    completedAt?: string;
    appointmentId?: {
      _id: string;
      dateTime: string;
      reason?: string;
      notes?: string;
      type?: string;
      prescriptionId?: string;
      clinicId?: {
        _id: string;
        name: string;
      };
    };
    doctorId: {
      _id: string;
      fullName?: string;
      specialization?: string;
      userId?: {
        name: string;
        photo?: string;
      };
    };
  };
}

export default function FollowUpCard({ followUp }: FollowUpCardProps) {
  const t = useTranslations("patient.followUps");
  const ct = useTranslations("common");
  const [completeFollowUp, { isLoading }] = useCompleteFollowUpMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatter = useFormatter();
  const locale = useLocale();

  const doctorName = followUp.doctorId?.fullName || followUp.doctorId?.userId?.name || "Doctor";
  const specialization = followUp.doctorId?.specialization || "General Medicine";
  const avatar = followUp.doctorId?.userId?.photo;

  // Calculate days until due
  const getDaysDiff = (dateStr: string) => {
    const dueDate = new Date(dateStr);
    const today = new Date();
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysDiff(followUp.dueDate);
  const isOverdue = followUp.status === "overdue" || daysLeft < 0;

  // Determine color scheme for due date display
  const getDueDateStyles = () => {
    if (followUp.status === "completed") {
      return { text: "text-gray-400 border-gray-100 bg-gray-50", label: t("card.completed") };
    }
    if (isOverdue) {
      return { text: "text-red-600 border-red-100 bg-red-50", label: t("card.overdue") };
    }
    if (daysLeft === 0) {
      return { text: "text-red-500 border-red-100 bg-red-50", label: t("card.dueToday") };
    }
    if (daysLeft === 1) {
      return { text: "text-amber-600 border-amber-100 bg-amber-50", label: t("card.dueInDay", { days: 1 }) };
    }
    return { text: "text-[#00b495] border-[#e6f8f4] bg-[#e6f8f4]/20", label: t("card.dueInDays", { days: daysLeft }) };
  };

  const dueStyle = getDueDateStyles();

  const handleMarkAsDone = async () => {
    try {
      await completeFollowUp(followUp._id).unwrap();
      toast.success(t("card.completed"));
    } catch (err: any) {
      if (err?.status === 409) {
        toast.error("Already marked complete.");
      } else {
        toast.error(err?.data?.message || "Failed to update follow-up");
      }
    }
  };

  return (
    <div
      className="bg-white rounded-2xl border p-6 transition-all duration-300 border-gray-250/70 shadow-sm hover:border-[#00b495]/40 hover:shadow-lg hover:shadow-gray-100"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        {/* Doctor Info */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 border border-gray-200 overflow-hidden shrink-0">
            {avatar ? (
              <img src={avatar} alt={doctorName} className="h-full w-full object-cover" />
            ) : (
              <span>{doctorName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">
              {ct("doctorPrefix")} {doctorName}
            </h3>
            <p className="text-xs text-gray-400 font-semibold">{specialization}</p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="self-start">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              followUp.status === "completed"
                ? "bg-[#e6f8f4] text-[#00b495] border border-[#00b495]/20"
                : isOverdue
                ? "bg-red-50 text-red-600 border border-red-200"
                : "bg-blue-50 text-blue-600 border border-blue-200"
            }`}
          >
            {followUp.status === "completed" ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <CalendarCheck className="h-3.5 w-3.5" />
            )}
            <span className="capitalize">
              {followUp.status === "completed"
                ? t("card.completed")
                : isOverdue
                ? t("card.overdue")
                : t("tabs.upcoming")}
            </span>
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Due Date Indicator */}
        <div className={`p-4 rounded-xl border flex flex-col gap-0.5 ${dueStyle.text}`}>
          <span className="text-[10px] font-black uppercase tracking-wider opacity-85">
            {t("card.dueDateLabel")}
          </span>
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <span className="text-lg font-black tracking-tight">
              {formatter.dateTime(new Date(followUp.dueDate), {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="text-xs font-black uppercase tracking-widest bg-white/60 px-2.5 py-0.5 rounded-full border border-current/10">
              {dueStyle.label}
            </span>
          </div>
        </div>

        {/* Original Appointment Link (Clickable Detail Trigger) */}
        {followUp.appointmentId && (
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 hover:text-[#00b495] transition-colors cursor-pointer text-left focus:outline-none group/link"
            >
              <CalendarCheck className="h-4 w-4 text-[#00b495]" />
              <span className="underline underline-offset-2 group-hover/link:text-[#00b495]">
                {t("card.linkedAppointment")}: {formatter.dateTime(new Date(followUp.appointmentId.dateTime), {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider group-hover/link:bg-[#e6f8f4] group-hover/link:text-[#00b495] transition-all">
                {t("card.viewAppointmentDetails")}
              </span>
            </button>
          </div>
        )}

        {/* Doctor's Notes */}
        {followUp.notes && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 text-sm text-[#374151] space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-black text-gray-400 uppercase tracking-wider">
              <FileText className="h-3.5 w-3.5" />
              {t("card.instructions")}
            </div>
            <p className="font-medium leading-relaxed">{followUp.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          {followUp.status !== "completed" && (
            <button
              onClick={handleMarkAsDone}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white text-text-primary hover:text-[#00b495] hover:bg-[#e6f8f4]/50 border border-gray-200 hover:border-[#00b495]/40 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              <UserCheck className="h-4 w-4" />
              {t("card.markAsDone")}
            </button>
          )}
          <Link
            href={`/dashboard/patient/book-appointment?doctorId=${followUp.doctorId._id}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#00b495] text-white hover:bg-[#009b80] rounded-xl text-xs font-bold transition-all text-center"
          >
            <CalendarPlus className="h-4 w-4" />
            {t("card.bookAppointment")}
          </Link>
        </div>
      </div>

      {/* Linked Appointment Detail Modal */}
      {isModalOpen && followUp.appointmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161b22] border border-black/10 dark:border-[#30363d] w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#00b495]" />

            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="space-y-1 pr-8 text-left">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-[#00b495]" />
                {t("card.linkedAppointmentTitle")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                {t("card.visitOn", {
                  date: formatter.dateTime(new Date(followUp.appointmentId.dateTime), {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  }),
                })}
              </p>
            </div>

            {/* Doctor Card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 text-left">
              <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 border border-gray-200 overflow-hidden shrink-0">
                {avatar ? (
                  <img src={avatar} alt={doctorName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg">{doctorName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#00b495]">
                  {t("card.originalDoctor")}
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {ct("doctorPrefix")} {doctorName}
                </h4>
                <p className="text-xs text-slate-400 font-semibold">
                  {specialization}
                </p>
              </div>
            </div>

            {/* Appointment Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {/* Clinic */}
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 space-y-1">
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <Building2 className="h-3.5 w-3.5" />
                  {t("card.clinic")}
                </span>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {followUp.appointmentId.clinicId?.name || "MedEaz Clinic"}
                </p>
              </div>

              {/* Visit Type */}
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 space-y-1">
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <Activity className="h-3.5 w-3.5" />
                  {t("card.visitType")}
                </span>
                <p className="text-sm font-bold capitalize text-slate-800 dark:text-slate-200">
                  {followUp.appointmentId.type || "Consultation"}
                </p>
              </div>
            </div>

            {/* Reason for Visit */}
            {followUp.appointmentId.reason && (
              <div className="space-y-2 text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t("card.reasonForVisit")}
                </span>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50">
                  <p className="text-sm font-medium text-slate-750 dark:text-slate-350 leading-relaxed">
                    {followUp.appointmentId.reason}
                  </p>
                </div>
              </div>
            )}

            {/* Original Notes */}
            {followUp.appointmentId.notes && (
              <div className="space-y-2 text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t("card.originalNotes")}
                </span>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50">
                  <p className="text-sm font-medium text-slate-750 dark:text-slate-350 leading-relaxed">
                    {followUp.appointmentId.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold transition-all cursor-pointer"
              >
                {ct("close") || "Close"}
              </button>
              {followUp.appointmentId.prescriptionId && (
                <Link
                  href={`/dashboard/patient/records/${followUp.appointmentId.prescriptionId}`}
                  className="px-6 py-2.5 rounded-xl bg-[#00b495] hover:bg-[#009c81] text-white text-sm font-bold shadow-lg shadow-[#00b495]/20 transition-all flex items-center gap-1.5"
                >
                  <Pill className="h-4 w-4" />
                  {t("card.viewPrescription")}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
