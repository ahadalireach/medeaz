"use client";
 
import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useTranslations, useLocale } from "next-intl";
import {
  Ticket,
  User,
  Phone,
  Mail,
  Play,
  AlertCircle,
  Check,
  ChevronRight,
  Share2,
  Sparkles,
  X
} from "lucide-react";
import { toast } from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { socket } from "@/lib/socket";
import {
  useGetDoctorsQuery,
  useGetOPDQueueQuery,
  useIssueTokenMutation,
  useCallTokenMutation,
  useCompleteTokenMutation,
  useSkipTokenMutation,
  useGetSettingsQuery,
  useGetAppointmentsQuery
} from "@/store/api/clinicApi";
import type { RootState } from "@/store/store";
import PageHeader from "@/components/shared/PageHeader";
 
export default function OPDQueuePage() {
  const t = useTranslations("opdQueue");
  const user = useSelector((state: RootState) => state.auth.user);
 
  const locale = useLocale();
  const isUrdu = locale === "ur";
 
  // States
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // all | waiting | called | completed | skipped
  const [forceAssign, setForceAssign] = useState(false);
 
  // Get today's date in local YYYY-MM-DD format
  const todayStr = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);
 
  // Fetch today's appointments for the selected doctor
  const { data: appointmentsData, isLoading: isLoadingAppts } = useGetAppointmentsQuery(
    { 
      doctorId: selectedDoctor, 
      from: todayStr, 
      to: todayStr, 
      limit: 100 
    },
    { skip: !selectedDoctor }
  );
 
  // Filter out completed/cancelled appointments so only confirmed/pending ones are listed
  const appointmentsToday = useMemo(() => {
    return (appointmentsData?.data?.appointments || []).filter(
      (appt: any) => appt.status === "confirmed" || appt.status === "pending"
    );
  }, [appointmentsData]);
 
  // Reset selected patient when selected doctor changes
  useEffect(() => {
    setSelectedAppointmentId("");
  }, [selectedDoctor]);
 
  // Last issued token overlay info
  const [issuedTokenInfo, setIssuedTokenInfo] = useState<any>(null);
 
  // Get active doctors in this clinic
  const { data: doctorsData, isLoading: isLoadingDocs } = useGetDoctorsQuery({ limit: 100 });
  const doctorsList = doctorsData?.data?.doctors || [];
 
  // Get clinic settings to resolve clinicId
  const { data: settingsData } = useGetSettingsQuery(undefined);
  const clinicId = settingsData?.data?._id;
 
  // Filter params for OPD list
  const filterParams = {
    doctorId: "all",
    status: activeTab === "all" ? undefined : activeTab
  };
 
  // Get today's queue
  const { data: queueData, isLoading: isLoadingQueue, refetch } = useGetOPDQueueQuery(filterParams);
  const queueTokens = queueData?.data?.tokens || [];
  const queueStats = queueData?.data?.stats || { total: 0, waiting: 0, done: 0 };
 
  // Mutations
  const [issueToken, { isLoading: isIssuing }] = useIssueTokenMutation();
  const [callToken] = useCallTokenMutation();
  const [completeToken] = useCompleteTokenMutation();
  const [skipToken] = useSkipTokenMutation();
 
  // Helper to format doctor names nicely (prevents double "Dr." prepends)
  const formatDoctorName = (name: string) => {
    if (!name || name.trim() === "" || name.toLowerCase() === "doctor" || name === "ڈاکٹر") {
      return isUrdu ? "ڈاکٹر" : "Doctor";
    }
    const cleanName = name.replace(/^(dr\.?\s*)+/i, "").replace(/^(ڈاکٹر\s*)+/, "").trim();
    return isUrdu ? `ڈاکٹر ${cleanName}` : `Dr. ${cleanName}`;
  };
 
  // Socket IO setup
  useEffect(() => {
    if (!clinicId) return;
 
    if (!socket.connected) {
      socket.connect();
    }
 
    const onConnect = () => {
      socket.emit("join_opd", clinicId);
      console.log("Socket connected & joined room:", clinicId);
    };
 
    socket.on("connect", onConnect);
    if (socket.connected) {
      onConnect();
    }
 
    // Listen for queue updates
    const handleTokenIssued = () => {
      refetch();
    };
 
    const handleTokenCalled = (data: any) => {
      refetch();
      toast.success(
        isUrdu
          ? `ٹوکن #${data.tokenNumber} (${data.patientName}) کو ${formatDoctorName(data.doctorName)} کے لیے بلایا گیا ہے۔`
          : `Token #${data.tokenNumber} (${data.patientName}) called for ${formatDoctorName(data.doctorName)}`
      );
    };
 
    const handleTokenCompleted = () => {
      refetch();
    };
 
    const handleTokenSkipped = () => {
      refetch();
    };
 
    socket.on("opd_token_issued", handleTokenIssued);
    socket.on("opd_token_called", handleTokenCalled);
    socket.on("opd_token_completed", handleTokenCompleted);
    socket.on("opd_token_skipped", handleTokenSkipped);
 
    return () => {
      socket.off("connect", onConnect);
      socket.off("opd_token_issued", handleTokenIssued);
      socket.off("opd_token_called", handleTokenCalled);
      socket.off("opd_token_completed", handleTokenCompleted);
      socket.off("opd_token_skipped", handleTokenSkipped);
    };
  }, [clinicId, refetch, isUrdu]);
 
  // Auto-dismiss issued token popup
  useEffect(() => {
    if (issuedTokenInfo) {
      const timer = setTimeout(() => {
        setIssuedTokenInfo(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [issuedTokenInfo]);
 
  // Handle Token Issue
  const handleIssueTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) {
      toast.error(t("selectDoctorErr") || "Please select a doctor");
      return;
    }
    if (!selectedAppointmentId) {
      toast.error(isUrdu ? "براہ کرم اپائنٹمنٹ لسٹ سے ایک مریض کا انتخاب کریں۔" : "Please select a patient from the appointment list");
      return;
    }
 
    const selectedAppt = appointmentsToday.find((appt: any) => appt._id === selectedAppointmentId);
    if (!selectedAppt) {
      toast.error(isUrdu ? "منتخب کردہ اپائنٹمنٹ نہیں ملی" : "Selected appointment not found");
      return;
    }
 
    const pName = selectedAppt.patientId?.name || (isUrdu ? "مریض" : "Patient");
    const pPhone = selectedAppt.patientId?.phone || "";
    const pEmail = selectedAppt.patientId?.email || "";
 
    try {
      const res = await issueToken({
        doctorId: selectedDoctor,
        patientName: pName,
        patientPhone: pPhone || undefined,
        patientEmail: pEmail || undefined
      }).unwrap();
 
      const doctorName = res.data?.doctorId?.doctorProfile?.fullName || res.data?.doctorId?.name || "Doctor";
      setIssuedTokenInfo({
        tokenNumber: res.data?.tokenNumber,
        patientName: res.data?.patientName,
        doctorName
      });
 
      // Clear selection
      setSelectedAppointmentId("");
      toast.success(isUrdu ? `ٹوکن #${res.data?.tokenNumber} کامیابی سے جاری ہو گیا!` : `Token #${res.data?.tokenNumber} issued successfully!`);
    } catch (err: any) {
      toast.error(err?.data?.message || (isUrdu ? "ٹوکن جاری کرنے میں ناکامی" : "Failed to issue token"));
    }
  };
 
  // Call specific token
  const handleCallToken = async (tokenId: string) => {
    try {
      await callToken({ tokenId, filterParams }).unwrap();
    } catch (err: any) {
      toast.error(err?.data?.message || (isUrdu ? "پہلے سے ہی بلایا جا چکا ہے یا غیر دستیاب ہے" : "Already called or unavailable"));
    }
  };
 
  // Complete specific token
  const handleCompleteToken = async (tokenId: string) => {
    try {
      await completeToken({ tokenId, filterParams }).unwrap();
      toast.success(isUrdu ? "ٹوکن مکمل نشان زد کر دیا گیا۔" : "Token marked completed.");
    } catch (err: any) {
      toast.error(err?.data?.message || (isUrdu ? "ٹوکن مکمل نہیں کیا جا سکا" : "Could not complete token"));
    }
  };

  // Skip specific token
  const handleSkipToken = async (tokenId: string) => {
    try {
      await skipToken({ tokenId, filterParams }).unwrap();
      toast.success(isUrdu ? "ٹوکن چھوڑ دیا گیا اور فہرست کے آخر میں منتقل کر دیا گیا۔" : "Token skipped and moved to the bottom of the list");
    } catch (err: any) {
      toast.error(err?.data?.message || (isUrdu ? "ٹوکن نہیں چھوڑا جا سکا" : "Could not skip token"));
    }
  };

  // Call Next Token
  const handleCallNextToken = async () => {
    const nextWaitingToken = queueTokens.find((t: any) => t.status === "waiting");
    if (!nextWaitingToken) {
      toast.error(isUrdu ? "آج کی قطار میں انتظار کرنے والا کوئی ٹوکن نہیں ہے" : "No waiting tokens in today's queue");
      return;
    }
    await handleCallToken(nextWaitingToken._id);
  };

  // Generate Waiting Room display link
  const getDisplayLink = () => {
    if (typeof window !== "undefined" && clinicId) {
      return `${window.location.origin}/display/${clinicId}/opd-queue`;
    }
    return "";
  };

  const handleCopyDisplayLink = () => {
    const link = getDisplayLink();
    if (link) {
      navigator.clipboard.writeText(link);
      toast.success(isUrdu ? "پبلک ڈسپلے بورڈ کا لنک کاپی ہو گیا!" : "Public Display Board link copied!");
    } else {
      toast.error(isUrdu ? "کلینک کی ترتیبات ابھی لوڈ نہیں ہوئیں" : "Clinic settings not loaded yet");
    }
  };
 
  const tabs = [
    { key: "all", label: t("allTokens") },
    { key: "waiting", label: t("waiting") },
    { key: "called", label: t("called") },
    { key: "completed", label: t("completed") },
    { key: "skipped", label: t("skipped") }
  ];
 
  return (
    <div className="space-y-8 pb-16">
      <PageHeader 
        title={
          <div className={`flex items-center gap-2 ${isUrdu ? 'flex-row-reverse' : ''}`}>
            <Ticket className="w-6 h-6 text-[#00b495]" />
            <span>{t("title")}</span>
          </div>
        }
        description={t("subtitle")}
        action={
          <div className={`flex items-center gap-2.5 ${isUrdu ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={handleCopyDisplayLink}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t("waitingTvLink")}</span>
            </button>
   
            {getDisplayLink() && (
              <a
                href={getDisplayLink()}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-all shadow-sm ${isUrdu ? 'flex-row-reverse' : ''}`}
              >
                <span>{t("launchDisplay")}</span>
                <ChevronRight className={`w-3.5 h-3.5 ${isUrdu ? 'rotate-185' : ''}`} />
              </a>
            )}
          </div>
        }
      />

      {/* Main Grid */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start ${isUrdu ? 'direction-rtl' : ''}`}>
        {/* Left Column: Issue Token Form & Counter */}
        <div className="lg:col-span-4 space-y-6">
          {/* Issue Token Card */}
          <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
            <h3 className={`text-sm font-bold text-slate-800 mb-4 flex items-center gap-1.5 ${isUrdu ? 'flex-row-reverse' : ''}`}>
              <Sparkles className="w-4 h-4 text-[#00b495]" />
              <span>{t("issueToken")}</span>
            </h3>
 
            {doctorsList.length === 0 && !isLoadingDocs ? (
              <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-red-700">{isUrdu ? "کوئی ڈاکٹر فعال نہیں ہے" : "No Doctors Active"}</p>
                <p className="text-[11px] text-red-500 mt-0.5">
                  {isUrdu ? "او پی ڈی قطار استعمال کرنے کے لیے اپنے کلینک میں فعال ڈاکٹروں کو شامل کریں۔" : "Add active doctors to your clinic to use the OPD Queue."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleIssueTokenSubmit} className="space-y-4">
                {/* Doctor Selection */}
                <div>
                  <div className={`flex items-center justify-between mb-1.5 ${isUrdu ? 'flex-row-reverse' : ''}`}>
                    <label className="text-xs font-bold text-slate-700 block">
                      {t("selectDoctor")}
                    </label>
                    <label className={`text-[10px] text-slate-500 flex items-center gap-1 cursor-pointer select-none ${isUrdu ? 'flex-row-reverse' : ''}`}>
                      <input
                        type="checkbox"
                        checked={forceAssign}
                        onChange={(e) => setForceAssign(e.target.checked)}
                        className="rounded border-slate-300 text-[#00b495] focus:ring-[#00b495] w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>{isUrdu ? "زبردستی اوور رائڈ کریں" : "Force Override"}</span>
                    </label>
                  </div>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className={`w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-medium text-slate-800 focus:outline-none focus:border-[#00b495] focus:bg-white transition-all ${isUrdu ? 'text-right' : ''}`}
                    required
                  >
                    <option value="">{t("chooseDoctor")}</option>
                    {doctorsList
                      .filter((doc: any) => forceAssign || !doc.availabilityStatus || doc.availabilityStatus === "available")
                      .map((doc: any) => {
                        const name = doc.fullName || doc.userId?.name || "Doctor";
                        const spec = doc.specialization || "General Physician";
                        const status = doc.availabilityStatus || "available";
                        const statusLabelMap: Record<string, string> = {
                          available: "دستیاب",
                          busy: "مصروف",
                          "on-leave": "رخصت پر"
                        };
                        const statusText = status !== "available" 
                          ? ` (${isUrdu ? (statusLabelMap[status] || status) : status.toUpperCase()})` 
                          : "";
                        return (
                          <option key={doc.userId?._id} value={doc.userId?._id}>
                            {formatDoctorName(name)} ({spec}){statusText}
                          </option>
                        );
                      })}
                  </select>
                </div>
 
                {/* Patient List Section */}
                <div className="space-y-3 pt-1">
                  <label className={`text-xs font-black text-slate-700 block ${isUrdu ? 'text-right' : ''}`}>
                    {isUrdu ? "آج کے مریضوں کی فہرست" : "Today's Appointment Patients"}
                  </label>
 
                  {!selectedDoctor ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center text-xs font-semibold text-slate-500">
                      {isUrdu 
                        ? "آج کی اپائنٹمنٹس لوڈ کرنے کے لیے براہ کرم ڈاکٹر کو منتخب کریں۔" 
                        : "Please select a doctor to load today's appointments."}
                    </div>
                  ) : isLoadingAppts ? (
                    <div className="py-8 text-center text-xs font-medium text-slate-400 flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#00b495] border-t-transparent rounded-full animate-spin" />
                      <span>{isUrdu ? "مریضوں کی فہرست لوڈ ہو رہی ہے..." : "Loading today's patients..."}</span>
                    </div>
                  ) : appointmentsToday.length === 0 ? (
                    <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center">
                      <p className="text-xs font-bold text-slate-700">
                        {isUrdu ? "آج کوئی اپائنٹمنٹ نہیں ہے" : "No appointments for today"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        {isUrdu 
                          ? "اس ڈاکٹر کے لیے آج کوئی تصدیق شدہ اپائنٹمنٹ شیڈول نہیں ہے۔" 
                          : "There are no active appointments scheduled for this doctor today."}
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[240px] overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
                      {appointmentsToday.map((appt: any) => {
                        const isSelected = selectedAppointmentId === appt._id;
                        const apptTime = new Date(appt.dateTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        });
                        const pName = appt.patientId?.name || (isUrdu ? "مریض" : "Patient");
                        const pEmail = appt.patientId?.email || "";
 
                        return (
                          <div
                            key={appt._id}
                            onClick={() => setSelectedAppointmentId(appt._id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? "bg-[#e6f8f4]/60 border-[#00b495] shadow-xs"
                                : "bg-slate-50 hover:bg-slate-100/75 border-slate-200"
                            } ${isUrdu ? 'flex-row-reverse text-right' : ''}`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-bold truncate ${isSelected ? "text-[#00b495]" : "text-slate-800"}`}>
                                {pName}
                              </p>
                              {pEmail && (
                                <p className="text-[10px] text-slate-400 truncate mt-0.5 font-semibold">
                                  {pEmail}
                                </p>
                              )}
                            </div>
                            <div className={`text-right shrink-0 flex flex-col items-end gap-1 ${isUrdu ? 'items-start' : ''}`}>
                              <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md" dir="ltr">
                                {apptTime}
                              </span>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? "border-[#00b495] bg-[#00b495]" : "border-slate-300 bg-white"
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
 
                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isIssuing || doctorsList.length === 0 || !selectedAppointmentId}
                  className={`w-full py-2.5 bg-[#00b495] hover:bg-[#009b80] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-teal-500/10 cursor-pointer ${isUrdu ? 'flex-row-reverse' : ''}`}
                >
                  <Ticket className="w-4 h-4" />
                  <span>{isIssuing ? t("issuingToken") : t("issueTokenBtn")}</span>
                </button>
              </form>
            )}
          </div>
 
          {/* OPD Token Issued Confirmation Card */}
          <AnimatePresence>
            {issuedTokenInfo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="bg-teal-50 border border-[#00b495]/20 rounded-2xl p-5 text-center relative shadow-lg"
              >
                <button
                  onClick={() => setIssuedTokenInfo(null)}
                  className={`absolute top-3 text-teal-600 hover:text-teal-800 ${isUrdu ? 'left-3' : 'right-3'}`}
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="w-10 h-10 bg-[#00b495]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-5 h-5 text-[#00b495]" />
                </div>
                <p className="text-[11px] font-bold text-teal-600 uppercase tracking-widest">
                  {t("tokenIssuedSuccess")}
                </p>
                <h2 className="text-6xl font-black text-[#00b495] font-display my-2 leading-none" dir="ltr">
                  #{issuedTokenInfo.tokenNumber}
                </h2>
                <p className="text-xs font-bold text-slate-800">
                  {issuedTokenInfo.patientName}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {t("assignedTo")} <span className="font-semibold text-teal-600">{formatDoctorName(issuedTokenInfo.doctorName)}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
 
          {/* Today's Counter Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white">
            <h4 className={`text-xs font-bold text-white uppercase tracking-widest mb-3 ${isUrdu ? 'text-right' : ''}`} style={{ color: "white" }}>
              {t("todayQueueAnalytics")}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <span className="text-lg font-black block text-teal-400">{queueStats.total}</span>
                <span className="text-[10px] font-semibold text-white">{t("totalIssued")}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <span className="text-lg font-black block text-amber-400">{queueStats.waiting}</span>
                <span className="text-[10px] font-semibold text-white">{t("waiting")}</span>
              </div>
              <div className="bg-white/5 rounded-xl p-3 text-center">
                <span className="text-lg font-black block text-emerald-400">{queueStats.done}</span>
                <span className="text-[10px] font-semibold text-white">{t("completed")}</span>
              </div>
            </div>
          </div>
        </div>
 
        {/* Right Column: Queue Listing & Filter */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
            {/* Table Header Section */}
            <div className={`p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isUrdu ? 'sm:flex-row-reverse' : ''}`}>
              <div className={isUrdu ? 'text-right' : 'text-left'}>
                <h3 className="text-sm font-bold text-slate-800">{t("queueManagement")}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t("queueSubtitle")}
                </p>
              </div>
 
              <button
                onClick={handleCallNextToken}
                className={`flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer ${isUrdu ? 'flex-row-reverse' : ''} ${queueStats.waiting === 0
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200"
                  : "bg-[#00b495] hover:bg-[#009b80] text-white shadow-teal-500/10"
                  }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t("callNextToken")}</span>
              </button>
            </div>
 
            {/* Filter Tabs */}
            <div className={`bg-slate-50 border-b border-slate-100 px-4 py-2 flex flex-wrap gap-1.5 ${isUrdu ? 'flex-row-reverse' : ''}`}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isActive
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-150"
                      }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
 
            {/* Table / List */}
            {isLoadingQueue ? (
              <div className="py-20 text-center text-xs font-medium text-slate-400">
                {t("loadingQueue")}
              </div>
            ) : queueTokens.length === 0 ? (
              <div className="py-24 text-center max-w-sm mx-auto">
                <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-700">{t("noTokensFound")}</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal text-center">
                  {t("noTokensMatching")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" dir={isUrdu ? "rtl" : "ltr"}>
                  <thead>
                    <tr className={`bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-100 ${isUrdu ? 'text-right' : 'text-left'}`}>
                      <th className="px-5 py-3">{t("tokenHash")}</th>
                      <th className="px-5 py-3">{t("patientName")}</th>
                      <th className="px-5 py-3">{t("assignedDoctor")}</th>
                      <th className="px-5 py-3">{t("issuedAt")}</th>
                      <th className="px-5 py-3">{t("status")}</th>
                      <th className={`px-5 py-3 ${isUrdu ? 'text-left' : 'text-right'}`}>{t("actions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {queueTokens.map((tok: any) => {
                      const issuedTime = new Date(tok.issuedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      });
                      const doctorName = tok.doctorId?.doctorProfile?.fullName || tok.doctorId?.name || (isUrdu ? "ڈاکٹر" : "Doctor");
 
                      return (
                        <tr key={tok._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <span className="font-display font-black text-sm text-[#00b495]" dir="ltr">
                              #{tok.tokenNumber}
                            </span>
                          </td>
                          <td className={`px-5 py-4 ${isUrdu ? 'text-right' : 'text-left'}`}>
                            <div>
                              <p className="font-bold text-slate-800">{tok.patientName}</p>
                              <div className={`flex flex-col gap-0.5 mt-1 ${isUrdu ? 'items-start' : 'items-start'}`}>
                                {tok.patientPhone && (
                                  <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1" dir="ltr">
                                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                    {tok.patientPhone}
                                  </p>
                                )}
                                {tok.patientEmail && (
                                  <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1" dir="ltr">
                                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                    {tok.patientEmail}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className={`px-5 py-4 ${isUrdu ? 'text-right' : 'text-left'}`}>
                            <span className="font-bold text-slate-800">{formatDoctorName(doctorName)}</span>
                          </td>
                          <td className="px-5 py-4 text-slate-500 font-medium" dir="ltr">{issuedTime}</td>
                          <td className={`px-5 py-4 ${isUrdu ? 'text-right' : 'text-left'}`}>
                            {tok.status === "waiting" && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                {t("waiting")}
                              </span>
                            )}
                            {tok.status === "called" && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 animate-pulse">
                                {t("called")}
                              </span>
                            )}
                            {tok.status === "completed" && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                {t("completed")}
                              </span>
                            )}
                            {tok.status === "skipped" && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                {t("skipped")}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className={`flex items-center gap-1.5 ${isUrdu ? 'justify-start' : 'justify-end'}`}>
                              {/* Call / Recall */}
                              {(tok.status === "waiting" || tok.status === "skipped") && (
                                <button
                                  onClick={() => handleCallToken(tok._id)}
                                  className="px-2.5 py-1.5 bg-[#00b495]/10 text-[#00b495] hover:bg-[#00b495] hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer border-none"
                                >
                                  {t("call")}
                                </button>
                              )}
 
                              {tok.status === "called" && (
                                <>
                                  <button
                                    onClick={() => handleCompleteToken(tok._id)}
                                    className="px-2.5 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-[10px] font-bold transition-all shadow-sm cursor-pointer border-none"
                                  >
                                    {t("complete")}
                                  </button>
                                  <button
                                    onClick={() => handleSkipToken(tok._id)}
                                    className="px-2.5 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer border-none"
                                  >
                                    {t("skip")}
                                  </button>
                                  <button
                                    onClick={() => handleCallToken(tok._id)}
                                    className="px-2.5 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer border-none"
                                  >
                                    {t("recall")}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
