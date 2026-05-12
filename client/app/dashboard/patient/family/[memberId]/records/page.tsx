"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  useAddFamilyRecordMutation,
  useDeleteFamilyRecordMutation,
  useGetFamilyRecordsQuery,
} from "@/store/api/patientApi";
import { ArrowLeft, FileText, Calendar, User, Building2, Plus, Upload, Eye, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

export default function FamilyRecordsPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params?.memberId as string;
  const t = useTranslations();

  const { data, isLoading, refetch } = useGetFamilyRecordsQuery(memberId);
  const [addFamilyRecord, { isLoading: isAdding }] = useAddFamilyRecordMutation();
  const [deleteFamilyRecord] = useDeleteFamilyRecordMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<any | null>(null);
  const [formData, setFormData] = useState({ title: "", diagnosis: "Document", doctorName: "", clinicName: "", date: new Date().toISOString().split("T")[0], notes: "", fileUrl: "" });

  const records = data?.data || [];

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");
  const recordTitle = (r: any) => r?.chiefComplaint || r?.attachments?.[0]?.fileName || t("patient.family.document");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData((p) => ({ ...p, fileUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.fileUrl) return toast.error(t("patient.family.titleAndAttachmentRequired"));
    try {
      await addFamilyRecord({ memberId, ...formData }).unwrap();
      toast.success(t("patient.family.recordAdded"));
      setIsModalOpen(false);
      setFormData({ title: "", diagnosis: "Document", doctorName: "", clinicName: "", date: new Date().toISOString().split("T")[0], notes: "", fileUrl: "" });
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || t("patient.family.failedToAdd"));
    }
  };

  const doDelete = async () => {
    if (!recordToDelete) return;
    try {
      await deleteFamilyRecord({ memberId, recordId: recordToDelete._id }).unwrap();
      toast.success(t("patient.family.recordDeleted"));
      setRecordToDelete(null);
      setIsDeleteOpen(false);
      setIsDetailOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || t("common.error"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[auto,1fr,auto] items-center gap-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-text-primary hover:text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-bold uppercase tracking-widest text-[10px]">{t("patient.family.backToFamily")}</span>
        </button>

        <h1 className="text-center text-2xl font-black text-text-primary sm:text-3xl">{t("patient.family.recordsTitle")}</h1>

        <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-white">
          <Plus className="h-4 w-4" /> {t("patient.family.addRecord")}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-4xl border bg-white" />)}</div>
      ) : records.length === 0 ? (
        <div className="rounded-4xl border p-12 text-center bg-white">
          <FileText className="mx-auto h-12 w-12 text-text-primary opacity-20 mb-4" />
          <h3 className="text-lg font-bold text-text-primary">{t("patient.family.noRecordsDesc")}</h3>
        </div>
      ) : (
        <div className="grid gap-4">
          {records.map((r: any) => (
            <div key={r._id} className="flex items-center justify-between rounded-4xl border bg-white p-6">
              <div>
                <h3 className="text-xl font-black">{recordTitle(r)}</h3>
                <p className="text-xs uppercase text-primary mt-1">{r.diagnosis || t("patient.family.document")}</p>
                <div className="mt-3 flex gap-2 text-xs text-text-primary">
                  <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-xl"><User className="h-4 w-4 text-primary" /> <span>{r.externalDoctorName || r.doctorId?.name || "-"}</span></div>
                  <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-xl"><Building2 className="h-4 w-4 text-primary" /> <span>{r.externalClinicName || r.clinicId?.name || "-"}</span></div>
                  <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-xl"><Calendar className="h-4 w-4 text-primary" /> <span>{formatDate(r.visitDate || r.createdAt)}</span></div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setSelectedRecord(r); setIsDetailOpen(true); }} className="rounded-xl bg-primary px-4 py-2 text-white"><Eye className="h-4 w-4" /></button>
                <button onClick={() => { setRecordToDelete(r); setIsDeleteOpen(true); }} className="rounded-xl border px-4 py-2 text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t("patient.family.addRecordModalTitle")}>
        <form onSubmit={handleAdd} className="space-y-4">
          <input placeholder={t("patient.family.formTitle")} value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} className="w-full rounded-2xl border p-3" />
          <input placeholder={t("patient.family.doctorName")} value={formData.doctorName} onChange={(e) => setFormData((p) => ({ ...p, doctorName: e.target.value }))} className="w-full rounded-2xl border p-3" />
          <input placeholder={t("patient.family.clinicName")} value={formData.clinicName} onChange={(e) => setFormData((p) => ({ ...p, clinicName: e.target.value }))} className="w-full rounded-2xl border p-3" />
          <select value={formData.diagnosis} onChange={(e) => setFormData((p) => ({ ...p, diagnosis: e.target.value }))} className="w-full rounded-2xl border p-3">
            <option value="Document">{t("patient.family.document")}</option>
            <option value="Lab Report">{t("patient.family.labReport")}</option>
            <option value="Imaging">{t("patient.family.imaging")}</option>
            <option value="Prescription">{t("patient.family.prescription")}</option>
            <option value="Other">{t("patient.family.other")}</option>
          </select>
          <label className="flex flex-col items-center gap-2 p-4 border rounded-2xl cursor-pointer">
            <Upload />
            <span>{formData.fileUrl ? t("patient.family.attachmentSelected") : t("patient.family.uploadAttachment")}</span>
            <input type="file" className="hidden" onChange={handleFileChange} />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={isAdding}>{isAdding ? t("patient.family.saving") : t("patient.family.saveRecord")}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={selectedRecord ? recordTitle(selectedRecord) : t("patient.family.recordDetails")}>
        {selectedRecord && (
          <div className="space-y-4">
            <h2 className="text-xl font-black">{recordTitle(selectedRecord)}</h2>
            <p className="text-sm">{selectedRecord.diagnosis}</p>
            <div className="flex gap-2">
              <div className="p-2 border rounded"><User /> {selectedRecord.externalDoctorName || selectedRecord.doctorId?.name}</div>
              <div className="p-2 border rounded"><Building2 /> {selectedRecord.externalClinicName || selectedRecord.clinicId?.name}</div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setRecordToDelete(selectedRecord); setIsDetailOpen(false); setIsDeleteOpen(true); }}>{t("patient.family.deleteRecord")}</Button>
              <Button onClick={() => setIsDetailOpen(false)}>{t("common.close")}</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmationModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={doDelete} title={t("patient.family.deleteRecord")} message={t("patient.family.confirmDelete")} confirmText={t("common.delete")} cancelText={t("common.cancel")} variant="danger" />
    </div>
  );
}
