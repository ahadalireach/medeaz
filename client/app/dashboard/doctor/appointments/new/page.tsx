"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGetPatientsQuery, useCreateAppointmentMutation } from "@/store/api/doctorApi";
import { toast } from "react-hot-toast";
import { ArrowLeft, Calendar, Clock, User, FileText, Loader } from "lucide-react";

export default function NewAppointmentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    patientId: "",
    dateTime: "",
    duration: "30",
    type: "consultation",
    reason: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: patientsData, isLoading: loadingPatients } = useGetPatientsQuery({ limit: 100 });
  const [createAppointment, { isLoading: creating }] = useCreateAppointmentMutation();

  const patients = patientsData?.data?.patients || [];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientId) {
      newErrors.patientId = "Please select a patient";
    }

    if (!formData.dateTime) {
      newErrors.dateTime = "Date and time are required";
    } else {
      const selected = new Date(formData.dateTime);
      if (selected <= new Date()) {
        newErrors.dateTime = "Appointment must be scheduled in the future";
      }
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "Reason for visit is required";
    } else if (formData.reason.trim().length < 5) {
      newErrors.reason = "Please provide a more descriptive reason (min 5 characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    const toastId = toast.loading("Creating appointment...");

    try {
      await createAppointment({
        ...formData,
        duration: parseInt(formData.duration),
      }).unwrap();

      toast.success("Appointment created successfully!", { id: toastId });
      router.push("/dashboard/doctor/appointments");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create appointment", { id: toastId });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/doctor/appointments"
          className="h-10 w-10 bg-surface rounded-xl flex items-center justify-center hover:bg-surface/80 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-black">Create Appointment</h1>
          <p className="text-text-secondary mt-1">
            Schedule a new appointment with a patient
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border-light p-6 space-y-6">
        {/* Patient Selection */}
        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            <User className="inline h-4 w-4 mr-2" />
            Patient <span className="text-red-500">*</span>
          </label>
          {loadingPatients ? (
            <div className="flex items-center gap-2 text-text-muted">
              <Loader className="h-4 w-4 animate-spin" />
              Loading patients...
            </div>
          ) : (
            <select
              value={formData.patientId}
              onChange={(e) => {
                setFormData({ ...formData, patientId: e.target.value });
                if (errors.patientId) setErrors({ ...errors, patientId: "" });
              }}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none bg-white text-black ${
                errors.patientId ? "border-red-500 focus:border-red-500" : "border-border-light focus:border-primary"
              }`}
            >
              <option value="">Select a patient</option>
              {patients.map((patient: any) => (
                <option key={patient._id} value={patient._id}>
                  {patient.name} - {patient.email}
                </option>
              ))}
            </select>
          )}
          {errors.patientId && <p className="text-red-500 text-sm mt-1">{errors.patientId}</p>}
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              <Calendar className="inline h-4 w-4 mr-2" />
              Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.dateTime}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              onChange={(e) => {
                setFormData({ ...formData, dateTime: e.target.value });
                if (errors.dateTime) setErrors({ ...errors, dateTime: "" });
              }}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none bg-white text-black ${
                errors.dateTime ? "border-red-500 focus:border-red-500" : "border-border-light focus:border-primary"
              }`}
            />
            {errors.dateTime && <p className="text-red-500 text-sm mt-1">{errors.dateTime}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              <Clock className="inline h-4 w-4 mr-2" />
              Duration (minutes) *
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-4 py-3 border-2 border-border-light rounded-xl focus:outline-none focus:border-primary bg-white text-black"
              required
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        </div>

        {/* Appointment Type */}
        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            Appointment Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-4 py-3 border-2 border-border-light rounded-xl focus:outline-none focus:border-primary bg-white text-black"
          >
            <option value="consultation">Consultation</option>
            <option value="follow-up">Follow-up</option>
            <option value="routine">Routine Check-up</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            Reason for Visit <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.reason}
            onChange={(e) => {
              setFormData({ ...formData, reason: e.target.value });
              if (errors.reason) setErrors({ ...errors, reason: "" });
            }}
            placeholder="e.g., Regular checkup, Follow-up consultation"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none bg-white text-black placeholder:text-text-muted ${
              errors.reason ? "border-red-500 focus:border-red-500" : "border-border-light focus:border-primary"
            }`}
          />
          {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason}</p>}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-black mb-2">
            <FileText className="inline h-4 w-4 mr-2" />
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any additional notes or instructions..."
            rows={4}
            className="w-full px-4 py-3 border-2 border-border-light rounded-xl focus:outline-none focus:border-primary bg-white text-black placeholder:text-text-muted resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Link
            href="/dashboard/doctor/appointments"
            className="flex-1 px-6 py-3 border-2 border-border-light rounded-xl font-semibold text-text-primary hover:bg-surface transition-all text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={creating}
            className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="h-5 w-5 animate-spin" />
                Creating...
              </span>
            ) : (
              "Create Appointment"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
