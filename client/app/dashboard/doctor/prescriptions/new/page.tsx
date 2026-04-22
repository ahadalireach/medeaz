"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useGetPatientsQuery, useCreatePrescriptionMutation, useGetDoctorProfileQuery } from "@/store/api/doctorApi";
import { toast } from "react-hot-toast";
import { SuccessModal } from "@/components/ui/SuccessModal";
import { Mic, MicOff, Loader, User, Pill, FileText, Sparkles, ArrowRight, Trash2, Search, Plus } from "lucide-react";
import TrashIcon from "@/icons/trash-icon";
import { Button } from "@/components/ui/Button";
import { Suspense } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSelector } from "react-redux";

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
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState(patientIdFromQuery || "");
  const [prescriptionData, setPrescriptionData] = useState<any>({
    diagnosis: "",
    medicines: [],
    notes: "",
    rawTranscript: "",
    consultationFee: 0,
    medicineCost: 0,
    appointmentId: appointmentIdFromQuery || "",
  });
  const [patientSearch, setPatientSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const toMoneyNumber = (value: unknown) => {
    const normalized = Number(value);
    if (!Number.isFinite(normalized) || normalized < 0) return 0;
    return Math.round(normalized * 100) / 100;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(patientSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [patientSearch]);

  useEffect(() => {
    if (patientIdFromQuery) {
      setSelectedPatient(patientIdFromQuery);
    }
    if (appointmentIdFromQuery) {
      setPrescriptionData((prev: any) => ({ ...prev, appointmentId: appointmentIdFromQuery }));
    }
  }, [patientIdFromQuery, appointmentIdFromQuery]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  const { data: patientsData, isLoading: loadingPatients, isFetching: isSearching } = useGetPatientsQuery({
    search: debouncedSearch,
    limit: 100
  });
  const { data: profileResponse } = useGetDoctorProfileQuery(undefined);
  const [createPrescription, { isLoading: creating }] = useCreatePrescriptionMutation();

  const patients = patientsData?.data?.patients || [];

  useEffect(() => {
    if (profileResponse?.data?.consultationFee) {
      setPrescriptionData((prev: any) => ({
        ...prev,
        consultationFee: profileResponse.data.consultationFee
      }));
    }
  }, [profileResponse]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);
      setLiveTranscript("");

      // Use browser Web Speech API for free on-device transcription (no API quota needed)
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = locale === "ur" ? "ur-PK" : "en-US";
        let finalText = "";

        recognition.onresult = (event: any) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalText += event.results[i][0].transcript + " ";
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setLiveTranscript(finalText + interim);
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);

        toast.success(t('doctor.prescriptions.recordingStarted'));
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error(t('doctor.schedule.unavailable')); // Or a better key if I had one
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setRecording(false);
      toast.success(t('doctor.prescriptions.recordingStopped'));
    }
  };

  const processVoicePrescription = async () => {
    if (!liveTranscript) {
      toast.error(t('ai.processingFailed'));
      return;
    }

    if (!user?.roles?.includes("doctor")) {
      toast.error(t('common.error'));
      router.push("/login");
      return;
    }

    const toastId = toast.loading(t('doctor.prescriptions.analyzing'));
    setProcessing(true);

    try {
      let token = localStorage.getItem("accessToken");

      if (!token) {
        toast.error(t('common.error'), { id: toastId });
        router.push("/login");
        return;
      }

      // Transcription is done by the browser (Web Speech API) — no audio upload needed.
      // Only call Gemini for medical text parsing.
      const parseRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api'}/ai/prescription/parse-enhanced`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: liveTranscript }),
        }
      );

      if (parseRes.status === 401) {
        toast.error(t('common.error'), { id: toastId });
        localStorage.clear();
        router.push("/login");
        return;
      }

      if (!parseRes.ok) {
        const errorData = await parseRes.json().catch(() => ({}));
        const errorMsg = errorData.message || "AI parsing failed";
        if (errorMsg.includes('429') || errorMsg.includes('Quota exceeded') || errorMsg.includes('RATE_LIMIT')) {
          throw new Error("Gemini API rate limit exceeded. Please wait a minute and try again.");
        }
        throw new Error(errorMsg);
      }

      const parseData = await parseRes.json();

      setPrescriptionData((prev: any) => ({
        ...prev,
        diagnosis: parseData.data.diagnosis || "",
        medicines: parseData.data.medicines || [],
        notes: parseData.data.notes || "",
        rawTranscript: liveTranscript,
      }));

      toast.success(t('toast.prescriptionSaved'), { id: toastId });
      setStep("review");
    } catch (error: any) {
      console.error("Error processing prescription:", error);
      toast.error(error.message || t('ai.processingFailed'), { id: toastId });
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast.error(t('doctor.appointments.adjustFilters')); // Or a better key
      return;
    }

    const toastId = toast.loading(t('doctor.prescriptions.creatingPrescription'));

    try {
      await createPrescription({
        patientId: selectedPatient,
        ...prescriptionData,
      }).unwrap();

      toast.dismiss(toastId);
      setIsSuccessModalOpen(true);
    } catch (error: any) {
      let message = error?.data?.message || error.message || "Operation failed";
      if (message.includes('Path `diagnosis` is required')) {
        message = t('form.required');
      }
      toast.error(message, { id: toastId });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const addMedicine = () => {
    setPrescriptionData({
      ...prescriptionData,
      medicines: [
        ...prescriptionData.medicines,
        { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
      ],
    });
  };

  const removeMedicine = (index: number) => {
    setPrescriptionData({
      ...prescriptionData,
      medicines: prescriptionData.medicines.filter((_: any, i: number) => i !== index),
    });
  };

  const updateMedicine = (index: number, field: string, value: string) => {
    const updated = [...prescriptionData.medicines];
    (updated[index] as any)[field] = value;
    setPrescriptionData({ ...prescriptionData, medicines: updated });
  };

  return (
    <div className="min-h-screen pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 md:gap-3">
          <div className="h-10 w-10 md:h-12 md:w-12 bg-primary rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <Mic className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          {t('doctor.prescriptions.voiceTranscription')}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm md:text-lg font-bold">
          {t('doctor.prescriptions.voiceDescription')}
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 md:gap-4 mb-8 px-2 md:px-0">
        <div className={`flex items-center gap-1 md:gap-2 ${step === "select" ? "text-primary" : step === "record" || step === "review" ? "text-green-600" : "text-gray-500 dark:text-gray-400"}`}>
          <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base shrink-0 ${step === "select" ? "bg-primary text-white" : step === "record" || step === "review" ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
            1
          </div>
          <span className="font-semibold text-xs md:text-base hidden sm:inline">{t('doctor.prescriptions.selectPatient')}</span>
          <span className="font-semibold text-xs sm:hidden">{t('common.filter')}</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 min-w-5"></div>
        <div className={`flex items-center gap-1 md:gap-2 ${step === "record" ? "text-primary" : step === "review" ? "text-green-600" : "text-gray-500 dark:text-gray-400"}`}>
          <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base shrink-0 ${step === "record" ? "bg-primary text-white" : step === "review" ? "bg-green-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
            2
          </div>
          <span className="font-semibold text-xs md:text-base">{t('doctor.prescriptions.record')}</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 min-w-5"></div>
        <div className={`flex items-center gap-1 md:gap-2 ${step === "review" ? "text-primary" : "text-gray-500 dark:text-gray-400"}`}>
          <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base shrink-0 ${step === "review" ? "bg-primary text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
            3
          </div>
          <span className="font-semibold text-xs md:text-base hidden sm:inline">{t('doctor.prescriptions.review')}</span>
          <span className="font-semibold text-xs sm:hidden">{t('doctor.prescriptions.review')}</span>
        </div>
      </div>

      {/* Step 1: Select Patient */}
      {step === "select" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('doctor.prescriptions.selectPatient')}</h2>
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
                  placeholder={t('patient.records.placeholders.title')}
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl focus:border-primary focus:outline-none font-medium text-lg lg:text-xl transition-all"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>

              {/* Patient Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-100 overflow-y-auto p-2 mb-6">
                {patients.length > 0 ? (
                  patients.map((patient: any) => (
                    <button
                      key={patient._id}
                      onClick={() => setSelectedPatient(patient._id)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${selectedPatient === patient._id
                        ? "border-primary bg-primary/10 ring-4 ring-primary/10 shadow-md scale-[1.02]"
                        : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                    >
                      <div className="h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center shrink-0">
                        {patient.photo ? (
                          <img src={patient.photo} alt="" className="h-full w-full object-cover rounded-full" />
                        ) : (
                          <User className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {patient.name}
                        </p>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                          {patient.email}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-full py-10 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <User className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 dark:text-slate-400 font-bold">{t('doctor.patients.noPatients')}</p>
                    <p className="text-xs text-slate-400 mt-1">{t('doctor.appointments.adjustFilters')}</p>
                  </div>
                )}
              </div>

              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-500 text-xs md:text-sm mb-4">{t('doctor.patients.notInList')}</p>
                <Link
                  href="/dashboard/doctor/patients/new"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gray-100 dark:bg-gray-700 text-primary rounded-xl text-base font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                >
                  <Plus className="h-5 w-5" />
                  {t('doctor.patients.addNewPatient')}
                </Link>
              </div>

              <div className="mt-6 w-full flex flex-col md:flex-row gap-4">
                <button
                  onClick={() => selectedPatient && setStep("record")}
                  disabled={!selectedPatient}
                  className="flex-1 flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 bg-primary text-white rounded-xl font-bold text-base md:text-lg hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  <Mic className="h-4 w-4 md:h-5 md:w-5" />
                  {t('doctor.prescriptions.continueToRecording')}
                </button>
                <button
                  onClick={() => {
                    if (selectedPatient) {
                      setStep("review");
                    }
                  }}
                  disabled={!selectedPatient}
                  className="flex-1 flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-base md:text-lg hover:border-primary hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="h-4 w-4 md:h-5 md:w-5" />
                  {t('doctor.prescriptions.skipToManual')}
                </button>
              </div>
            </div>
          )}
        </div >
      )}

      {/* Step 2: Record */}
      {step === "record" && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{t('doctor.prescriptions.record')}</h2>

            <div className="text-center py-12">
              {!audioBlob ? (
                <>
                  <div className={`mx-auto h-40 w-40 rounded-full flex items-center justify-center mb-6 transition-all ${recording ? "bg-red-100 dark:bg-red-900/30 animate-pulse" : "bg-primary/10 dark:bg-primary/20"}`}>
                    {recording ? (
                      <div className="relative">
                        <MicOff className="h-20 w-20 text-red-600" />
                        <div className="absolute -top-2 -right-2 h-4 w-4 bg-red-600 rounded-full animate-ping"></div>
                      </div>
                    ) : (
                      <Mic className="h-20 w-20 text-primary" />
                    )}
                  </div>

                  {recording && (
                    <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                      {formatTime(recordingTime)}
                    </div>
                  )}

                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {recording ? t('doctor.prescriptions.voiceDescription') : t('doctor.prescriptions.voiceTranscription')}
                  </p>

                  {/* Live transcript preview */}
                  {liveTranscript && (
                    <div className="mx-auto max-w-lg mb-6 p-4 bg-primary/10 dark:bg-primary/20 rounded-xl text-left border border-primary/30 dark:border-primary/40">
                      <p className="text-xs font-semibold text-primary mb-1">Live Transcript</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">{liveTranscript}</p>
                    </div>
                  )}

                  <button
                    onClick={recording ? stopRecording : startRecording}
                    className={`px-12 py-5 rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl ${recording ? "bg-red-500 hover:bg-red-600 text-white" : "bg-primary hover:bg-primary-hover text-white"}`}
                  >
                    {recording ? t('doctor.stopRecording') : t('doctor.startRecording')}
                  </button>
                </>
              ) : (
                <>
                  <div className="mx-auto h-40 w-40 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                    <Sparkles className="h-20 w-20 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('doctor.prescriptions.recordingComplete')}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {t('common.time')}: {formatTime(recordingTime)}
                  </p>
                  {liveTranscript && (
                    <div className="mx-auto max-w-lg mb-6 p-4 bg-primary/10 dark:bg-primary/20 rounded-xl text-left border border-primary/30 dark:border-primary/40">
                      <p className="text-xs font-semibold text-primary mb-1">Transcribed Text</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">{liveTranscript}</p>
                    </div>
                  )}
                  {!liveTranscript && (
                    <p className="text-amber-600 text-sm mb-4">
                      No transcript detected. Your browser may not support Speech Recognition. Try re-recording.
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => {
                        setAudioBlob(null);
                        setLiveTranscript("");
                        setRecordingTime(0);
                      }}
                      className="px-8 py-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-semibold hover:border-primary hover:text-primary transition-all"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={processVoicePrescription}
                      disabled={processing}
                      className="px-8 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
                    >
                      {processing ? (
                        <>
                          <Loader className="h-5 w-5 animate-spin" />
                          {t('doctor.prescriptions.analyzing')}
                        </>
                      ) : (
                        <>
                          {t('doctor.prescriptions.processWithAi')}
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      }

      {/* Step 3: Review */}
      {
        step === "review" && (
          <div className="space-y-6">
            {/* Diagnosis */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                {t('doctor.diagnosis')}
              </label>
              <textarea
                value={prescriptionData.diagnosis}
                onChange={(e) => setPrescriptionData({ ...prescriptionData, diagnosis: e.target.value })}
                className="w-full p-4 border-2 border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-[#e4e4e7] placeholder:text-gray-400 dark:placeholder:text-[#52525b] rounded-xl focus:border-primary focus:outline-none"
                rows={3}
                placeholder="Enter diagnosis..."
              />
            </div>

            {/* Medicines */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Pill className="h-6 w-6 text-primary" />
                  {t('doctor.medicines')}
                </h3>
                <button
                  onClick={addMedicine}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-all"
                >
                  + {t('doctor.prescriptions.addMedicine')}
                </button>
              </div>

              <div className="space-y-4">
                {prescriptionData.medicines.map((med: any, index: number) => (
                  <div key={index} className="p-5 bg-surface/30 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-4">
                      <span className="font-semibold text-gray-600 dark:text-gray-400">{t('prescription.medicine')} {index + 1}</span>
                      <button
                        onClick={() => removeMedicine(index)}
                        className="text-red-500 hover:text-red-700 transition-colors group"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder={t('prescription.medicine')}
                        value={med.name}
                        onChange={(e) => updateMedicine(index, "name", e.target.value)}
                        className="p-3 border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-[#e4e4e7] placeholder:text-gray-400 dark:placeholder:text-[#52525b] rounded-lg focus:border-primary focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder={t('prescription.dosage')}
                        value={med.dosage}
                        onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                        className="p-3 border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-[#e4e4e7] placeholder:text-gray-400 dark:placeholder:text-[#52525b] rounded-lg focus:border-primary focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder={t('prescription.frequency')}
                        value={med.frequency}
                        onChange={(e) => updateMedicine(index, "frequency", e.target.value)}
                        className="p-3 border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-[#e4e4e7] placeholder:text-gray-400 dark:placeholder:text-[#52525b] rounded-lg focus:border-primary focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder={t('prescription.duration')}
                        value={med.duration}
                        onChange={(e) => updateMedicine(index, "duration", e.target.value)}
                        className="p-3 border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-[#e4e4e7] placeholder:text-gray-400 dark:placeholder:text-[#52525b] rounded-lg focus:border-primary focus:outline-none"
                      />
                      <textarea
                        placeholder={t('prescription.instructions')}
                        value={med.instructions}
                        onChange={(e) => updateMedicine(index, "instructions", e.target.value)}
                        className="col-span-2 p-3 border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-[#e4e4e7] placeholder:text-gray-400 dark:placeholder:text-[#52525b] rounded-lg focus:border-primary focus:outline-none"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing Section (Added) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-6">
                <Sparkles className="h-6 w-6 text-primary" />
                {t('doctor.prescriptions.billingConsultation')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 flex-1 w-full">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {t('doctor.prescriptions.consultationFee')} ({t('common.pkr')})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={prescriptionData.consultationFee}
                    onChange={(e) => setPrescriptionData({ ...prescriptionData, consultationFee: toMoneyNumber(e.target.value) })}
                    className="flex h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/50 px-5 py-2 text-base text-slate-900 dark:text-slate-100 transition-all font-medium focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
                  />
                </div>
                <div className="space-y-1.5 flex-1 w-full">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                    {t('doctor.prescriptions.medicineCost')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={prescriptionData.medicineCost}
                    onChange={(e) => setPrescriptionData({ ...prescriptionData, medicineCost: toMoneyNumber(e.target.value) })}
                    className="flex h-12 w-full rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/50 px-5 py-2 text-base text-slate-900 dark:text-slate-100 transition-all font-medium focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
                  />
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">{t('doctor.prescriptions.totalBilling')}</span>
                <span className="text-2xl font-black text-primary">{toMoneyNumber(toMoneyNumber(prescriptionData.consultationFee) + toMoneyNumber(prescriptionData.medicineCost)).toLocaleString(undefined, { maximumFractionDigits: 2 })} {t('common.pkr')}</span>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                {t('doctor.notes')}
              </label>
              <textarea
                value={prescriptionData.notes}
                onChange={(e) => setPrescriptionData({ ...prescriptionData, notes: e.target.value })}
                className="w-full p-4 border-2 border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-[#e4e4e7] placeholder:text-gray-400 dark:placeholder:text-[#52525b] rounded-xl focus:border-primary focus:outline-none"
                rows={4}
                placeholder={t('doctor.notes')}
              />
            </div>

            {/* Transcript */}
            {prescriptionData.rawTranscript && (
              <div className="bg-surface/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">{t('doctor.prescriptions.originalTranscript')}</h4>
                <p className="text-gray-900 dark:text-gray-100 ">{prescriptionData.rawTranscript}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={() => setStep("record")}
                className="px-8 py-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-semibold hover:border-primary hover:text-primary transition-all"
              >
                {t('common.back')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={creating}
                className="px-8 py-4 bg-linear-to-r from-primary to-primary-hover text-white rounded-xl font-bold hover:shadow-2xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    {t('doctor.prescriptions.createPrescription')}
                  </>
                )}
              </button>
            </div>
          </div>
        )
      }
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
        title={t('doctor.prescriptions.successTitle')}
        message={t('doctor.prescriptions.successMsg')}
        actionText={t('common.back')}
      />
    </div >
  );
}

export default function NewPrescriptionPage() {
  const t = useTranslations();
  return (
    <Suspense fallback={
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-primary">
          <Loader className="h-8 w-8 animate-spin" />
          <p className="font-bold tracking-widest uppercase text-sm">{t('common.loading')}</p>
        </div>
      </div>
    }>
      <NewPrescriptionInner />
    </Suspense>
  );
}
