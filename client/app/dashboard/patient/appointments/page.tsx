"use client";

import { useState, useEffect } from "react";
import { useGetAppointmentsQuery, useCancelAppointmentMutation, useSubmitReviewMutation, useUpdateReviewMutation, useDeleteAppointmentMutation } from "@/store/api/patientApi";
import Link from "next/link";
import { Calendar, Clock, User, Building2, MapPin, Plus, X, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { showToast } from "@/lib/toast";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  doctorId: string;
  reviewId?: string;
  initialRating?: number;
  initialComment?: string;
}

function RatingModal({ isOpen, onClose, appointmentId, doctorId, reviewId, initialRating, initialComment }: RatingModalProps) {
  const [rating, setRating] = useState(initialRating || 5);
  const [comment, setComment] = useState(initialComment || "");
    const t = useTranslations();
  const [submitReview, { isLoading: isSubmitting }] = useSubmitReviewMutation();
  const [updateReview, { isLoading: isUpdating }] = useUpdateReviewMutation();

  const isLoading = isSubmitting || isUpdating;

  const handleSubmit = async () => {
    try {
      if (reviewId) {
        await updateReview({ id: reviewId, rating, comment }).unwrap();
        toast.success("Your review has been updated.");
      } else {
        await submitReview({ doctorId, appointmentId, rating, comment }).unwrap();
        toast.success("Thank you! Your review has been submitted.");
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save review");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-text-primary mb-2">
          {reviewId ? t('patient.appointments.rating.updateTitle') : t('patient.appointments.rating.title')}
        </h3>
        <p className="text-sm text-text-secondary mb-6">{t('patient.appointments.rating.subtitle')}</p>

        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="p-1 transition-all"
            >
              <Star
                className={`h-10 w-10 ${star <= rating ? "fill-primary text-primary" : "text-white/70 "
                  }`}
              />
            </button>
          ))}
        </div>

        <textarea
          placeholder={t('patient.appointments.rating.placeholder')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-xl border-border-light bg-background p-3 text-sm focus:ring-primary focus:border-primary mb-6 h-32"
        />

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
            {isLoading ? t('patient.appointments.rating.saving') : (reviewId ? t('patient.appointments.rating.update') : t('patient.appointments.rating.submit'))}
          </Button>
        </div>
      </div>
    </div>
  );
}

type ViewFilter = "all" | "upcoming" | "past" | "today" | "yesterday" | "tomorrow";

const AppointmentTimer = ({ startTime }: { startTime: string }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const duration = 20 * 60 * 1000;
      const elapsed = now - start;
      const remaining = duration - elapsed;

      if (remaining <= 0) {
        setTimeLeft("Ending soon");
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? "0" : ""}${secs} left`);
      }
    };
    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/20">
      <Clock className="h-3 w-3 animate-pulse" />
      {timeLeft}
    </div>
  );
};


export default function AppointmentsPage() {
  const t = useTranslations();
  const [view, setView] = useState<ViewFilter>("all");
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [ratingModal, setRatingModal] = useState<{ 
    isOpen: boolean; 
    id: string; 
    doctorId: string;
    reviewId?: string;
    initialRating?: number;
    initialComment?: string;
  }>({ isOpen: false, id: "", doctorId: "" });
  
  const { data, isLoading } = useGetAppointmentsQuery(["today", "yesterday", "tomorrow"].includes(view) ? "all" : view);
  const [cancelAppointment, { isLoading: isCancelling }] = useCancelAppointmentMutation();
  const [deleteAppointment] = useDeleteAppointmentMutation();

  const appointments = (data?.data || []).filter((a: any) => {
    if (["all", "upcoming", "past"].includes(view)) return true;
    const date = new Date();
    if (view === "yesterday") date.setDate(date.getDate() - 1);
    if (view === "tomorrow") date.setDate(date.getDate() + 1);
    const targetDateStr = date.toISOString().split('T')[0];
    return a.dateTime?.split('T')[0] === targetDateStr;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return "TBD";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const getDoctorName = (appointment: any) =>
    appointment.doctorId?.userId?.name || appointment.doctorId?.fullName || appointment.doctorId?.name || "Doctor";

  const getClinicCity = (appointment: any) => {
    const directCity = appointment.clinicId?.city || appointment.clinic?.city || appointment.clinicCity;
    if (directCity) return directCity;

    const address = appointment.clinicId?.address || appointment.clinic?.address || appointment.clinicAddress;
    if (!address || typeof address !== "string") return t('common.noData');

    const parts = address.split(",").map((p: string) => p.trim()).filter(Boolean);
    return parts.length > 1 ? parts[parts.length - 1] : t('common.noData');
  };

  const getClinicName = (appointment: any) => {
    return appointment.clinicId?.name || appointment.clinic?.name || appointment.clinicName || t('appointment.clinic');
  };

  const getClinicAddress = (appointment: any) => {
    return appointment.clinicId?.address || appointment.clinic?.address || appointment.clinicAddress || t('common.noData');
  };

  const getStatusLabel = (status: string) => {
    const normalized = (status || "").toLowerCase();
    const labels: Record<string, string> = {
      pending: t('appointment.status.pending'),
      confirmed: t('appointment.status.confirmed'),
      reserved: t('appointment.status.reserved'),
      accepted: t('appointment.status.accepted'),
      completed: t('appointment.status.completed'),
      cancelled: t('appointment.status.cancelled'),
      'in-progress': t('appointment.status.in-progress'),
    };

    return labels[normalized] || normalized.replace(/-/g, " ");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "lens-badge-active";
      case "pending":
        return "lens-badge-pending";
      case "cancelled":
        return "lens-badge-danger";
      case "completed":
        return "lens-badge-completed";
      case "in-progress":
        return "bg-[#B45309]/10 text-[#B45309] border-[#B45309]/20";
      default:
        return "lens-badge-neutral";
    }
  };

  const handleCancel = async (appointmentId: string) => {
    try {
      await cancelAppointment(appointmentId).unwrap();
      showToast.appointmentCancelled(t);
      setConfirmCancelId(null);
    } catch (error: any) {
      showToast.error(t, error?.data?.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAppointment(deleteId).unwrap();
      toast.success("Record deleted");
      setDeleteId(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete appointment");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-text-primary">
          {t('nav.appointments')}
        </h1>
        <Link href="/dashboard/patient/book-appointment">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {t('patient.bookAppointment')}
          </Button>
        </Link>
      </div>

      {/* View Filters */}
      <div className="flex gap-2 overflow-x-auto">
        {(["all", "upcoming", "past", "yesterday", "today", "tomorrow"] as ViewFilter[]).map((filter) => (
          <button
            key={filter}
            onClick={() => setView(filter)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors shrink-0 ${view === filter
              ? "bg-primary text-white"
              : "bg-white text-text-primary hover:bg-surface   :bg-ink-soft"
              }`}
          >
            {filter === "all" ? t('common.all') : 
             filter === "upcoming" ? t('patient.appointments.upcoming') : 
             filter === "past" ? t('patient.appointments.past') : 
             t(`common.${filter}`)}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border border-border-light bg-white"
            />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-xl border border-border-light bg-white p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-text-secondary" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary">
            {t('appointment.noAppointments')}
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            {view === "upcoming"
              ? t('appointment.noUpcoming')
              : view === "past"
                ? t('appointment.noPast')
                : t('appointment.noAppointments')}
          </p>
          {view !== "upcoming" && (
            <Link href="/dashboard/patient/book-appointment">
              <Button className="mt-4">{t('patient.bookAppointment')}</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment: any) => (
            <div
              key={appointment._id}
              className="rounded-xl border border-border-light bg-white p-6 transition-all hover:border-primary"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 h-12 w-12 flex items-center justify-center overflow-hidden shrink-0 border-2 border-primary/20">
                      {appointment.doctorId?.photo ? (
                        <img
                          src={appointment.doctorId.photo}
                          alt="Doctor"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-text-primary">
                            {t('common.doctorPrefix')} {getDoctorName(appointment)}
                          </h3>
                          <p className="text-sm text-text-secondary">
                            {appointment.doctorId?.doctorProfile?.specialization || t('appointment.doctor')}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {getStatusLabel(appointment.status)}
                          </span>
                          {appointment.status === "in-progress" && (
                            <AppointmentTimer startTime={appointment.updatedAt} />
                          )}
                        </div>
                      </div>

                      <div className="mt-3 space-y-2 text-sm text-text-secondary">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>{getClinicName(appointment)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{getClinicAddress(appointment)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{getClinicCity(appointment)}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(appointment.dateTime)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(appointment.dateTime)}</span>
                          </div>
                        </div>
                      </div>

                      {appointment.reason && (
                        <div className="mt-3 rounded-lg bg-background p-3">
                          <p className="text-xs font-semibold text-text-secondary">
                            {t('patient.bookAppointmentPage.reasonForVisit')}
                          </p>
                          <p className="mt-1 text-sm text-text-primary">
                            {appointment.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {appointment.status === "completed" && (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                    {(appointment.patientFeedback?.score || appointment.rating?.score) ? (
                      <div className="flex items-center gap-2 flex-1">
                        <div className="flex items-center gap-1.5 text-primary bg-primary/10 px-3 py-2 rounded-xl border border-primary/20 flex-1">
                          <Star className="h-4 w-4 fill-primary" />
                          <span className="text-sm font-bold">{(appointment.patientFeedback?.score || appointment.rating?.score)} / 5</span>
                        </div>
                        {(appointment.reviewEditCount || 0) < 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const docId = appointment.doctorId?._id || appointment.doctorId;
                              setRatingModal({
                                isOpen: true,
                                id: appointment._id,
                                doctorId: docId,
                                reviewId: appointment.reviewId,
                                initialRating: appointment.patientFeedback?.score || appointment.rating?.score,
                                initialComment: appointment.patientFeedback?.comment || appointment.rating?.feedback
                              });
                            }}
                            className="text-xs h-9"
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button
                        variant="default"
                        onClick={() => {
                          const docId = appointment.doctorId?._id || appointment.doctorId;
                          setRatingModal({ isOpen: true, id: appointment._id, doctorId: docId });
                        }}
                        className="bg-primary hover:bg-primary-hover text-white shadow-lg flex-1"
                      >
                        <Star className="mr-2 h-4 w-4 fill-white" />
                        {t('patient.appointments.rateExperience')}
                      </Button>
                    )}
                    {appointment.prescriptionId && (
                      <Link 
                        href={`/dashboard/patient/records/${appointment.prescriptionId._id || appointment.prescriptionId}`}
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          className="w-full border-primary text-primary hover:bg-primary/10 font-bold"
                        >
                          <Building2 className="mr-2 h-4 w-4" />
                          {t('nav.medicalRecords')}
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setDeleteId(appointment._id)}
                      className="text-text-secondary hover:text-red-500 hover:bg-red-50 border-border-light"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    </div>
                  </div>
                )}

                {appointment.status === "cancelled" && (
                   <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDeleteId(appointment._id)}
                    className="text-text-secondary hover:text-red-500 hover:bg-red-50 border-border-light h-10 w-10 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}

                {appointment.status === "pending" && (
                  confirmCancelId === appointment._id ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleCancel(appointment._id)}
                        disabled={isCancelling}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 :bg-red-900/20"
                      >
                          {isCancelling ? t('patient.appointments.cancelling') : t('patient.appointments.confirmCancelBtn')}
                      </Button>
                      <Button variant="outline" onClick={() => setConfirmCancelId(null)}>
                        {t('patient.appointments.keepBtn')}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setConfirmCancelId(appointment._id)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700 :bg-red-900/20"
                    >
                      <X className="mr-2 h-4 w-4" />
                      {t('common.cancel')}
                    </Button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {ratingModal.isOpen && (
        <RatingModal
          isOpen={ratingModal.isOpen}
          onClose={() => setRatingModal({ 
            isOpen: false, 
            id: "", 
            doctorId: "",
            reviewId: undefined,
            initialRating: undefined,
            initialComment: undefined
          })}
          appointmentId={ratingModal.id}
          doctorId={ratingModal.doctorId}
          reviewId={ratingModal.reviewId}
          initialRating={ratingModal.initialRating}
          initialComment={ratingModal.initialComment}
        />
      )}

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('common.delete')}
        message={t('modal.cannotUndo')}
      />
    </div>
  );
}
