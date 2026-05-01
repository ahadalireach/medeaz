"use client";

import {
  useGetAppointmentsQuery,
  useUpdateAppointmentStatusMutation,
  useCompleteAppointmentMutation,
  useDeleteAppointmentMutation,
  useGetAppointmentByIdQuery,
} from "@/store/api/doctorApi";
import { toast } from "react-hot-toast";
import { SuccessModal } from "@/components/ui/SuccessModal";
import {
  Calendar as CalendarLegacy,
  Play,
  AlertTriangle,
  Timer,
  Plus,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  EyeIcon,
  ClockIcon,
  TrashIcon,
  CheckedIcon,
  XIcon,
  UserIcon,
} from "@/icons";
import { TableSkeleton } from "@/components/ui/Skeleton";
import AppointmentDetailModal from "@/components/AppointmentDetailModal";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { useTranslations } from "next-intl";

const AppointmentTimer = ({ startTime }: { startTime: string }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [pauseOffset, setPauseOffset] = useState(0);
  const [lastTick, setLastTick] = useState(Date.now());

  useEffect(() => {
    const calculateTime = () => {
      if (isPaused) return;

      const start = new Date(startTime).getTime();
      const now = Date.now();
      const duration = 20 * 60 * 1000;
      const elapsed = (now - start) - pauseOffset;
      const remaining = duration - elapsed;

      if (remaining <= 0) {
        setTimeLeft("Window Closed");
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
      }
    };
    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [startTime, isPaused, pauseOffset]);

  const togglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPaused) {
      setLastTick(Date.now());
    } else {
      const pausedFor = Date.now() - lastTick;
      setPauseOffset(prev => prev + pausedFor);
    }
    setIsPaused(!isPaused);
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1.5 px-3 py-1 ${isPaused ? 'bg-orange-500/10 text-orange-500' : 'bg-primary/10 text-primary'} rounded-full text-[10px] font-bold uppercase tracking-widest border border-current/20 transition-colors`}>
        <Timer className={`h-3 w-3 ${!isPaused && 'animate-pulse'}`} />
        <span>{isPaused ? "PAUSED" : timeLeft}</span>
      </div>
      <button
        onClick={togglePause}
        className={`h-6 w-6 flex items-center justify-center rounded-lg border transition-all ${isPaused ? 'bg-primary text-white border-primary shadow-sm active:scale-90' : 'bg-white dark:bg-[#1e293b] text-gray-400 border-gray-200 dark:border-white/10 hover:text-primary hover:border-primary/30'}`}
      >
        {isPaused ? <Play size={10} className="fill-current ml-0.5" /> : <div className="flex gap-0.5"><div className="w-0.5 h-2 bg-current" /><div className="w-0.5 h-2 bg-current" /></div>}
      </button>
    </div>
  );
};

export default function AppointmentsPage() {
  const t = useTranslations();
  const [filter, setFilter] = useState<"all" | "today" | "yesterday" | "tomorrow">("all");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; patientName: string }>({ open: false, id: "", patientName: "" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [successConfig, setSuccessConfig] = useState<{ isOpen: boolean, title: string, message: string }>({
    isOpen: false,
    title: "",
    message: ""
  });
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [dismissedLateWarnings, setDismissedLateWarnings] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<{ id: string; status: string } | null>(null);

  const { data: allData, isLoading: allLoading } = useGetAppointmentsQuery({ limit: 100 });
  const { data: detailData, isLoading: isDetailLoading } = useGetAppointmentByIdQuery(selectedId!, {
    skip: !selectedId,
  });

  const [updateStatus] = useUpdateAppointmentStatusMutation();
  const [completeAppointment] = useCompleteAppointmentMutation();
  const [deleteAppointment, { isLoading: deleting }] = useDeleteAppointmentMutation();

  const appointments = (allData?.data?.appointments || []).filter((a: any) => {
    if (filter === "all") return true;
    const date = new Date();
    if (filter === "yesterday") date.setDate(date.getDate() - 1);
    if (filter === "tomorrow") date.setDate(date.getDate() + 1);
    const targetDate = date.toISOString().split('T')[0];
    return a.dateTime?.split('T')[0] === targetDate;
  });
  const loading = allLoading;

  const resolveImageUrl = (photo?: string | null) => {
    if (!photo) return "";
    const trimmed = String(photo).trim();
    if (!trimmed) return "";
    if (/^(https?:\/\/|data:)/i.test(trimmed)) return trimmed;

    // Use NEXT_PUBLIC_SOCKET_URL (base server without /api) for static uploads
    const baseOrigin =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

    const normalizedPath = trimmed.startsWith("/")
      ? trimmed
      : trimmed.startsWith("uploads/")
        ? `/${trimmed}`
        : `/uploads/${trimmed}`;
    try {
      return new URL(normalizedPath, baseOrigin).toString();
    } catch {
      return "";
    }
  };


  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("doctor-late-warning-dismissed");
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setDismissedLateWarnings(parsed);
      }
    } catch {
      setDismissedLateWarnings([]);
    }
  }, []);

  useEffect(() => {
    if (!appointments?.length) return;

    const now = Date.now();

    appointments.forEach((appointment: any) => {
      if (appointment.status !== "confirmed") return;

      const startMs = new Date(appointment.dateTime).getTime();
      if (!startMs) return;

      const overdueMs = now - startMs;
      if (overdueMs <= 60 * 1000) return;

      const warningKey = `late-start-${appointment._id}`;
      if (dismissedLateWarnings.includes(warningKey)) return;

      const patientName = appointment.patientId?.name || "Patient";
      const scheduledTime = new Date(appointment.dateTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      toast.custom(
        (t) => (
          <div className="w-[min(560px,calc(100vw-24px))] rounded-2xl border border-amber-300/50 bg-amber-50 dark:bg-amber-950/60 px-4 py-3 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="relative mt-0.5 h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center border border-amber-300/40">
                <ClockIcon className="h-4 w-4 text-amber-700 dark:text-amber-300 animate-pulse" />
                <span className="absolute h-1.5 w-1.5 rounded-full bg-amber-600 animate-ping" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black uppercase tracking-wider text-amber-800 dark:text-amber-200">
                  Appointment Start Delayed
                </p>
                <p className="text-sm font-medium text-amber-700/90 dark:text-amber-100 mt-1">
                  {patientName}'s appointment was scheduled for {scheduledTime} and is overdue by more than 1 minute.
                </p>
              </div>
              <button
                onClick={() => {
                  const next = [...dismissedLateWarnings, warningKey];
                  setDismissedLateWarnings(next);
                  if (typeof window !== "undefined") {
                    localStorage.setItem("doctor-late-warning-dismissed", JSON.stringify(next));
                  }
                  toast.dismiss(t.id);
                }}
                className="px-3 py-1.5 text-xs font-black uppercase tracking-widest rounded-lg bg-amber-700 text-white hover:bg-amber-800 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        ),
        {
          id: warningKey,
          duration: Infinity,
          position: "top-center",
        }
      );
    });
  }, [appointments, dismissedLateWarnings]);

  const handleStatusUpdate = async (id: string, status: string) => {
    setPendingAction({ id, status });
    try {
      if (status === "completed") {
        await completeAppointment({ id }).unwrap();
      } else {
        await updateStatus({ id, status }).unwrap();
      }
      const appointment = (allData?.data?.appointments || []).find((a: any) => a._id === id);
      const patientName = appointment?.patientId?.name || "Patient";

      if (status === 'confirmed') {
        setSuccessConfig({
          isOpen: true,
          title: "Appointment Confirmed",
          message: `You have successfully confirmed the appointment with ${patientName}.`
        });
      } else if (status === 'cancelled') {
        setSuccessConfig({
          isOpen: true,
          title: "Appointment Cancelled",
          message: `The appointment with ${patientName} has been cancelled.`
        });
      }
    } catch (error: any) {
      toast.error(error?.data?.message || "Operation failed");
    } finally {
      setPendingAction(null);
    }
  };

  const handleOpenDetail = (id: string) => {
    setSelectedId(id);
    setIsDetailOpen(true);
  };

  const getStatusLabel = (status: string) => {
    const normalized = String(status || "").trim().toLowerCase();
    const key = `common.status.${normalized}`;
    const translated = t(key);
    return translated === key ? status : translated;
  };

  if (loading) return <div className="space-y-6"><TableSkeleton rows={6} /></div>;

  return (
    <div className="space-y-10 animate-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="lens-page-title">{t('doctor.appointments.title')}</h1>
          <p className="lens-subtitle">{t('doctor.appointments.subtitle')}</p>
        </div>
        <Link href="/dashboard/doctor/appointments/new" className="lens-btn-primary h-12 px-6">
          <Plus className="h-4 w-4 stroke-[3px]" />
          <span>{t('doctor.appointments.newAppointment')}</span>
        </Link>
      </div>

      <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-full w-fit">
        {["all", "yesterday", "today", "tomorrow"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${filter === f
              ? "bg-white text-black dark:bg-primary dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
              }`}
          >
            {f === "all" ? t('common.all') : t(`common.${f}`)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {appointments.length === 0 ? (
          <div className="lens-card text-center py-24">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('doctor.appointments.noAppointments')}</h3>
            <p className="text-gray-500 font-medium mt-1">{t('doctor.appointments.adjustFilters')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment: any) => {
              const isRTL = t.raw('nav.navigation') === 'نیویگیشن';
              return (
                <div key={appointment._id} className="lens-card group relative">
                  <button
                    onClick={() => handleOpenDetail(appointment._id)}
                    className={`absolute top-6 ${isRTL ? 'left-6' : 'right-6'} p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100 hidden lg:flex z-10`}
                    title={t('doctor.appointments.viewDetails')}
                  >
                    <EyeIcon size={20} />
                  </button>

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start gap-5">
                      <div className="h-14 w-14 rounded-2xl overflow-hidden border border-black/5 dark:border-white/10 shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        {appointment.patientId?.photo ? (
                          (() => {
                            const imageUrl = resolveImageUrl(appointment.patientId.photo);
                            return imageUrl ? (
                              <div className="relative h-full w-full">
                                <UserIcon className="h-8 w-8 text-slate-400 absolute inset-0 m-auto" />
                                <img
                                  src={imageUrl}
                                  alt={appointment.patientId?.name || "Patient"}
                                  className="h-full w-full object-cover relative z-10"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              </div>
                            ) : (
                              <UserIcon className="h-8 w-8 text-slate-400" />
                            );
                          })()
                        ) : (
                          <UserIcon className="h-8 w-8 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg tracking-tight truncate">
                            {appointment.patientId?.name || "Patient"}
                          </h3>
                          {appointment.status === "in-progress" && (
                            <div className="shrink-0">
                              <AppointmentTimer startTime={appointment.updatedAt} />
                            </div>
                          )}
                          <button
                            onClick={() => handleOpenDetail(appointment._id)}
                            className="lg:hidden p-1.5 rounded-lg bg-primary/10 text-primary"
                          >
                            <EyeIcon size={16} />
                          </button>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-[#52525b] uppercase tracking-widest mt-1">
                          {appointment.patientId?.email || "Private Registry"}
                        </p>

                        <div className="flex items-center gap-3 mt-4">
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/5">
                            <ClockIcon size={14} className="text-primary" />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              {new Date(appointment.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(appointment.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 dark:text-[#52525b] uppercase tracking-widest">
                            {appointment.type || 'Standard'}
                          </span>
                        </div>

                        {/* Patient Feedback Section */}
                        {appointment.status === "completed" && appointment.patientFeedback?.score && (
                          <div className="mt-4 p-3 bg-primary/5 rounded-2xl border border-primary/10">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex text-amber-500">
                                {[...Array(5)].map((_, i) => (
                                  <svg key={i} className={`h-3 w-3 ${i < appointment.patientFeedback.score ? 'fill-current' : 'text-gray-300 dark:text-gray-700'}`} viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PATIENT REVIEW</span>
                            </div>
                            {appointment.patientFeedback.comment && (
                              <p className="text-xs  text-gray-600 dark:text-gray-300">"{appointment.patientFeedback.comment}"</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 lg:mt-0">
                      <span className={`lens-badge whitespace-nowrap ${appointment.status === "pending" ? "lens-badge-pending" :
                        appointment.status === "confirmed" ? "lens-badge-active" :
                          appointment.status === "in-progress" ? "bg-[#7c3aed] text-white border-none font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-full shadow-lg shadow-purple-500/20" :
                            appointment.status === "completed" ? "bg-primary text-white border-none font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-full shadow-lg shadow-primary/20" :
                              "bg-[#ef4444] text-white border-none font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-full shadow-lg shadow-red-500/20"
                        }`}>
                        {getStatusLabel(appointment.status)}
                      </span>

                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        {appointment.status === "pending" && (
                          <button
                            onClick={() => handleStatusUpdate(appointment._id, "confirmed")}
                            disabled={pendingAction?.id === appointment._id && pendingAction?.status === "confirmed"}
                            className="lens-btn-icon text-primary bg-primary/10 border-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {pendingAction?.id === appointment._id && pendingAction?.status === "confirmed" ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <CheckedIcon size={18} strokeWidth={3} />
                            )}
                          </button>
                        )}
                        {appointment.status === "confirmed" && (
                          <button
                            onClick={() => handleStatusUpdate(appointment._id, "in-progress")}
                            disabled={pendingAction?.id === appointment._id && pendingAction?.status === "in-progress"}
                            className="lens-btn-primary h-10 px-4 text-xs font-bold"
                          >
                            {pendingAction?.id === appointment._id && pendingAction?.status === "in-progress" ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Play size={14} className="fill-current" />
                            )}
                            Start
                          </button>
                        )}
                        {appointment.status === "in-progress" && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStatusUpdate(appointment._id, "completed")}
                              disabled={pendingAction?.id === appointment._id && pendingAction?.status === "completed"}
                              className="lens-btn-primary h-10 px-6 text-xs font-black bg-green-600 hover:bg-green-700 border-none shadow-lg shadow-green-500/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {pendingAction?.id === appointment._id && pendingAction?.status === "completed" ? (
                                <Loader2 size={14} className="mr-1 animate-spin" />
                              ) : (
                                <CheckedIcon size={14} strokeWidth={3} className="mr-1" />
                              )}
                              {t('common.status.completed')}
                            </button>
                            <Link href={`/dashboard/doctor/prescriptions/new?patientId=${appointment.patientId?._id || appointment.patientId}&appointmentId=${appointment._id}`}>
                              <button className="h-10 px-4 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/20">
                                {t('nav.prescriptions')}
                              </button>
                            </Link>
                          </div>
                        )}
                        {appointment.status === "completed" && (
                          <Link href={`/dashboard/doctor/prescriptions/new?patientId=${appointment.patientId?._id || appointment.patientId}&appointmentId=${appointment._id}`}>
                            <button className="h-10 px-4 rounded-xl border-2 border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center justify-center gap-2 cursor-pointer">
                              {t('doctor.prescriptions.newPrescription')}
                            </button>
                          </Link>
                        )}
                        <button
                          onClick={() => setDeleteModal({ open: true, id: appointment._id, patientName: appointment.patientId?.name || "Patient" })}
                          className="lens-btn-icon text-red-500 hover:bg-red-500 hover:text-white border-transparent"
                        >
                          <TrashIcon size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <AppointmentDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        appointment={detailData?.data}
        loading={isDetailLoading}
      />

      <ConfirmationModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: "", patientName: "" })}
        onConfirm={async () => {
          await deleteAppointment(deleteModal.id);
          setDeleteModal({ open: false, id: "", patientName: "" });
        }}
        title={t('modal.confirmDelete')}
        message={`${t('doctor.appointments.confirmCancel')} (${deleteModal.patientName})`}
      />
      <SuccessModal
        isOpen={successConfig.isOpen}
        onClose={() => setSuccessConfig(prev => ({ ...prev, isOpen: false }))}
        title={successConfig.title}
        message={successConfig.message}
      />
    </div>
  );
}
