"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGetPatientsQuery, useCreatePrescriptionMutation } from "@/store/api/doctorApi";
import { toast } from "react-hot-toast";
import { Mic, MicOff, Loader, User, Pill, FileText, Sparkles, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NewPrescriptionPage() {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "record" | "review">("select");
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [prescriptionData, setPrescriptionData] = useState<any>({
    diagnosis: "",
    medicines: [],
    notes: "",
    rawTranscript: "",
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  const { data: patientsData, isLoading: loadingPatients } = useGetPatientsQuery({ limit: 100 });
  const [createPrescription, { isLoading: creating }] = useCreatePrescriptionMutation();

  const patients = patientsData?.data?.patients || [];

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
        recognition.lang = "en-US";
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

      toast.success("Recording started — speak clearly");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not access microphone. Please check permissions.");
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
      toast.success("Recording stopped");
    }
  };

  const processVoicePrescription = async () => {
    const transcript = liveTranscript.trim();
    if (!transcript) {
      toast.error("No speech detected. Please record again and speak clearly.");
      return;
    }

    const toastId = toast.loading("Analyzing prescription with AI...");
    setProcessing(true);

    try {
      let token = localStorage.getItem("accessToken");

      if (!token) {
        toast.error("Session expired. Please log in again.", { id: toastId });
        router.push("/login");
        return;
      }

      // Transcription is done by the browser (Web Speech API) — no audio upload needed.
      // Only call Gemini for medical text parsing.
      const parseRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/ai/prescription/parse-enhanced`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: transcript }),
        }
      );

      if (parseRes.status === 401) {
        toast.error("Session expired. Please log in again.", { id: toastId });
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

      setPrescriptionData({
        diagnosis: parseData.data.diagnosis || "",
        medicines: parseData.data.medicines || [],
        notes: parseData.data.notes || "",
        rawTranscript: transcript,
      });

      toast.success("Prescription processed successfully!", { id: toastId });
      setStep("review");
    } catch (error: any) {
      console.error("Error processing prescription:", error);
      toast.error(error.message || "Failed to process voice prescription", { id: toastId });
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast.error("Please select a patient");
      return;
    }

    const toastId = toast.loading("Creating prescription...");

    try {
      await createPrescription({
        patientId: selectedPatient,
        ...prescriptionData,
      }).unwrap();

      toast.success("Prescription created successfully!", { id: toastId });
      router.push("/dashboard/doctor/prescriptions");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create prescription", { id: toastId });
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
    updated[index][field] = value;
    setPrescriptionData({ ...prescriptionData, medicines: updated });
  };

  return (
    <div className="min-h-screen pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-black tracking-tight flex items-center gap-2 md:gap-3">
          <div className="h-10 w-10 md:h-12 md:w-12 bg-linear-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center shrink-0">
            <Mic className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          Voice Prescription
        </h1>
        <p className="text-text-secondary mt-2 text-sm md:text-lg">
          Create prescription using AI-powered voice transcription
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 md:gap-4 mb-8 px-2 md:px-0">
        <div className={`flex items-center gap-1 md:gap-2 ${step === "select" ? "text-primary" : step === "record" || step === "review" ? "text-green-600" : "text-text-muted"}`}>
          <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base shrink-0 ${step === "select" ? "bg-primary text-white" : step === "record" || step === "review" ? "bg-green-500 text-white" : "bg-surface text-text-muted"}`}>
            1
          </div>
          <span className="font-semibold text-xs md:text-base hidden sm:inline">Select Patient</span>
          <span className="font-semibold text-xs sm:hidden">Select</span>
        </div>
        <div className="flex-1 h-0.5 bg-border min-w-[20px]"></div>
        <div className={`flex items-center gap-1 md:gap-2 ${step === "record" ? "text-primary" : step === "review" ? "text-green-600" : "text-text-muted"}`}>
          <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base shrink-0 ${step === "record" ? "bg-primary text-white" : step === "review" ? "bg-green-500 text-white" : "bg-surface text-text-muted"}`}>
            2
          </div>
          <span className="font-semibold text-xs md:text-base">Record</span>
        </div>
        <div className="flex-1 h-0.5 bg-border min-w-[20px]"></div>
        <div className={`flex items-center gap-1 md:gap-2 ${step === "review" ? "text-primary" : "text-text-muted"}`}>
          <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base shrink-0 ${step === "review" ? "bg-primary text-white" : "bg-surface text-text-muted"}`}>
            3
          </div>
          <span className="font-semibold text-xs md:text-base hidden sm:inline">Review & Submit</span>
          <span className="font-semibold text-xs sm:hidden">Review</span>
        </div>
      </div>

      {/* Step 1: Select Patient */}
      {step === "select" && (
        <div className="bg-white rounded-2xl border border-border-light p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-black mb-4 md:mb-6">Select Patient</h2>
          {loadingPatients ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div>
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="w-full p-4 border-2 border-border-light rounded-xl text-base md:text-lg focus:border-primary focus:outline-none truncate"
              >
                <option value="">Choose a patient...</option>
                {patients.map((patient: any) => (
                  <option key={patient._id} value={patient._id} className="truncate">
                    {patient.name}
                  </option>
                ))}
              </select>
              
              {selectedPatient && (
                <div className="mt-3 p-3 bg-primary-bg rounded-lg">
                  <p className="text-sm text-text-secondary">Selected Patient:</p>
                  <p className="font-semibold text-black truncate">
                    {patients.find((p: any) => p._id === selectedPatient)?.name}
                  </p>
                  <p className="text-sm text-text-muted truncate">
                    {patients.find((p: any) => p._id === selectedPatient)?.email}
                  </p>
                </div>
              )}
              
              
              <div className="mt-4 text-center">
                <p className="text-text-muted text-xs md:text-sm mb-2">Patient not in the list?</p>
                <Link
                  href="/dashboard/doctor/patients"
                  className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-surface text-primary rounded-xl text-sm md:text-base font-semibold hover:bg-surface/70 transition-colors"
                >
                  <User className="h-4 w-4 md:h-5 md:w-5" />
                  Add New Patient
                </Link>
              </div>
              
              <button
                onClick={() => selectedPatient && setStep("record")}
                disabled={!selectedPatient}
                className="mt-6 w-full flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 bg-primary text-white rounded-xl font-bold text-base md:text-lg hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                Continue to Recording
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Record */}
      {step === "record" && (
        <div className="bg-white rounded-2xl border border-border-light p-8">
          <h2 className="text-2xl font-bold text-black mb-6">Record Prescription</h2>
          
          <div className="text-center py-12">
            {!audioBlob ? (
              <>
                <div className={`mx-auto h-40 w-40 rounded-full flex items-center justify-center mb-6 transition-all ${recording ? "bg-red-100 animate-pulse" : "bg-primary-bg"}`}>
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
                  <div className="text-4xl font-bold text-black mb-4">
                    {formatTime(recordingTime)}
                  </div>
                )}

                <p className="text-text-secondary mb-4">
                  {recording ? "Speak clearly about the prescription..." : "Click below to start recording"}
                </p>

                {/* Live transcript preview */}
                {liveTranscript && (
                  <div className="mx-auto max-w-lg mb-6 p-4 bg-primary-bg rounded-xl text-left border border-primary/20">
                    <p className="text-xs font-semibold text-primary mb-1">Live Transcript</p>
                    <p className="text-sm text-black leading-relaxed">{liveTranscript}</p>
                  </div>
                )}

                <button
                  onClick={recording ? stopRecording : startRecording}
                  className={`px-12 py-5 rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl ${recording ? "bg-red-500 hover:bg-red-600 text-white" : "bg-primary hover:bg-primary-hover text-white"}`}
                >
                  {recording ? "Stop Recording" : "Start Recording"}
                </button>
              </>
            ) : (
              <>
                <div className="mx-auto h-40 w-40 rounded-full bg-green-100 flex items-center justify-center mb-6">
                  <Sparkles className="h-20 w-20 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">Recording Complete!</h3>
                <p className="text-text-secondary mb-4">
                  Duration: {formatTime(recordingTime)}
                </p>
                {liveTranscript && (
                  <div className="mx-auto max-w-lg mb-6 p-4 bg-primary-bg rounded-xl text-left border border-primary/20">
                    <p className="text-xs font-semibold text-primary mb-1">Transcribed Text</p>
                    <p className="text-sm text-black leading-relaxed">{liveTranscript}</p>
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
                    className="px-8 py-4 border-2 border-border-light rounded-xl font-semibold hover:border-primary hover:text-primary transition-all"
                  >
                    Re-record
                  </button>
                  <button
                    onClick={processVoicePrescription}
                    disabled={processing}
                    className="px-8 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
                  >
                    {processing ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Process with AI
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === "review" && (
        <div className="space-y-6">
          {/* Diagnosis */}
          <div className="bg-white rounded-2xl border border-border-light p-6">
            <label className="block text-sm font-semibold text-text-secondary mb-3">
              Diagnosis
            </label>
            <textarea
              value={prescriptionData.diagnosis}
              onChange={(e) => setPrescriptionData({ ...prescriptionData, diagnosis: e.target.value })}
              className="w-full p-4 border-2 border-border-light rounded-xl focus:border-primary focus:outline-none"
              rows={3}
              placeholder="Enter diagnosis..."
            />
          </div>

          {/* Medicines */}
          <div className="bg-white rounded-2xl border border-border-light p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-black flex items-center gap-2">
                <Pill className="h-6 w-6 text-primary" />
                Medicines
              </h3>
              <button
                onClick={addMedicine}
                className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition-all"
              >
                + Add Medicine
              </button>
            </div>

            <div className="space-y-4">
              {prescriptionData.medicines.map((med: any, index: number) => (
                <div key={index} className="p-5 bg-surface/30 rounded-xl border border-border-light">
                  <div className="flex items-start justify-between mb-4">
                    <span className="font-semibold text-text-secondary">Medicine {index + 1}</span>
                    <button
                      onClick={() => removeMedicine(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Medicine name"
                      value={med.name}
                      onChange={(e) => updateMedicine(index, "name", e.target.value)}
                      className="p-3 border border-border-light rounded-lg focus:border-primary focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g., 500mg)"
                      value={med.dosage}
                      onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                      className="p-3 border border-border-light rounded-lg focus:border-primary focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Frequency (e.g., 3x daily)"
                      value={med.frequency}
                      onChange={(e) => updateMedicine(index, "frequency", e.target.value)}
                      className="p-3 border border-border-light rounded-lg focus:border-primary focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g., 7 days)"
                      value={med.duration}
                      onChange={(e) => updateMedicine(index, "duration", e.target.value)}
                      className="p-3 border border-border-light rounded-lg focus:border-primary focus:outline-none"
                    />
                    <textarea
                      placeholder="Instructions (e.g., After meals)"
                      value={med.instructions}
                      onChange={(e) => updateMedicine(index, "instructions", e.target.value)}
                      className="col-span-2 p-3 border border-border-light rounded-lg focus:border-primary focus:outline-none"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-border-light p-6">
            <label className="block text-sm font-semibold text-text-secondary mb-3">
              Additional Notes
            </label>
            <textarea
              value={prescriptionData.notes}
              onChange={(e) => setPrescriptionData({ ...prescriptionData, notes: e.target.value })}
              className="w-full p-4 border-2 border-border-light rounded-xl focus:border-primary focus:outline-none"
              rows={4}
              placeholder="Any additional instructions..."
            />
          </div>

          {/* Transcript */}
          {prescriptionData.rawTranscript && (
            <div className="bg-surface/50 rounded-2xl border border-border-light p-6">
              <h4 className="text-sm font-semibold text-text-secondary mb-3">Original Transcript</h4>
              <p className="text-text-primary italic">{prescriptionData.rawTranscript}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={() => setStep("record")}
              className="px-8 py-4 border-2 border-border-light rounded-xl font-semibold hover:border-primary hover:text-primary transition-all"
            >
              Back to Recording
            </button>
            <button
              onClick={handleSubmit}
              disabled={creating}
              className="px-8 py-4 bg-linear-to-r from-primary to-primary-hover text-white rounded-xl font-bold hover:shadow-2xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {creating ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5" />
                  Create Prescription
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
