"use client";

import { useState } from "react";
import { useGetPatientProfileQuery, useDeleteRecordMutation } from "@/store/api/clinicApi";
import { format } from "date-fns";
import { ArrowLeft, User, Mail, Phone, Calendar, FileText, Trash2, Pill, Eye, X, Building2, Download } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";
import { ConfirmationModal } from "../ui/ConfirmationModal";

interface PatientProfileViewProps {
  patientId: string;
}

export default function PatientProfileView({
  patientId,
}: PatientProfileViewProps) {
  const t = useTranslations();
  const { data, isLoading } = useGetPatientProfileQuery(patientId);
  const [deleteRecord] = useDeleteRecordMutation();

  const profile = data?.data;

  const [activeTab, setActiveTab] = useState("visits");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null);

  const handleDeleteRecord = async () => {
    if (!deleteRecordId) return;
    try {
      await deleteRecord(deleteRecordId).unwrap();
      toast.success("Medical record deleted successfully");
      setDeleteRecordId(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete medical record");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-gray-200 dark:bg-zinc-800 rounded-[2rem]"></div>
        <div className="h-64 bg-gray-200 dark:bg-zinc-800 rounded-[2rem]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white dark:bg-zinc-900 p-12 rounded-[2.5rem] border border-black/5 dark:border-white/10 text-center shadow-sm">
        <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('clinic.patientSearch.noResults')}</h3>
        <p className="text-gray-500 dark:text-zinc-500 mt-2">{t('clinic.patientSearch.adjustSearch')}</p>
        <Link
          href="/dashboard/clinic_admin/patients/search"
          className="inline-block mt-6 px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest"
        >
          {t('common.back')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/clinic_admin/patients/search"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </Link>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-zinc-900/50 p-8 sm:p-10 rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative">
          <div className="h-32 w-32 bg-primary/10 rounded-[2rem] flex items-center justify-center flex-shrink-0 border-4 border-white dark:border-zinc-800 shadow-xl overflow-hidden">
            {profile.photo ? (
              <img src={profile.photo.startsWith('http') ? profile.photo : `${process.env.NEXT_PUBLIC_API_URL}${profile.photo}`} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-14 w-14 text-primary" />
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              {profile.name}
            </h1>
            <div className="mt-2 flex flex-wrap justify-center md:justify-start items-center gap-4 text-gray-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Mail className="h-4 w-4 text-primary/60" />
                {profile.email}
              </span>
              <span className="h-1 w-1 bg-gray-300 rounded-full hidden md:block"></span>
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Phone className="h-4 w-4 text-primary/60" />
                {profile.phone || "N/A"}
              </span>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                  {t('patient.profile.dateOfBirth')}
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                  {profile.dob && profile.dob !== "N/A" ? format(new Date(profile.dob), "MMM dd, yyyy") : "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                  {t('patient.profile.gender')}
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-zinc-100 capitalize">
                  {profile.gender || "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                  {t('patient.profile.bloodGroup')}
                </p>
                <div className="inline-flex items-center px-2 py-0.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-black">
                  {profile.bloodGroup || "N/A"}
                </div>
              </div>
                          </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1 bg-gray-100/50 dark:bg-zinc-800/50 rounded-2xl w-fit">
        {[
          { id: "visits", label: t('clinic.appointments.title') },
          { id: "records", label: t('patient.records.title') },
          { id: "prescriptions", label: t('patient.recentPrescriptions') }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-zinc-900 text-primary shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === "visits" && (
          <div className="grid gap-4">
            {profile.visitHistory && profile.visitHistory.length > 0 ? (
              profile.visitHistory.map((visit: any) => (
                <div
                  key={visit._id}
                  className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900/50 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-xs hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900 dark:text-white">
                        Dr. {visit.doctorId?.name || "N/A"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Building2 className="h-3 w-3 text-gray-400" />
                        <p className="text-[10px] font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest">
                          {visit.clinicId?.name || visit.externalClinicName || "Private Practice"}
                        </p>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 mt-1 uppercase tracking-widest">
                        {visit.appointmentDate
                          ? format(new Date(visit.appointmentDate), "EEEE, MMM dd, yyyy")
                          : "N/A"} • {visit.appointmentTime || ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${visit.status === "completed"
                        ? "bg-green-500/10 text-green-600"
                        : "bg-yellow-500/10 text-yellow-600"
                        }`}
                    >
                      {visit.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <NoDataMessage message="No visit history discovered" />
            )}
          </div>
        )}

        {activeTab === "records" && (
          <div className="grid gap-4">
            {profile.medicalRecords && profile.medicalRecords.length > 0 ? (
              profile.medicalRecords.map((record: any) => (
                <div
                  key={record._id}
                  className="p-6 bg-white dark:bg-zinc-900/50 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-gray-900 dark:text-white">{record.chiefComplaint || "Medical Document"}</h4>
                      <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">{record.diagnosis || "No Diagnosis Provided"}</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">
                          {format(new Date(record.visitDate), "MMM dd, yyyy")}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedRecord(record)}
                            className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors inline-block"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteRecordId(record._id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors inline-block"
                            title="Delete Record"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <NoDataMessage message="No medical records shared" />
            )}
          </div>
        )}

        {activeTab === "prescriptions" && (
          <div className="grid gap-4">
            {profile.prescriptions && profile.prescriptions.length > 0 ? (
              profile.prescriptions.map((px: any) => (
                <div
                  key={px._id}
                  className="p-6 bg-white dark:bg-zinc-900/50 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-xs flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-black text-gray-900 dark:text-white">{px.diagnosis}</h4>
                    <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-widest">Prescribed by Dr. {px.doctorId?.name || "Clinic Staff"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-900 dark:text-white mb-2">{format(new Date(px.createdAt), "MMM dd, yyyy")}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedPrescription(px)}
                          className="h-9 w-9 flex items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all font-bold"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <NoDataMessage message="No prescriptions issued" />
            )}
          </div>
        )}
      </div>

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-10 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden border border-black/5 dark:border-white/10 animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="p-8 border-b border-black/5 dark:border-white/10 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">{selectedRecord.chiefComplaint || "Medical Record"}</h3>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">Visit Date: {format(new Date(selectedRecord.visitDate), "MMMM dd, yyyy")}</p>
              </div>
              <button onClick={() => { setSelectedRecord(null); setPreviewFile(null); }} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] block mb-3">Diagnosis</label>
                <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10">
                  <p className="text-sm font-bold text-gray-900 dark:text-zinc-100">{selectedRecord.diagnosis || "No diagnosis provided"}</p>
                </div>
              </div>
              
              {selectedRecord.notes && (
                <div>
                  <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] block mb-3">Clinical Notes</label>
                  <p className="text-sm font-medium text-gray-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed bg-gray-50/50 dark:bg-zinc-800/50 p-5 rounded-2xl">
                    {selectedRecord.notes}
                  </p>
                </div>
              )}
              {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                <div>
                  <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] block mb-3">Attachments</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedRecord.attachments.map((file: any, idx: number) => {
                      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';
                      const rawUrl = (file.fileUrl || "").replace(/\\/g, '/');
                      const relativePath = rawUrl?.startsWith('/') ? rawUrl : `/${rawUrl}`;
                      const fileUrl = rawUrl
                        ? (rawUrl.startsWith('http') || rawUrl.startsWith('data:') ? rawUrl : `${baseUrl}${relativePath}`)
                        : "#";
                      return (
                        <div key={idx} className="flex flex-col gap-4">
                          <button
                            onClick={() => setPreviewFile(previewFile?.fileUrl === file.fileUrl ? null : { ...file, fullUrl: fileUrl })}
                            className={`flex items-center gap-3 p-4 border rounded-2xl transition-all group shadow-sm text-left w-full ${previewFile?.fileUrl === file.fileUrl ? 'bg-primary/5 border-primary shadow-md' : 'bg-gray-50 dark:bg-zinc-800/80 border-black/5 dark:border-white/10'}`}
                          >
                            <div className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all ${previewFile?.fileUrl === file.fileUrl ? 'bg-primary text-white' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'}`}>
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black text-gray-900 dark:text-white truncate">{file.fileName || `Attachment ${idx + 1}`}</p>
                              <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">{file.fileType || "Document"} — {previewFile?.fileUrl === file.fileUrl ? "Hide Preview" : "Show Preview"}</p>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {previewFile && (
                <div className="mt-8 rounded-3xl overflow-hidden border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] min-h-[400px] flex flex-col relative group/preview">
                  <div className="absolute top-4 right-4 z-10 opacity-0 group-hover/preview:opacity-100 transition-opacity">
                    <a href={previewFile.fullUrl} download className="h-10 px-4 flex items-center gap-2 bg-white dark:bg-zinc-800 rounded-xl shadow-lg text-[10px] font-black uppercase tracking-widest text-primary hover:scale-[1.02] active:scale-95 transition-all mb-2">
                       <Download className="h-3 w-3" />
                       Download File
                    </a>
                  </div>

                  {previewFile.fullUrl.match(/\.(jpg|jpeg|png|webp|gif|bmp)$/i) || previewFile.fileType?.includes('image') ? (
                    <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-zinc-950">
                      <img
                        src={previewFile.fullUrl}
                        className="max-w-full max-h-[600px] object-contain rounded-xl shadow-lg"
                        alt="Document Preview"
                      />
                    </div>
                  ) : (
                    <iframe
                      src={previewFile.fullUrl}
                      className="w-full h-[600px] border-0"
                      title="Document Preview"
                    />
                  )}

                  <div className="p-4 flex justify-between items-center bg-white/40 dark:bg-zinc-900/40 backdrop-blur-sm border-t border-black/5 dark:border-white/10 flex-shrink-0">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Secure Document Viewer</span>
                    <a href={previewFile.fullUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest mr-2">Open in Full View</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prescription Details Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 print:bg-white print:p-0">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-black/5 dark:border-white/10 animate-in zoom-in-95 duration-300 print:shadow-none print:rounded-none print:border-0 md:max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">Prescription</h3>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">Diagnosis: {selectedPrescription.diagnosis}</p>
              </div>
              <button onClick={() => setSelectedPrescription(null)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6 bg-gray-50/50 dark:bg-zinc-800/50 p-6 rounded-[2rem]">
                <div>
                  <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] block mb-1">Doctor</label>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Dr. {selectedPrescription.doctorId?.name || "Clinic Staff"}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] block mb-1">Date</label>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{format(new Date(selectedPrescription.createdAt), "MMM dd, yyyy")}</p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] block mb-4">Medications</label>
                <div className="space-y-4">
                  {selectedPrescription.medicines?.map((med: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-zinc-800 border border-black/5 dark:border-white/5 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                          <Pill size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white">{med.name}</p>
                          <p className="text-[11px] font-medium text-gray-500 dark:text-zinc-400">{med.dosage} • {med.frequency}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{med.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPrescription.advice && (
                <div>
                  <label className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] block mb-3">Advice / Instructions</label>
                  <p className="text-sm font-medium text-gray-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed bg-gray-50/50 dark:bg-zinc-800/50 p-5 rounded-2xl">
                    {selectedPrescription.advice}
                  </p>
                </div>
              )}
            </div>
            <div className="p-8 bg-gray-50/50 dark:bg-zinc-800/50 flex justify-between print:hidden">
              <button
                onClick={() => window.print()}
                className="px-8 py-3 bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                Download PDF
              </button>
               <Link
                href={`/dashboard/clinic_admin/appointments/${selectedPrescription.appointmentId || ''}`}
                className="px-8 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Go to Appointment
              </Link>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteRecordId}
        onClose={() => setDeleteRecordId(null)}
        onConfirm={handleDeleteRecord}
        title={t('modal.confirmDelete')}
        message={t('modal.cannotUndo')}
      />
    </div>
  );
}

function NoDataMessage({ message }: { message: string }) {
  return (
    <div className="py-20 text-center bg-gray-50/50 dark:bg-zinc-800/30 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-zinc-800">
      <div className="h-16 w-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <FileText className="h-8 w-8 text-gray-300" />
      </div>
      <p className="text-lg font-bold text-gray-900 dark:text-white">{message}</p>
      <p className="text-sm text-gray-500 dark:text-zinc-500">Patient has not shared any data for this category yet.</p>
    </div>
  );
}
