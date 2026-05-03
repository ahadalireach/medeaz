"use client";

import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, FileText, MapPin, User, Printer } from "lucide-react";
import { useGetRecordByIdQuery, useGetPrescriptionByIdQuery } from "@/store/api/doctorApi";
import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function DoctorRecordDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params?.id as string;
  const type = searchParams.get("type");
  const printableRef = useRef<HTMLDivElement>(null);

  const { data: recordData, isLoading: isRecordLoading } = useGetRecordByIdQuery(id, {
    skip: type === "prescription",
  });
  const { data: prescriptionData, isLoading: isPrescriptionLoading } = useGetPrescriptionByIdQuery(id, {
    skip: type === "record",
  });

  const record = recordData?.data || prescriptionData?.data;
  const isLoading = isRecordLoading || isPrescriptionLoading;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  useEffect(() => {
    if (!isLoading && record && searchParams.get("print") === "true") {
      setTimeout(() => {
        handlePrint();
      }, 500);
    }
  }, [isLoading, record, searchParams]);

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
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { 
            margin: 0; 
          }
          body { 
            margin: 1.6cm; 
            -webkit-print-color-adjust: exact;
          }
          .print-hidden { 
            display: none !important; 
          }
        }
      `}} />
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <Button
          onClick={handlePrint}
          variant="outline"
          className="bg-white border-black/10 h-10 px-4 text-[10px] font-black uppercase tracking-widest"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Record
        </Button>
      </div>

      <div ref={printableRef} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-[#1a1a1a] print:border-none print:shadow-none print:p-0">
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
