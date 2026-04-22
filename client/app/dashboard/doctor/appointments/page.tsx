"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useGetAppointmentsQuery,
  useGetTodayQueueQuery,
  useUpdateAppointmentStatusMutation,
  useDeleteAppointmentMutation,
} from "@/store/api/doctorApi";
import { toast } from "react-hot-toast";
import { Calendar, Clock, User, Check, X, Play, Plus, Trash2, AlertTriangle } from "lucide-react";

export default function AppointmentsPage() {
  const [filter, setFilter] = useState<"all" | "today">("all");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; patientName: string }>({ open: false, id: "", patientName: "" });
  
  const { data: allData, isLoading: allLoading } = useGetAppointmentsQuery(undefined, {
    skip: filter !== "all",
  });
  const { data: todayData, isLoading: todayLoading } = useGetTodayQueueQuery(undefined, {
    skip: filter !== "today",
  });
  const [updateStatus] = useUpdateAppointmentStatusMutation();
  const [deleteAppointment, { isLoading: deleting }] = useDeleteAppointmentMutation();

  const appointments = filter === "today" 
    ? todayData?.data?.appointments || []
    : allData?.data?.appointments || [];
  const loading = filter === "today" ? todayLoading : allLoading;

  const handleStatusUpdate = async (id: string, status: string, actionLabel: string) => {
    const toastId = toast.loading(`${actionLabel} appointment...`);
    
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success(`Appointment ${actionLabel.toLowerCase()}ed successfully!`, { id: toastId });
    } catch (error: any) {
      toast.error(error?.data?.message || `Failed to ${actionLabel.toLowerCase()} appointment`, { id: toastId });
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    const toastId = toast.loading("Deleting appointment...");
    try {
      await deleteAppointment(deleteModal.id).unwrap();
      toast.success("Appointment deleted", { id: toastId });
      setDeleteModal({ open: false, id: "", patientName: "" });
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete appointment", { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black tracking-tight">Appointments</h1>
          <p className="text-text-secondary mt-1 sm:mt-2 text-base sm:text-lg">
            Manage your appointment schedule
          </p>
        </div>
        <Link
          href="/dashboard/doctor/appointments/new"
          className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all shadow-lg whitespace-nowrap"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">New Appointment</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 sm:gap-3">
        <button
          onClick={() => setFilter("all")}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all ${
            filter === "all"
              ? "bg-primary text-white shadow-lg shadow-primary/30"
              : "bg-white text-text-primary border-2 border-border-light hover:border-primary"
          }`}
        >
          All Appointments
        </button>
        <button
          onClick={() => setFilter("today")}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all ${
            filter === "today"
              ? "bg-primary text-white shadow-lg shadow-primary/30"
              : "bg-white text-text-primary border-2 border-border-light hover:border-primary"
          }`}
        >
          Today
        </button>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
        {appointments.length === 0 ? (
          <div className="text-center py-12 sm:py-20 px-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-text-muted" />
            </div>
            <p className="text-text-secondary text-base sm:text-lg font-medium">No appointments found</p>
            <p className="text-text-muted text-xs sm:text-sm mt-1">
              {filter === "today" ? "No appointments scheduled for today" : "You don't have any appointments yet"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-light">
            {appointments?.map?.((appointment: any) => (
              <div key={appointment._id} className="p-4 sm:p-6 hover:bg-surface/30 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="h-12 w-12 sm:h-14 sm:w-14 bg-linear-to-br from-primary to-primary-hover rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg shrink-0">
                        {appointment.patientId?.name?.[0]?.toUpperCase() || "P"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-black text-lg sm:text-xl truncate">
                          {appointment.patientId?.name || "Unknown Patient"}
                        </h3>
                        <p className="text-text-secondary text-xs sm:text-sm flex items-center gap-2 mt-0.5 sm:mt-1">
                          <User className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                          <span className="truncate">{appointment.patientId?.email || "No email"}</span>
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 sm:ml-[4.5rem]">
                      <div className="flex items-center gap-2 sm:gap-3 text-text-primary">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm text-text-muted">Date & Time</p>
                          <p className="font-semibold text-sm sm:text-base">
                            {new Date(appointment.dateTime).toLocaleDateString()} at{" "}
                            {new Date(appointment.dateTime).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      {appointment.type && (
                        <div className="flex items-center gap-2 sm:gap-3 text-text-primary">
                          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-text-muted">Type</p>
                            <p className="font-semibold text-sm sm:text-base capitalize">{appointment.type}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 sm:gap-3 lg:text-right">
                    <span
                      className={`inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-center ${
                        appointment.status === "pending"
                          ? "bg-surface-cream text-[#B45309] border border-border-light"
                          : appointment.status === "confirmed"
                          ? "bg-surface text-primary border border-border-light"
                          : appointment.status === "in-progress"
                          ? "bg-surface-cream text-[#B45309] border border-border-light"
                          : appointment.status === "completed"
                          ? "bg-surface text-primary border border-border-light"
                          : "bg-background text-text-primary border border-border-light"
                      }`}
                    >
                      {appointment.status.replace("-", " ")}
                    </span>
                    {appointment.status === "pending" && (
                      <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
                        <button
                          onClick={() => handleStatusUpdate(appointment._id, "confirmed", "Confirm")}
                          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-primary text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-primary-hover transition-all shadow-md hover:shadow-lg"
                        >
                          <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                          Confirm
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(appointment._id, "cancelled", "Cancel")}
                          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-red-500 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-red-600 transition-all shadow-md hover:shadow-lg"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                          Cancel
                        </button>
                      </div>
                    )}
                    {appointment.status === "confirmed" && (
                      <button
                        onClick={() => handleStatusUpdate(appointment._id, "in-progress", "Start")}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-primary text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-primary-hover transition-all shadow-md hover:shadow-lg w-full"
                      >
                        <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                        Start
                      </button>
                    )}
                    {appointment.status === "in-progress" && (
                      <button
                        onClick={() => handleStatusUpdate(appointment._id, "completed", "Complete")}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-primary text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-primary transition-all shadow-md hover:shadow-lg w-full"
                      >
                        <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                        Complete
                      </button>
                    )}
                    {/* Delete button */}
                    <button
                      onClick={() => setDeleteModal({ open: true, id: appointment._id, patientName: appointment.patientId?.name || "this appointment" })}
                      className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border-2 border-red-200 text-red-500 rounded-xl text-xs sm:text-sm font-semibold hover:bg-red-50 hover:border-red-400 transition-all"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-black">Delete Appointment</h3>
                <p className="text-sm text-text-secondary">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-text-primary mb-6">
              Are you sure you want to delete the appointment for{" "}
              <span className="font-semibold text-black">{deleteModal.patientName}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, id: "", patientName: "" })}
                className="flex-1 px-4 py-2.5 border-2 border-border-light rounded-xl font-semibold text-text-primary hover:border-primary hover:text-primary transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
                      
