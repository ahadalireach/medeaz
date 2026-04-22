"use client";

import { useState } from "react";
import { useGetPatientProfileQuery, useDeleteRecordMutation } from "@/store/api/clinicApi";
import { format } from "date-fns";
import { ArrowLeft, User, Mail, Phone, Calendar, FileText, Trash2, Pill, Eye, X, Building2, Download } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";
import { ConfirmationModal } from "../ui/ConfirmationModal";
import { resolveMediaUrl } from "@/lib/media";

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
        <div className="h-40 bg-surface rounded-[2rem]"></div>
        <div className="h-64 bg-surface rounded-[2rem]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white p-12 rounded-[2.5rem] border border-black/5 text-center shadow-sm">
        <User className="h-12 w-12 text-white/70 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-text-primary">{t('clinic.patientSearch.noResults')}</h3>
        <p className="text-text-secondary mt-2">{t('clinic.patientSearch.adjustSearch')}</p>
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
          className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors font-bold text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </Link>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative">
          <div className="h-32 w-32 bg-primary/10 rounded-[2rem] flex items-center justify-center flex-shrink-0 border-4 border-white shadow-xl overflow-hidden">
            {profile.photo ? (
              <img src={resolveMediaUrl(profile.photo) || profile.photo} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-14 w-14 text-primary" />
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-black text-text-primary tracking-tight">
              {profile.name}
            </h1>
            <div className="mt-2 flex flex-wrap justify-center md:justify-start items-center gap-4 text-text-secondary">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Mail className="h-4 w-4 text-primary/60" />
                {profile.email}
              </span>
              <span className="h-1 w-1 bg-surface-lavender rounded-full hidden md:block"></span>
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Phone className="h-4 w-4 text-primary/60" />
                {profile.phone || "N/A"}
              </span>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                  {t('patient.profile.dateOfBirth')}
                </p>
                <p className="text-sm font-bold text-text-primary">
                  {profile.dob && profile.dob !== "N/A" ? format(new Date(profile.dob), "MMM dd, yyyy") : "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                  {t('patient.profile.gender')}
                </p>
                <p className="text-sm font-bold text-text-primary capitalize">
                  {profile.gender || "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
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
      <div className="flex items-center gap-2 p-1 bg-surface/50 rounded-2xl w-fit">
        {[
          { id: "visits", label: t('clinic.appointments.title') },
          { id: "records", label: "Medical Records" },
          { id: "prescriptions", label: t('patient.recentPrescriptions') }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? "bg-white  text-primary shadow-sm"
                : "text-text-secondary hover:text-text-primary :text-white"
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
                  className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-black/5 shadow-xs hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-text-primary">
                        Dr. {visit.doctorId?.name || "N/A"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Building2 className="h-3 w-3 text-text-secondary" />
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                          {visit.clinicId?.name || visit.externalClinicName || "Private Practice"}
                        </p>
                      </div>
                      <p className="text-[10px] font-bold text-text-secondary mt-1 uppercase tracking-widest">
                        {visit.appointmentDate
                          ? format(new Date(visit.appointmentDate), "EEEE, MMM dd, yyyy")
                          : "N/A"} • {visit.appointmentTime || ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${visit.status === "completed"
                        ? "bg-primary/10 text-primary"
                        : "bg-[#B45309]/10 text-[#B45309]"
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
                  className="p-6 bg-white rounded-[2rem] border border-black/5 shadow-xs"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-text-primary">{record.chiefComplaint || "Medical Document"}</h4>
                      <p className="text-xs font-bold text-text-secondary mt-1 uppercase tracking-widest">{record.diagnosis || "No Diagnosis Provided"}</p>
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
                            className="p-2 text-red-500 hover:bg-red-50 :bg-red-500/10 rounded-lg transition-colors inline-block"
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
                  className="p-6 bg-white rounded-[2rem] border border-black/5 shadow-xs flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-black text-text-primary">{px.diagnosis}</h4>
                    <p className="text-xs font-bold text-text-secondary mt-1 uppercase tracking-widest">Prescribed by Dr. {px.doctorId?.name || "Clinic Staff"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-bold text-text-primary mb-2">{format(new Date(px.createdAt), "MMM dd, yyyy")}</p>
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
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden border border-black/5 animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="p-8 border-b border-black/5 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-xl font-black text-text-primary">{selectedRecord.chiefComplaint || "Medical Record"}</h3>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">Visit Date: {format(new Date(selectedRecord.visitDate), "MMMM dd, yyyy")}</p>
              </div>
              <button onClick={() => { setSelectedRecord(null); setPreviewFile(null); }} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-black/5 :bg-white/5 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] block mb-3">Diagnosis</label>
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="text-sm font-bold text-text-primary">{selectedRecord.diagnosis || "No diagnosis provided"}</p>
                </div>
              </div>
              
              {selectedRecord.notes && (
                <div>
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] block mb-3">Clinical Notes</label>
                  <p className="text-sm font-medium text-text-secondary whitespace-pre-wrap leading-relaxed bg-background/50 p-5 rounded-2xl">
                    {selectedRecord.notes}
                  </p>
                </div>
              )}
              {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                <div>
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] block mb-3">Attachments</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedRecord.attachments.map((file: any, idx: number) => {
                      const rawPath =
                        file.fileUrl ||
                        file.url ||
                        file.path ||
                        file.secure_url ||
                        file.attachmentUrl ||
                        "";
                      const normalizedPath = String(rawPath || "").trim().replace(/\\/g, '/');
                      const fileUrl = resolveMediaUrl(normalizedPath) || normalizedPath;
                      const previewKey = `${normalizedPath || file.fileName || 'file'}-${idx}`;
                      const isActivePreview = previewFile?.previewKey === previewKey;
                      const canPreview = Boolean(fileUrl);
                      return (
                        <div key={idx} className="flex flex-col gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              if (!canPreview) return;
                              setPreviewFile(isActivePreview ? null : { ...file, fullUrl: fileUrl, previewKey });
                            }}
                            disabled={!canPreview}
                            className={`flex items-center gap-3 p-4 border rounded-2xl transition-all group shadow-sm text-left w-full ${isActivePreview ? 'bg-primary/5 border-primary shadow-md' : 'bg-background  border-black/5 '} ${!canPreview ? 'opacity-60 cursor-not-allowed' : ''}`}
                          >
                            <div className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all ${isActivePreview ? 'bg-primary text-white' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'}`}>
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black text-text-primary truncate">{file.fileName || `Attachment ${idx + 1}`}</p>
                              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{file.fileType || "Document"} — {!canPreview ? "Preview Unavailable" : isActivePreview ? "Hide Preview" : "Show Preview"}</p>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {previewFile && (
                <div className="mt-8 rounded-3xl overflow-hidden border border-black/5 bg-black/[0.02] min-h-[400px] flex flex-col relative group/preview">
                  <div className="absolute top-4 right-4 z-10 opacity-0 group-hover/preview:opacity-100 transition-opacity">
                    <a href={previewFile.fullUrl} download className="h-10 px-4 flex items-center gap-2 bg-white rounded-xl shadow-lg text-[10px] font-black uppercase tracking-widest text-primary hover:scale-[1.02] active:scale-95 transition-all mb-2">
                       <Download className="h-3 w-3" />
                       Download File
                    </a>
                  </div>

                  {!previewFile.fullUrl ? (
                    <div className="flex-1 flex items-center justify-center p-10 text-center">
                      <p className="text-sm font-semibold text-text-secondary">File preview is unavailable for this record.</p>
                    </div>
                  ) : /\.(jpg|jpeg|png|webp|gif|bmp)(\?|$)/i.test(previewFile.fullUrl) || String(previewFile.fileType || '').toLowerCase().includes('image') ? (
                    <div className="flex-1 flex items-center justify-center p-8 bg-white">
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

                  <div className="p-4 flex justify-between items-center bg-white/40 backdrop-blur-sm border-t border-black/5 flex-shrink-0">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Secure Document Viewer</span>
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
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-black/5 animate-in zoom-in-95 duration-300 print:shadow-none print:rounded-none print:border-0 md:max-h-[90vh] flex flex-col">
            <div className="p-8 border-b border-black/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-text-primary">Prescription</h3>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">Diagnosis: {selectedPrescription.diagnosis}</p>
              </div>
              <button onClick={() => setSelectedPrescription(null)} className="h-12 w-12 flex items-center justify-center rounded-2xl hover:bg-black/5 :bg-white/5 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-6 bg-background/50 p-6 rounded-[2rem]">
                <div>
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] block mb-1">Doctor</label>
                  <p className="text-sm font-bold text-text-primary">Dr. {selectedPrescription.doctorId?.name || "Clinic Staff"}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] block mb-1">Date</label>
                  <p className="text-sm font-bold text-text-primary">{format(new Date(selectedPrescription.createdAt), "MMM dd, yyyy")}</p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] block mb-4">Medications</label>
                <div className="space-y-4">
                  {selectedPrescription.medicines?.map((med: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-black/5 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                          <Pill size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-text-primary">{med.name}</p>
                          <p className="text-[11px] font-medium text-text-secondary">{med.dosage} • {med.frequency}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-text-primary">{med.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPrescription.advice && (
                <div>
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] block mb-3">Advice / Instructions</label>
                  <p className="text-sm font-medium text-text-secondary whitespace-pre-wrap leading-relaxed bg-background/50 p-5 rounded-2xl">
                    {selectedPrescription.advice}
                  </p>
                </div>
              )}
            </div>
            <div className="p-8 bg-background/50 flex justify-between print:hidden">
              <button
                onClick={() => window.print()}
                className="px-8 py-3 bg-white border border-black/10 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black/5 :bg-white/5 transition-all"
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
    <div className="py-20 text-center bg-background/50 rounded-[2.5rem] border border-dashed border-border-light">
      <div className="h-16 w-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
        <FileText className="h-8 w-8 text-white/70" />
      </div>
      <p className="text-lg font-bold text-text-primary">{message}</p>
      <p className="text-sm text-text-secondary">Patient has not shared any data for this category yet.</p>
    </div>
  );
}
