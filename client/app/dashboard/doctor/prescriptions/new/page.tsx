"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useGetPatientsQuery, useCreatePrescriptionMutation, useGetDoctorProfileQuery } from "@/store/api/doctorApi";
import { toast } from "react-hot-toast";
import { SuccessModal } from "@/components/ui/SuccessModal";
import { Loader, User, Pill, FileText, Sparkles, Search, Plus, Mic } from "lucide-react";
import TrashIcon from "@/icons/trash-icon";
import { useTranslations, useLocale } from "next-intl";
import { useSelector } from "react-redux";
import VoicePrescription from "@/components/doctor/VoicePrescription";
import { useDebounce } from "@/hooks/useDebounce";

type Medicine = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
};

type ParsedPrescription = {
  diagnosis: string | null;
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  notes: string | null;
  consultationFee: number | null;
  medicineCost: number | null;
};

function NewPrescriptionInner() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useSelector((state: any) => state.auth.user);
  const patientIdFromQuery = searchParams.get("patientId");
  const appointmentIdFromQuery = searchParams.get("appointmentId");

  const [step, setStep] = useState<"select" | "record" | "review">("select");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(patientIdFromQuery || "");
  const [prescriptionData, setPrescriptionData] = useState<{
    diagnosis: string;
    medicines: Medicine[];
    notes: string;
    rawTranscript: string;
    consultationFee: number;
    medicineCost: number;
    appointmentId: string | null;
  }>({
    diagnosis: "",
    medicines: [],
    notes: "",
    rawTranscript: "",
    consultationFee: 0,
    medicineCost: 0,
    appointmentId: appointmentIdFromQuery || null,
  });
  const [patientSearch, setPatientSearch] = useState("");
  const debouncedSearch = useDebounce(patientSearch, 300);

  const [shouldScheduleFollowUp, setShouldScheduleFollowUp] = useState(false);
  const [followUpValue, setFollowUpValue] = useState(1);
  const [followUpUnit, setFollowUpUnit] = useState<"days" | "weeks" | "months">("days");
  const [followUpNotes, setFollowUpNotes] = useState("");

  const { data: patientsData, isLoading: loadingPatients, isFetching: isSearching } = useGetPatientsQuery({
    search: debouncedSearch,
    limit: 100,
  }, { skip: debouncedSearch.length > 0 && debouncedSearch.trim().length < 2 });
  const { data: profileResponse } = useGetDoctorProfileQuery(undefined);
  const [createPrescription, { isLoading: creating }] = useCreatePrescriptionMutation();

  const patients = patientsData?.data?.patients || [];

  useEffect(() => {
    if (patientIdFromQuery) {
      setSelectedPatient(patientIdFromQuery);
    }
    if (appointmentIdFromQuery) {
      setPrescriptionData((prev) => ({ ...prev, appointmentId: appointmentIdFromQuery }));
    }
  }, [patientIdFromQuery, appointmentIdFromQuery]);

  useEffect(() => {
    if (profileResponse?.data?.consultationFee) {
      setPrescriptionData((prev) => ({
        ...prev,
        consultationFee: Number(profileResponse.data.consultationFee) || 0,
      }));
    }
  }, [profileResponse]);

  const toMoneyNumber = (value: unknown) => {
    const normalized = Number(value);
    if (!Number.isFinite(normalized) || normalized < 0) return 0;
    return Math.round(normalized);
  };

  const handlePrescriptionReady = (parsed: ParsedPrescription) => {
    setPrescriptionData((prev) => ({
      ...prev,
      diagnosis: parsed.diagnosis || "",
      medicines: (parsed.medicines || []).map((medicine) => ({
        ...medicine,
        instructions: "",
      })),
      notes: parsed.notes || "",
      consultationFee: parsed.consultationFee ?? prev.consultationFee,
      medicineCost: parsed.medicineCost ?? prev.medicineCost,
    }));
    setStep("review");
  };

  const handleTranscriptReady = (transcript: string) => {
    setPrescriptionData((prev) => ({ ...prev, rawTranscript: transcript }));
  };

  const addMedicine = () => {
    setPrescriptionData((prev) => ({
      ...prev,
      medicines: [...prev.medicines, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }],
    }));
  };

  const removeMedicine = (index: number) => {
    setPrescriptionData((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
    setPrescriptionData((prev) => {
      const medicines = [...prev.medicines];
      medicines[index] = { ...medicines[index], [field]: value };
      return { ...prev, medicines };
    });
  };

  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast.error(t("doctor.appointments.adjustFilters"));
      return;
    }

    if (!user?.roles?.includes("doctor")) {
      toast.error(t("common.error"));
      router.push("/login");
      return;
    }

    const toastId = toast.loading(t("doctor.prescriptions.creatingPrescription"));

    try {
      await createPrescription({
        patientId: selectedPatient,
        ...prescriptionData,
        appointmentId: prescriptionData.appointmentId || null,
        followUp: shouldScheduleFollowUp ? {
          value: followUpValue,
          unit: followUpUnit,
          notes: followUpNotes,
        } : undefined,
      }).unwrap();

      toast.dismiss(toastId);
      setIsSuccessModalOpen(true);
    } catch (error: any) {
      const message = error?.data?.message || error?.message || "Operation failed";
      toast.error(message.includes("diagnosis") ? `${t("doctor.diagnosis")} is required.` : message, { id: toastId });
    }
  };

  return (
    <div className="min-h-screen pb-12 animate-in fade-in duration-500">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
          <div className="h-10 w-10 md:h-12 md:w-12 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <Mic className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          {t("doctor.prescriptions.voiceTranscription")}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm md:text-lg font-bold">
          {t("doctor.prescriptions.voiceDescription")}
        </p>
      </div>

      <div className="flex items-center gap-2 md:gap-4 mb-8 px-2 md:px-0">
        <div className={`flex items-center gap-1 md:gap-2 ${step === "select" ? "text-primary" : step === "record" || step === "review" ? "text-green-600" : "text-gray-500 dark:text-gray-400"}`}>
          <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base shrink-0 ${step === "select" ? "bg-primary text-white" : step === "record" || step === "review" ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
            1
          </div>
          <span className="font-semibold text-xs md:text-base hidden sm:inline">{t("doctor.prescriptions.selectPatient")}</span>
          <span className="font-semibold text-xs sm:hidden">{t("common.filter.all")}</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 min-w-5" />
        <div className={`flex items-center gap-1 md:gap-2 ${step === "record" ? "text-primary" : step === "review" ? "text-green-600" : "text-gray-500 dark:text-gray-400"}`}>
          <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base shrink-0 ${step === "record" ? "bg-primary text-white" : step === "review" ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
            2
          </div>
          <span className="font-semibold text-xs md:text-base">{t("doctor.prescriptions.record")}</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 min-w-5" />
        <div className={`flex items-center gap-1 md:gap-2 ${step === "review" ? "text-primary" : "text-gray-500 dark:text-gray-400"}`}>
          <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base shrink-0 ${step === "review" ? "bg-primary text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
            3
          </div>
          <span className="font-semibold text-xs md:text-base hidden sm:inline">{t("doctor.prescriptions.review")}</span>
          <span className="font-semibold text-xs sm:hidden">{t("doctor.prescriptions.review")}</span>
        </div>
      </div>

      {step === "select" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-6">{t("doctor.prescriptions.selectPatient")}</h2>
          {loadingPatients ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={t("doctor.prescriptions.placeholders.searchPatient")}
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl focus:border-primary focus:outline-none font-medium text-lg lg:text-xl transition-all"
                />
                {isSearching && <Loader className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 animate-spin text-[#00b495]" />}
              </div>
              {patientSearch.length > 0 && patientSearch.trim().length < 2 && (
                <p className="text-[#9ca3af] text-[12px] font-inter mt-[-16px] mb-4 ml-2">Type at least 2 characters to search</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-100 overflow-y-auto p-2 mb-6">
                {patients.length > 0 ? (
                  patients.map((patient: any) => (
                    <button
                      key={patient._id}
                      onClick={() => setSelectedPatient(patient._id)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${selectedPatient === patient._id ? "border-primary bg-primary/10 ring-4 ring-primary/10 shadow-md scale-[1.02]" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700"}`}
                    >
                      <div className="h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shrink-0">
                        {patient.photo ? <img src={patient.photo} alt="" className="h-full w-full object-cover rounded-full" /> : <User className="h-6 w-6 text-gray-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{patient.name}</p>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">{patient.email}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-full py-10 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <User className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 dark:text-slate-400 font-bold">{t("doctor.patients.noPatients")}</p>
                    <p className="text-xs text-slate-400 mt-1">{t("doctor.appointments.adjustFilters")}</p>
                  </div>
                )}
              </div>

              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-500 text-xs md:text-sm mb-4">{t("doctor.patients.notInList")}</p>
                <Link href="/dashboard/doctor/patients/new" className="inline-flex items-center gap-2 px-8 py-3 bg-gray-100 dark:bg-gray-700 text-primary rounded-xl text-base font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border-2 border-gray-200 dark:border-gray-600 shadow-sm">
                  <Plus className="h-5 w-5" />
                  {t("doctor.patients.addNewPatient")}
                </Link>
              </div>

              <div className="mt-6 w-full flex flex-col md:flex-row gap-4">
                <button
                  onClick={() => selectedPatient && setStep("record")}
                  disabled={!selectedPatient}
                  className="flex-1 flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 bg-primary text-white rounded-xl font-bold text-base md:text-lg hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  <Mic className="h-4 w-4 md:h-5 md:w-5" />
                  {t("doctor.prescriptions.continueToRecording")}
                </button>
                <button
                  onClick={() => selectedPatient && setStep("review")}
                  disabled={!selectedPatient}
                  className="flex-1 flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-base md:text-lg hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="h-4 w-4 md:h-5 md:w-5" />
                  {t("doctor.prescriptions.skipToManual")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {step === "record" && (
        <div className="space-y-4">
          <VoicePrescription onPrescriptionReady={handlePrescriptionReady} onTranscriptReady={handleTranscriptReady} />
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep("select")}
              className="px-6 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-semibold hover:border-primary hover:text-primary transition-all"
            >
              {t("common.back")}
            </button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">{t("doctor.diagnosis")}</label>
            <textarea
              value={prescriptionData.diagnosis}
              onChange={(e) => setPrescriptionData((prev) => ({ ...prev, diagnosis: e.target.value }))}
              className="w-full p-4 border-2 border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-[#e4e4e7] placeholder:text-gray-400 dark:placeholder:text-[#52525b] rounded-xl focus:border-primary focus:outline-none"
              rows={3}
              placeholder={t("doctor.prescriptions.placeholders.diagnosis")}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Pill className="h-6 w-6 text-primary" />
                {t("doctor.medicines")}
              </h3>
              <button onClick={addMedicine} className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-all">
                + {t("doctor.prescriptions.addMedicine")}
              </button>
            </div>

            <div className="space-y-4">
              {prescriptionData.medicines.map((med, index) => (
                <div key={index} className="p-5 bg-surface/30 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <span className="font-semibold text-gray-600 dark:text-gray-400">{t("prescription.medicine")} {index + 1}</span>
                    <button onClick={() => removeMedicine(index)} className="text-red-500 hover:text-red-700 transition-colors group">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder={t("prescription.medicine")} value={med.name} onChange={(e) => updateMedicine(index, "name", e.target.value)} className="p-3 border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-[#e4e4e7] placeholder:text-gray-400 dark:placeholder:text-[#52525b] rounded-lg focus:border-primary focus:outline-none" />
                    <input type="text" placeholder={t("prescription.dosage")} value={med.dosage} onChange={(e) => updateMedicine(index, "dosage", e.target.value)} className="p-3 border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-[#e4e4e7] placeholder:text-gray-400 dark:placeholder:text-[#52525b] rounded-lg focus:border-primary focus:outline-none" />
                    <input type="text" placeholder={t("prescription.frequency")} value={med.frequency} onChange={(e) => updateMedicine(index, "frequency", e.target.value)} className="p-3 border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-[#e4e4e7] placeholder:text-gray-400 dark:placeholder:text-[#52525b] rounded-lg focus:border-primary focus:outline-none" />
                    <input type="text" placeholder={t("prescription.duration")} value={med.duration} onChange={(e) => updateMedicine(index, "duration", e.target.value)} className="p-3 border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-[#e4e4e7] placeholder:text-gray-400 dark:placeholder:text-[#52525b] rounded-lg focus:border-primary focus:outline-none" />
                    <textarea placeholder={t("prescription.instructions")} value={med.instructions} onChange={(e) => updateMedicine(index, "instructions", e.target.value)} className="col-span-2 p-3 border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-[#e4e4e7] placeholder:text-gray-400 dark:placeholder:text-[#52525b] rounded-lg focus:border-primary focus:outline-none" rows={2} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-primary" />
              {t("doctor.prescriptions.billingConsultation")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 flex-1 w-full">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">{t("doctor.prescriptions.consultationFee")} ({t("common.pkr")})</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={prescriptionData.consultationFee}
                  onChange={(e) => setPrescriptionData((prev) => ({ ...prev, consultationFee: toMoneyNumber(e.target.value) }))}
                  className="flex h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/50 px-5 py-2 text-base text-slate-900 dark:text-slate-100 transition-all font-medium focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
                />
              </div>
              <div className="space-y-1.5 flex-1 w-full">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">{t("doctor.prescriptions.medicineCost")}</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={prescriptionData.medicineCost}
                  onChange={(e) => setPrescriptionData((prev) => ({ ...prev, medicineCost: toMoneyNumber(e.target.value) }))}
                  className="flex h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/50 px-5 py-2 text-base text-slate-900 dark:text-slate-100 transition-all font-medium focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
                />
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">{t("doctor.prescriptions.totalBilling")}</span>
              <span className="text-2xl font-black text-primary">{(Number(prescriptionData.consultationFee) + Number(prescriptionData.medicineCost)).toLocaleString(undefined, { maximumFractionDigits: 0 })} {t("common.pkr")}</span>
            </div>
          </div>

          {/* Follow-up reminder scheduling card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={shouldScheduleFollowUp}
                onChange={(e) => setShouldScheduleFollowUp(e.target.checked)}
                className="w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary cursor-pointer"
              />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">
                {t.raw('nav.navigation') === 'نیویگیشن' ? "اگلی اپائنٹمنٹ (فالو اپ) شیڈول کریں" : "Schedule a Follow-Up Visit"}
              </span>
            </label>

            {shouldScheduleFollowUp && (
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 animate-in slide-in-from-top-4 duration-200">
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    {t.raw('nav.navigation') === 'نیویگیشن' ? "فالو اپ کی مدت" : "Follow-Up Period"}
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={followUpValue}
                      onChange={(e) => setFollowUpValue(Number(e.target.value))}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white font-semibold text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      {[...Array(30)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>

                    <select
                      value={followUpUnit}
                      onChange={(e) => setFollowUpUnit(e.target.value as any)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white font-semibold text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      <option value="days">{t.raw('nav.navigation') === 'نیویگیشن' ? "دن" : "Days"}</option>
                      <option value="weeks">{t.raw('nav.navigation') === 'نیویگیشن' ? "ہفتے" : "Weeks"}</option>
                      <option value="months">{t.raw('nav.navigation') === 'نیویگیشن' ? "مہینے" : "Months"}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    {t.raw('nav.navigation') === 'نیویگیشن' ? "فالو اپ کے نوٹس" : "Follow-Up Notes"}
                  </span>
                  <textarea
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder={t.raw('nav.navigation') === 'نیویگیشن' ? "مثال کے طور پر: براہ کرم تازہ ترین لیب رپورٹس ساتھ لائیں۔" : "e.g., Please bring latest lab reports"}
                    className="w-full min-h-[80px] p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-950 dark:text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">{t("doctor.notes")}</label>
            <textarea
              value={prescriptionData.notes}
              onChange={(e) => setPrescriptionData((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full p-4 border-2 border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-[#e4e4e7] placeholder:text-gray-400 dark:placeholder:text-[#52525b] rounded-xl focus:border-primary focus:outline-none"
              rows={4}
              placeholder={t("doctor.notes")}
            />
          </div>

          {prescriptionData.rawTranscript && (
            <div className="bg-surface/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">{t("doctor.prescriptions.originalTranscript")}</h4>
              <p className="text-gray-900 dark:text-gray-100">{prescriptionData.rawTranscript}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-4">
            <button onClick={() => setStep("record")} className="px-8 py-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-semibold hover:border-primary hover:text-primary transition-all">
              {t("common.back")}
            </button>
            <button onClick={handleSubmit} disabled={creating} className="px-8 py-4 bg-linear-to-r from-primary to-primary-hover text-white rounded-xl font-bold hover:shadow-2xl transition-all disabled:opacity-50 flex items-center gap-2">
              {creating ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5" />
                  {t("doctor.prescriptions.createPrescription")}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          if (appointmentIdFromQuery) {
            router.push("/dashboard/doctor/appointments");
          } else {
            router.push("/dashboard/doctor/prescriptions");
          }
        }}
        title={t("doctor.prescriptions.successTitle")}
        message={t("doctor.prescriptions.successMsg")}
        actionText={t("common.back")}
      />
    </div>
  );
}

export default function NewPrescriptionPage() {
  const t = useTranslations();

  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-primary">
            <Loader className="h-8 w-8 animate-spin" />
            <p className="font-bold tracking-widest uppercase text-sm">{t("common.loading")}</p>
          </div>
        </div>
      }
    >
      <NewPrescriptionInner />
    </Suspense>
  );
}
