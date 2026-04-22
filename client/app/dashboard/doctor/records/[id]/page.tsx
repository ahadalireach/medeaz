"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Calendar, FileText, MapPin, User } from "lucide-react";
import { useGetRecordByIdQuery, useGetPrescriptionByIdQuery } from "@/store/api/doctorApi";

export default function DoctorRecordDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const type = searchParams.get("type");
  const { data: recordData, isLoading: isRecordLoading } = useGetRecordByIdQuery(id, {
    skip: type === "prescription",
  });
  const { data: prescriptionData, isLoading: isPrescriptionLoading } = useGetPrescriptionByIdQuery(id, {
    skip: type === "record",
  });

  const record = recordData?.data || prescriptionData?.data;
  const isLoading = isRecordLoading || isPrescriptionLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/doctor/patients" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Back to Patients
        </Link>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-[#1a1a1a]">
          <h1 className="text-2xl font-bold">Medical record not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard/doctor/patients" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary">
        <ArrowLeft className="h-4 w-4" />
        Back to Patients
      </Link>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-[#1a1a1a]">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{record.diagnosis || "Medical Record"}</h1>
        <div className="mt-3 grid gap-2 text-sm text-gray-600 dark:text-gray-300">
          <p className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" /> {new Date(record.visitDate || record.createdAt).toLocaleString()}</p>
          <p className="inline-flex items-center gap-2"><User className="h-4 w-4" /> {record.patientId?.userId?.name || record.patientId?.name || "Patient"}</p>
          {record.clinicId?.name && <p className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {record.clinicId.name}</p>}
        </div>

        {record.chiefComplaint && (
          <div className="mt-6 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Chief complaint</p>
            <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">{record.chiefComplaint}</p>
          </div>
        )}

        {record.notes && (
          <div className="mt-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Notes</p>
            <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">{record.notes}</p>
          </div>
        )}

        {(record.prescriptionId?.medicines?.length > 0 || record.medicines?.length > 0) && (
          <div className="mt-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
            <p className="text-xs uppercase tracking-widest text-gray-400 font-bold inline-flex items-center gap-2"><FileText className="h-3 w-3" /> Medicines</p>
            <ul className="mt-2 space-y-2">
              {(record.prescriptionId?.medicines || record.medicines || []).map((med: any, idx: number) => (
                <li key={idx} className="text-sm text-gray-800 dark:text-gray-200">
                  {med.name} - {med.dosage} - {med.frequency}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
