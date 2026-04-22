"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

  const { data, isLoading, refetch } = useGetFamilyRecordsQuery(memberId);
  const [addFamilyRecord, { isLoading: isAdding }] = useAddFamilyRecordMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    recordType: "Lab Report",
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
    if (!formData.title || !formData.fileUrl) {
      toast.error("Title and attachment are required");
      return;
    }

    try {
      await addFamilyRecord({ memberId, ...formData }).unwrap();
      toast.success("Family medical record added");
      setIsModalOpen(false);
      setFormData({
        title: "",
        recordType: "Lab Report",
        date: new Date().toISOString().split("T")[0],
        notes: "",
        fileUrl: "",
      });
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to add family record");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary :text-white"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back to Family</span>
        </button>
        <h1 className="text-3xl font-bold text-text-primary">
          Family Member Records
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Record
        </button>
      </div>

      {/* Records List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl border border-border-light bg-white"
            />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-xl border border-border-light bg-white p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-text-secondary" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary">
            No records found
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            Medical records for this family member will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((record: any) => (
            <div
              key={record._id}
              className="rounded-xl border border-border-light bg-white p-6 transition-all hover:border-primary"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text-primary">
                    {record.diagnosis}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>Dr. {record.doctorId?.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      <span>{record.clinicId?.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(record.createdAt)}</span>
                    </div>
                  </div>

                  {record.medicines && record.medicines.length > 0 && (
                    <div className="mt-4 rounded-lg bg-background p-3">
                      <p className="text-xs font-semibold text-text-secondary">
                        Medicines ({record.medicines.length})
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {record.medicines.slice(0, 3).map((med: any, idx: number) => (
                          <span
                            key={idx}
                            className="rounded-full bg-white px-3 py-1 text-xs font-medium text-text-primary"
                          >
                            {med.name}
                          </span>
                        ))}
                        {record.medicines.length > 3 && (
                          <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
                            +{record.medicines.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* View Details CTA */}
                <div className="ml-4 flex h-full flex-col justify-center border-l border-border-light pl-4">
                  <Link
                    href={`/dashboard/patient/records/${record._id}`}
                    className="flex items-center gap-1 rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
                  >
                    View Record
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
        title="Add Family Medical Record"
      >
        <form onSubmit={handleAddRecord} className="space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            className="w-full rounded-xl border border-border-light p-3 text-sm"
          />

          <select
            value={formData.recordType}
            onChange={(e) => setFormData((prev) => ({ ...prev, recordType: e.target.value }))}
            className="w-full rounded-xl border border-border-light p-3 text-sm"
          >
            <option value="Lab Report">Lab Report</option>
            <option value="Imaging">Imaging</option>
            <option value="Prescription">Prescription</option>
            <option value="Other">Other</option>
          </select>

          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
            className="w-full rounded-xl border border-border-light p-3 text-sm"
          />

          <textarea
            placeholder="Notes"
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            className="w-full rounded-xl border border-border-light p-3 text-sm h-24"
          />

          <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border p-4 text-sm text-text-secondary cursor-pointer hover:border-primary hover:text-primary">
            <Upload className="h-4 w-4" />
            {formData.fileUrl ? "Attachment selected" : "Upload attachment"}
            <input type="file" className="hidden" onChange={handleFileChange} />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isAdding}>{isAdding ? "Saving..." : "Save Record"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
