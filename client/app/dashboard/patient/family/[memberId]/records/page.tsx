"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAddFamilyRecordMutation, useGetFamilyRecordsQuery } from "@/store/api/patientApi";
import { ArrowLeft, FileText, Calendar, User, Building2, Plus, Upload } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export default function FamilyRecordsPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params?.memberId as string;
  const t = useTranslations();

  const { data, isLoading, refetch } = useGetFamilyRecordsQuery(memberId);
  const [addFamilyRecord, { isLoading: isAdding }] = useAddFamilyRecordMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    chiefComplaint: "",
    diagnosis: "Lab Report",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    fileUrl: "",
  });

  const records = data?.data || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, fileUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.chiefComplaint || !formData.fileUrl) {
      toast.error(t('patient.family.titleAndAttachmentRequired'));
      return;
    }

    try {
      await addFamilyRecord({ memberId, ...formData }).unwrap();
      toast.success(t('patient.family.recordAdded'));
      setIsModalOpen(false);
      setFormData({
        chiefComplaint: "",
        diagnosis: "Lab Report",
        date: new Date().toISOString().split("T")[0],
        notes: "",
        fileUrl: "",
      });
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || t('patient.family.failedToAdd'));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRecordTypeTranslation = (type: string) => {
    switch (type) {
      case "Lab Report": return t('patient.family.labReport');
      case "Imaging": return t('patient.family.imaging');
      case "Prescription": return t('patient.family.prescription');
      case "Other": return t('patient.family.other');
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-primary hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          <span className="font-bold uppercase tracking-widest text-[10px]">{t('patient.family.backToFamily')}</span>
        </button>
        <h1 className="text-3xl font-black text-text-primary tracking-tighter">
          {t('patient.family.recordsTitle')}
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-white hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          {t('patient.family.addRecord')}
        </button>
      </div>

      {/* Records List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl border border-border-light bg-white" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-[2rem] border border-border-light bg-white p-12 text-center shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-text-primary opacity-20 mb-4" />
          <h3 className="text-lg font-bold text-text-primary">
            {t('patient.family.noRecordsDesc')}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {records.map((record: any) => (
            <div
              key={record._id}
              className="group rounded-[2rem] border border-border-light bg-white p-6 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between h-full">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                      <FileText className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-text-primary tracking-tight">
                        {record.chiefComplaint || record.diagnosis}
                      </h3>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-0.5">
                        {getRecordTypeTranslation(record.diagnosis)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-6 text-xs font-bold text-text-primary">
                    {record.doctorId && (
                      <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-xl border border-black/5">
                        <User className="h-4 w-4 text-primary" />
                        <span>Dr. {record.doctorId.name}</span>
                      </div>
                    )}
                    {record.clinicId && (
                      <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-xl border border-black/5">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span>{record.clinicId?.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-xl border border-black/5">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{formatDate(record.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex h-full items-center sm:border-l border-border-light sm:pl-8">
                  <Link
                    href={`/dashboard/patient/records/${record._id}`}
                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-primary/90 active:scale-95 shadow-lg shadow-primary/20"
                  >
                    {t('patient.family.viewRecord')}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('patient.family.addRecordModalTitle')}
      >
        <form onSubmit={handleAddRecord} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-primary uppercase tracking-widest ml-1">
              {t('patient.family.formTitle')}
            </label>
            <input
              type="text"
              placeholder={t('patient.family.formTitle')}
              value={formData.chiefComplaint}
              onChange={(e) => setFormData((prev) => ({ ...prev, chiefComplaint: e.target.value }))}
              className="w-full rounded-2xl border border-border-light p-4 text-sm font-bold text-text-primary bg-surface focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-primary uppercase tracking-widest ml-1">
              {t('patient.records.category')}
            </label>
            <select
              value={formData.diagnosis}
              onChange={(e) => setFormData((prev) => ({ ...prev, diagnosis: e.target.value }))}
              className="w-full rounded-2xl border border-border-light p-4 text-sm font-bold text-text-primary bg-surface focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
            >
              <option value="Lab Report">{t('patient.family.labReport')}</option>
              <option value="Imaging">{t('patient.family.imaging')}</option>
              <option value="Prescription">{t('patient.family.prescription')}</option>
              <option value="Other">{t('patient.family.other')}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-primary uppercase tracking-widest ml-1">
              {t('form.dob')}
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full rounded-2xl border border-border-light p-4 text-sm font-bold text-text-primary bg-surface focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-primary uppercase tracking-widest ml-1">
              {t('patient.family.notes')}
            </label>
            <textarea
              placeholder={t('patient.family.notes')}
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full rounded-2xl border border-border-light p-4 text-sm font-bold text-text-primary bg-surface h-32 focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
            />
          </div>

          <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/20 p-8 text-sm font-bold text-text-primary cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Upload className="h-6 w-6" />
            </div>
            <span className="text-xs uppercase tracking-widest">
              {formData.fileUrl ? t('patient.family.attachmentSelected') : t('patient.family.uploadAttachment')}
            </span>
            <input type="file" className="hidden" onChange={handleFileChange} />
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-black/5">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl px-8 h-12 font-black uppercase tracking-widest text-[10px]">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isAdding} className="rounded-xl px-8 h-12 font-black uppercase tracking-widest text-[10px]">
              {isAdding ? t('patient.family.saving') : t('patient.family.saveRecord')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );;
}
