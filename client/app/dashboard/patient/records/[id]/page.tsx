"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import NextImage from "next/image";
import { useGetRecordDetailQuery } from "@/store/api/patientApi";
import { ArrowLeft, Calendar, User, Building2, Phone, Mail, Pill, FileText, Printer, X, ZoomIn, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useFormatter, useLocale, useTranslations } from "next-intl";

export default function RecordDetailPage() {
  const t = useTranslations();
  const format = useFormatter();
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data, isLoading } = useGetRecordDetailQuery(id);
  const prescription = data?.data;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format.dateTime(date, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-surface" />
        <div className="h-64 animate-pulse rounded-xl border border-border-light bg-white" />
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="rounded-xl border border-border-light bg-white p-12 text-center">
        <FileText className="mx-auto h-12 w-12 text-text-secondary" />
        <h3 className="mt-4 text-lg font-semibold text-text-primary">
          {t('prescription.notFound')}
        </h3>
        <Button onClick={() => router.back()} className="mt-4">
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary :text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          <span className="font-medium">{t('prescription.backToRecords')}</span>
        </button>
        <Button onClick={handlePrint} variant="outline" className="bg-white border-black/10 h-11 px-6 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
          <Printer className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
          {t('prescription.printPrescription')}
        </Button>
      </div>

      {/* Prescription Details */}
      <div className="rounded-[2.5rem] border border-black/5 bg-white p-8 sm:p-12 shadow-sm print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
        {/* Header Section */}
        <div className="mb-8 border-b border-border-light pb-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary print:text-2xl">
                {t('prescription.medicalPrescription')}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-text-secondary print:text-xs">
                <Calendar className="h-4 w-4" />
                {formatDate(prescription.createdAt)}
              </p>
            </div>
            <div className="shrink-0">
               <NextImage
                 src="/logo-light.svg"
                 alt="MedEaz"
                 width={120}
                 height={40}
                 priority
                 className="print:block"
               />
               <NextImage
                 src="/logo-dark.svg"
                 alt="MedEaz"
                 width={120}
                 height={40}
                 priority
                 className="hidden print:hidden"
               />
            </div>
          </div>
        </div>

        {/* Doctor & Clinic Info - Only for prescriptions */}
        {prescription.type !== "document" && (
          <div className="mb-8 grid gap-6 md:grid-cols-2 print:grid-cols-2 print:mb-6">
            <div className="rounded-lg border border-border-light p-4 print:border-border-light">
              <p className="mb-3 text-xs font-semibold uppercase text-text-secondary print:text-[10px]">
                {t('prescription.doctorInfo')}
              </p>
              <div className="space-y-2">
                <p className="flex items-center gap-2 font-semibold text-text-primary print:text-sm">
                  <User className="h-4 w-4 text-primary" />
                  {t('patient.bookAppointmentPage.doctorPrefix')} {prescription.doctorId?.name}
                </p>
                <p className="text-sm text-text-secondary print:text-xs">
                  {prescription.doctorId?.specialization}
                </p>
                {prescription.doctorId?.licenseNumber && (
                  <p className="text-xs text-text-secondary print:text-[9px]">
                    {t('form.licenseNo')}: {prescription.doctorId.licenseNumber}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border-light p-4 print:border-border-light">
              <p className="mb-3 text-xs font-semibold uppercase text-text-secondary print:text-[10px]">
                {t('prescription.clinicInfo')}
              </p>
              <div className="space-y-2">
                <p className="flex items-center gap-2 font-semibold text-text-primary print:text-sm">
                  <Building2 className="h-4 w-4 text-primary" />
                  {prescription.clinicId?.name}
                </p>
                <p className="text-sm text-text-secondary print:text-xs">
                  {prescription.clinicId?.address}
                </p>
                {prescription.clinicId?.phone && (
                  <p className="flex items-center gap-2 text-xs text-text-secondary print:text-[9px]">
                    <Phone className="h-3 w-3" />
                    {prescription.clinicId.phone}
                  </p>
                )}
                {prescription.clinicId?.email && (
                  <p className="flex items-center gap-2 text-xs text-text-secondary print:text-[9px]">
                    <Mail className="h-3 w-3" />
                    {prescription.clinicId.email}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Patient Info - Single line for print */}
        <div className="mb-8 rounded-lg border border-border-light p-6 print:mb-6 print:border-none print:p-0">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary print:mb-2 border-b border-border-light pb-2 print:border-border-light">
            {t('prescription.patientInfo')}
          </p>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-2 pt-1 print:pt-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-text-secondary print:text-text-secondary">{t('form.name')}:</span>
              <span className="text-sm font-black text-text-primary print:text-sm">
                {prescription.patientId?.name || "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-text-secondary print:text-text-secondary">{t('form.gender')}:</span>
              <span className="text-sm font-bold text-text-primary capitalize print:text-sm">
                {prescription.patientId?.gender ? t(`form.${prescription.patientId.gender}`) : "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-text-secondary print:text-text-secondary">{t('patient.profile.bloodGroup')}:</span>
              <span className="text-sm font-bold text-text-primary print:text-sm">
                {prescription.patientId?.bloodGroup || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="mb-8 print:mb-6">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-text-primary print:text-sm">
            <FileText className="h-5 w-5 text-primary print:h-4 print:w-4" />
            {t('prescription.diagnosis')}
          </h3>
          <p className="rounded-lg bg-background p-4 text-text-primary print:bg-white print:p-0 print:text-sm">
            {prescription.diagnosis}
          </p>
        </div>

        {/* Medicines */}
        {prescription.medicines && prescription.medicines.length > 0 && (
          <div className="mb-8 print:mb-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary print:text-sm">
              <Pill className="h-5 w-5 text-primary print:h-4 print:w-4" />
              {t('prescription.prescribedMedicines')} ({prescription.medicines.length})
            </h3>
            <div className="space-y-4 print:space-y-3">
              {prescription.medicines.map((medicine: any, index: number) => (
                <div
                  key={index}
                  className="rounded-lg border border-border-light p-4 print:border-border-light print:break-inside-avoid print:bg-white"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h4 className="text-lg font-semibold text-text-primary print:text-sm">
                      {index + 1}. {medicine.name}
                    </h4>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary print:bg-white print:border print:border-primary/20 print:text-[10px]">
                      {medicine.dosage}
                    </span>
                  </div>
                  <div className="grid gap-2 text-sm md:grid-cols-2 print:grid-cols-2">
                    <p className="text-text-secondary print:text-xs">
                      <span className="font-medium">{t('prescription.frequency')}:</span> {medicine.frequency}
                    </p>
                    <p className="text-text-secondary print:text-xs">
                      <span className="font-medium">{t('prescription.duration')}:</span> {medicine.duration}
                    </p>
                  </div>
                  {medicine.instructions && (
                    <p className="mt-2 text-sm italic text-text-secondary print:text-xs">
                      {medicine.instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {prescription.notes && (
          <div className="mb-8 print:mb-6">
            <h3 className="mb-3 text-lg font-semibold text-text-primary print:text-sm">
              {t('prescription.additionalNotes')}
            </h3>
            <p className="rounded-lg bg-background p-4 text-text-primary print:bg-white print:p-0 print:text-sm">
              {prescription.notes}
            </p>
          </div>
        )}

        {/* Attachments / Images Gallery */}
        {prescription.attachments && prescription.attachments.length > 0 && (
          <>
          <div className="print:hidden">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-text-primary">
              <FileText className="h-5 w-5 text-primary" />
              {t('prescription.uploadedDocuments')} ({prescription.attachments.length})
            </h3>
            <div className="grid gap-6 sm:grid-cols-2">
              {prescription.attachments.map((attachment: any, index: number) => (
                <div 
                  key={index} 
                  className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border-light bg-background group cursor-pointer"
                  onClick={() => setSelectedImage(attachment.fileUrl)}
                >
                    <NextImage
                      src={attachment.fileUrl}
                      alt={attachment.fileName || `Attachment ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white">
                            <ZoomIn size={24} />
                        </div>
                    </div>
                </div>
              ))}
            </div>

            <Modal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} title={t('prescription.uploadedDocuments')} size="xl">
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                    {selectedImage && (
                        <NextImage
                            src={selectedImage}
                            alt="Preview"
                            fill
                            className="object-contain"
                        />
                    )}
                </div>
                <div className="mt-4 flex justify-between items-center">
                    <button
                        onClick={() => {
                            const link = document.createElement('a');
                            link.href = selectedImage || '';
                            link.download = `medical-record-${Date.now()}.jpg`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover transition-all font-bold text-sm"
                    >
                        <Download className="h-4 w-4" />
                        {t('common.download')}
                    </button>
                    <Button onClick={() => setSelectedImage(null)} className="rounded-xl px-8">{t('common.close')}</Button>
                </div>
            </Modal>
          </div>

          {/* Print attachments */}
          <div className="hidden print:block mb-8 print:mb-6">
            <h3 className="mb-3 text-lg font-semibold text-text-primary print:text-sm">
              {t('prescription.uploadedDocuments')} ({prescription.attachments.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {prescription.attachments.map((attachment: any, index: number) => (
                <div key={index} className="border border-border-light rounded-lg p-2 print:break-inside-avoid bg-white">
                  <img
                    src={attachment.fileUrl}
                    alt={attachment.fileName || `Attachment ${index + 1}`}
                    className="w-full h-auto max-h-[260px] object-contain"
                  />
                  <p className="mt-1 text-[10px] text-text-secondary">{attachment.fileName || `Attachment ${index + 1}`}</p>
                </div>
              ))}
            </div>
          </div>
          </>
        )}

        {/* Signature Block - Only for print */}
        <div className="hidden print:block mt-16 pt-8 border-t border-border-light">
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-text-secondary">{t('prescription.issueDate')}</p>
                    <p className="text-sm font-bold">{formatDate(prescription.createdAt)}</p>
                </div>
                <div className="text-center min-w-[200px] space-y-4">
                    <div className="h-px bg-ink-soft w-full mb-1"></div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] mb-4">{t('prescription.doctorSignature')}</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
