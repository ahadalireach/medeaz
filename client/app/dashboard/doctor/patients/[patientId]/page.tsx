"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetPatientByIdQuery, useDeleteRecordMutation, useDeletePrescriptionMutation, useDeleteAppointmentMutation } from "@/store/api/doctorApi";
import Link from "next/link";
import {
  Loader, User, Calendar, Phone, Mail, FileText, Pill, Clock, ArrowLeft,
  Droplet, MapPin, Activity, ClipboardList, Plus, Trash2
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function PatientDetailPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const patientId = params?.patientId as string;
  const [activeTab, setActiveTab] = useState<"records" | "prescriptions" | "appointments">("records");

  const { data, isLoading } = useGetPatientByIdQuery(patientId);
  const [deleteRecord] = useDeleteRecordMutation();
  const [deletePrescription] = useDeletePrescriptionMutation();
  const [deleteAppointment] = useDeleteAppointmentMutation();

  const patient = data?.data?.patient;
  const patientProfile = patient?.profile;
  const records = data?.data?.records || [];
  const prescriptions = data?.data?.prescriptions || [];
  const appointments = data?.data?.appointments || [];
  const stats = data?.data?.stats || { totalVisits: records.length, totalPrescriptions: prescriptions.length };

  const resolveImageUrl = (photo?: string | null) => {
    if (!photo) return "";
    const trimmed = String(photo).trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;

    const baseApi = process.env.NEXT_PUBLIC_API_URL || "";
    const baseOrigin = baseApi ? baseApi.replace(/\/api\/?$/, "") : (typeof window !== "undefined" ? window.location.origin : "");
    if (!baseOrigin) return "";

    const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    try {
      return new URL(normalizedPath, baseOrigin).toString();
    } catch {
      return "";
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm(t('modal.confirmDelete'))) return;
    try {
      await deleteRecord(id).unwrap();
      toast.success(t('common.success'));
    } catch (error: any) {
      toast.error(error?.data?.message || t('common.error'));
    }
  };

  const handleDeletePrescription = async (id: string) => {
    if (!window.confirm(t('modal.confirmDelete'))) return;
    try {
      await deletePrescription(id).unwrap();
      toast.success(t('common.success'));
    } catch (error: any) {
      toast.error(error?.data?.message || t('common.error'));
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!window.confirm(t('modal.confirmDelete'))) return;
    try {
      await deleteAppointment(id).unwrap();
      toast.success(t('toast.appointmentDeleted'));
    } catch (error: any) {
      toast.error(error?.data?.message || t('common.error'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-sm font-bold text-primary uppercase tracking-widest animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-black/5 shadow-xl">
        <div className="h-20 w-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('doctor.patients.noPatients')}</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">{t('common.noData')}</p>
        <div className="flex justify-center">
          <Button
            onClick={() => router.push("/dashboard/doctor/patients")}
            className="mt-8 lens-btn-primary mx-auto"
          >
            <ArrowLeft size={18} className="mr-2" />
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => router.push("/dashboard/doctor/patients")}
          className="inline-flex items-center gap-2.5 px-4 py-2 bg-white dark:bg-zinc-800 rounded-2xl border border-black/5 dark:border-white/5 text-gray-500 hover:text-primary transition-all shadow-sm"
        >
          <ArrowLeft size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">{t('common.back')}</span>
        </button>

        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/doctor/appointments/new?patientId=${patientId}`}
            className="px-5 py-2.5 bg-white dark:bg-zinc-800 rounded-2xl border border-black/5 text-gray-600 dark:text-gray-300 text-xs font-bold uppercase tracking-widest hover:border-primary/30 transition-all shadow-sm"
          >
            {t('nav.appointments')}
          </Link>
          <Link
            href={`/dashboard/doctor/prescriptions/new?patientId=${patientId}`}
            className="px-5 py-2.5 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Plus size={16} />
            {t('doctor.dashboard.newPrescription')}
          </Link>
        </div>
      </div>

      {/* Main Identity Banner */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
        <Card className="relative p-8 overflow-hidden rounded-[2.5rem]">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Photo/Avatar */}
            <div className="relative">
              <div className="h-32 w-32 rounded-[2rem] bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-extrabold text-5xl shadow-2xl overflow-hidden border-4 border-white dark:border-zinc-800">
                {patient.photo ? (
                  (() => {
                    const imageUrl = resolveImageUrl(patient.photo);
                    return imageUrl ? (
                      <div className="relative h-full w-full">
                        <span className="absolute inset-0 flex items-center justify-center">{patient.name?.[0]?.toUpperCase()}</span>
                        <img
                          src={imageUrl}
                          alt={patient.name}
                          className="h-full w-full object-cover relative z-10"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    ) : (
                      <span>{patient.name?.[0]?.toUpperCase()}</span>
                    );
                  })()
                ) : (
                  <span>{patient.name?.[0]?.toUpperCase()}</span>
                )}
              </div>
            </div>

            {/* Info Grid */}
            <div className="flex-1 w-full space-y-6">
              <div className="text-center md:text-left">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">{patient.name}</h1>
                <p className="text-primary font-bold tracking-widest uppercase text-[10px] mt-1">{t('doctor.patients.myPatient')}: #{patient._id?.slice(-6).toUpperCase()}</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-black/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail size={14} className="text-primary" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('form.email')}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-200 truncate">{patient.email}</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-black/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone size={14} className="text-primary" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('form.phone')}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-200">{patient.phone || patientProfile?.contact || t('common.noData')}</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-black/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={14} className="text-primary" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('form.dob')}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-200">
                    {patientProfile?.dob ? new Date(patientProfile.dob).toLocaleDateString() : t('common.noData')}
                  </p>
                </div>

                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplet size={14} className="text-red-500" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{t('doctor.bloodGroup')}</span>
                  </div>
                  <p className="text-sm font-black text-primary dark:text-white">{patientProfile?.bloodGroup || t('common.noData')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-100/50 dark:bg-zinc-800/30 rounded-2xl border border-black/5">
                  <User size={16} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest w-20">{t('form.gender')}:</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white capitalize">{patientProfile?.gender || t('common.noData')}</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-100/50 dark:bg-zinc-800/30 rounded-2xl border border-black/5">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest w-20">{t('form.address')}:</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{patientProfile?.address || t('common.noData')}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Clinical Metrics & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-black/5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lifetime Visits</span>
            <Activity size={18} className="text-primary" />
          </div>
          <p className="text-4xl font-black text-gray-900 dark:text-white">{stats.totalVisits}</p>
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-2">{records.length > 0 ? `Last visit: ${new Date(records[0].visitDate).toLocaleDateString()}` : "First timer"}</p>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-black/5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prescriptions</span>
            <ClipboardList size={18} className="text-blue-500" />
          </div>
          <p className="text-4xl font-black text-gray-900 dark:text-white">{stats.totalPrescriptions}</p>
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-2">Active regimens available</p>
        </div>

        <div className="col-span-1 p-6 bg-gradient-to-br from-zinc-800 to-black dark:from-zinc-900 dark:to-zinc-800 rounded-[2rem] border border-white/5 shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Medical Notes</span>
              <Plus size={18} className="text-primary group-hover:rotate-90 transition-transform" />
            </div>
            <p className="text-sm font-medium text-zinc-300 line-clamp-2">
              {patientProfile?.allergies?.length > 0 ? `Allergies: ${patientProfile.allergies.join(", ")}` : "No known allergies reported."}
            </p>
            <div className="mt-4 flex gap-2">
              {patientProfile?.allergies?.slice(0, 2).map((a: string) => (
                <span key={a} className="px-2 py-0.5 bg-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-md border border-red-500/20">{a}</span>
              ))}
            </div>
          </div>
          <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-black/5 shadow-premium overflow-hidden">
        <div className="flex border-b border-black/5 p-2 gap-2">
          {[
            { id: "records", label: t('patient.records.title'), icon: Activity },
            { id: "prescriptions", label: t('patient.recentPrescriptions'), icon: Pill },
            { id: "appointments", label: t('patient.appointments.title'), icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-300 ${activeTab === tab.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                  : "text-gray-500 hover:text-primary hover:bg-primary/5"
                  }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline text-sm uppercase tracking-widest">{tab.label}</span>
                <span className="sm:hidden text-xs">{tab.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        <div className="p-8">
          {activeTab === "records" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {records.length === 0 ? (
                <div className="py-20 text-center opacity-50">
                  <Activity size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No medical records on file</p>
                </div>
              ) : (
                records.map((record: any) => (
                  <div
                    key={record._id}
                    className="p-6 bg-slate-50 dark:bg-zinc-800/50 rounded-3xl border border-black/5 hover:border-primary/30 transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight group-hover:text-primary transition-colors">
                          {record.diagnosis}
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(record.visitDate).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">
                            {record.clinicId?.name || "Consultation"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/doctor/records/${record._id}`}
                          className="px-4 py-2 bg-white dark:bg-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-black/5 hover:border-primary transition-all shadow-sm"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleDeleteRecord(record._id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-200 transition-all"
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {record.chiefComplaint && (
                      <div className="mb-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Chief Complaint</p>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{record.chiefComplaint}</p>
                      </div>
                    )}
                    {record.notes && (
                      <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-black/5">
                        <p className="text-xs italic text-gray-500 dark:text-gray-500">"{record.notes}"</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "prescriptions" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {prescriptions.length === 0 ? (
                <div className="py-20 text-center opacity-50">
                  <Pill size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No medications issued</p>
                </div>
              ) : (
                prescriptions.map((prescription: any) => (
                  <div
                    key={prescription._id}
                    className="p-6 bg-slate-50 dark:bg-zinc-800/50 rounded-3xl border border-black/5 cursor-pointer hover:border-primary/50 transition-all group shadow-sm hover:shadow-lg"
                    onClick={() => router.push(`/dashboard/doctor/prescriptions?search=${prescription._id}`)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight group-hover:text-primary transition-colors">
                          {prescription.diagnosis}
                        </h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                          {new Date(prescription.createdAt).toLocaleDateString()} • {prescription.medicines?.length || 0} Medications
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePrescription(prescription._id);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-200 transition-all"
                          title="Delete Prescription"
                        >
                          <Trash2 size={18} />
                        </button>
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          <ArrowLeft size={18} className="rotate-180" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {prescription.medicines?.slice(0, 3).map((m: any) => (
                        <span key={m.name} className="px-3 py-1 bg-white dark:bg-zinc-900 text-[10px] font-bold text-gray-600 dark:text-zinc-400 rounded-xl border border-black/5">
                          {m.name} ({m.dosage})
                        </span>
                      ))}
                      {prescription.medicines?.length > 3 && (
                        <span className="text-[10px] font-bold text-primary self-center ml-2">+{prescription.medicines.length - 3} more</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "appointments" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {appointments.length === 0 ? (
                <div className="py-20 text-center opacity-50">
                  <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No previous bookings</p>
                </div>
              ) : (
                appointments.map((appointment: any) => (
                  <div
                    key={appointment._id}
                    className="p-5 bg-slate-50 dark:bg-zinc-800/50 rounded-3xl border border-black/5 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-5">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg border ${appointment.status === "completed" ? "bg-green-100 text-green-600 border-green-200" :
                          appointment.status === "cancelled" ? "bg-red-100 text-red-600 border-red-200" :
                            "bg-blue-100 text-blue-600 border-blue-200"
                        }`}>
                        {new Date(appointment.dateTime).getDate()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white tracking-tight">
                          {appointment.reason || "General Consultation"}
                        </h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {new Date(appointment.dateTime).toLocaleString([], { month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${appointment.status === "completed"
                          ? "bg-green-500/10 text-green-600 border border-green-500/20"
                          : appointment.status === "cancelled"
                            ? "bg-red-500/10 text-red-600 border border-red-500/20"
                            : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                          }`}
                      >
                        {appointment.status}
                      </span>
                      <button
                        onClick={() => handleDeleteAppointment(appointment._id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-200 transition-all"
                        title="Delete Appointment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
