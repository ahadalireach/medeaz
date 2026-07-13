"use client";
 
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Monitor, Volume2, Shield, Calendar, Users, RefreshCw } from "lucide-react";
import { socket } from "@/lib/socket";
 
interface CalledToken {
  tokenId: string;
  tokenNumber: number;
  patientName: string;
  doctorName: string;
}
 
interface UpNextToken {
  tokenNumber: number;
  patientName: string;
  doctorName: string;
}
 
export default function PublicDisplayBoard() {
  const { clinicId } = useParams();
  
  const [clinicName, setClinicName] = useState("Clinic");
  const [clinicLogo, setClinicLogo] = useState("");
  const [calledTokens, setCalledTokens] = useState<CalledToken[]>([]);
  const [upNext, setUpNext] = useState<UpNextToken[]>([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isUrdu, setIsUrdu] = useState(false);
 
  // Detect language preferences
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const lang = params.get("lang") || params.get("locale") || localStorage.getItem("locale") || "en";
      setIsUrdu(lang === "ur");
    }
  }, []);
 
  const formatDoctorName = (name: string) => {
    if (!name) return isUrdu ? "ڈاکٹر" : "Doctor";
    const cleanName = name.replace(/^(dr\.?\s*)+/i, "").replace(/^(ڈاکٹر\s*)+/, "").trim();
    return isUrdu ? `ڈاکٹر ${cleanName}` : `Dr. ${cleanName}`;
  };
 
  // Helper to validate ObjectId format
  const isValidObjectId = (id: any): id is string => {
    return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
  };
 
  // Fetch data from endpoint
  const fetchDisplayData = async () => {
    if (!isValidObjectId(clinicId)) return;
    try {
      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${BASE_URL}/opd-queue/display/${clinicId}`);
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.message || "Failed to load display board");
      }
      const json = await res.json();
      
      if (json?.data) {
        setClinicName(json.data.clinicName || "Clinic");
        setClinicLogo(json.data.clinicLogo || "");
        setCalledTokens(json.data.calledTokens || []);
        setUpNext(json.data.upNext || []);
        setErrorMsg("");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || (isUrdu ? "میڈ ایز قطار سرور سے دوبارہ جڑ رہا ہے..." : "Reconnecting to MedEaz Queue Server..."));
    }
  };
 
  // 1. Initial Load & Polling Fallback
  useEffect(() => {
    if (!isValidObjectId(clinicId)) return;
    fetchDisplayData();
 
    // Polling fallback every 10s
    const pollInterval = setInterval(() => {
      fetchDisplayData();
    }, 10000);
 
    return () => clearInterval(pollInterval);
  }, [clinicId, isUrdu]);
 
  // 2. Real-Time Socket Connection
  useEffect(() => {
    if (!isValidObjectId(clinicId)) return;
 
    if (!socket.connected) {
      socket.connect();
    }
 
    // Join room
    socket.emit("join_opd", clinicId);
    setIsSocketConnected(true);
 
    const handleQueueChange = () => {
      fetchDisplayData();
    };
 
    const handleTokenCalled = (data: any) => {
      // Audio chime on call
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
        audio.volume = 0.55;
        audio.play().catch(() => {});
      } catch (e) {}
 
      fetchDisplayData();
    };
 
    socket.on("opd_token_issued", handleQueueChange);
    socket.on("opd_token_called", handleTokenCalled);
    socket.on("opd_token_completed", handleQueueChange);
    socket.on("opd_token_skipped", handleQueueChange);
 
    // Socket status listeners
    const onConnect = () => setIsSocketConnected(true);
    const onDisconnect = () => setIsSocketConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
 
    return () => {
      socket.off("opd_token_issued", handleQueueChange);
      socket.off("opd_token_called", handleTokenCalled);
      socket.off("opd_token_completed", handleQueueChange);
      socket.off("opd_token_skipped", handleQueueChange);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [clinicId]);
 
  const slideTransition = {
    initial: { y: 60, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -60, opacity: 0 },
    transition: { type: "spring", stiffness: 100, damping: 15 }
  };
 
  return (
    <div className={`min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none overflow-hidden relative ${isUrdu ? 'rtl' : 'ltr'}`} dir={isUrdu ? "rtl" : "ltr"}>
      {/* Top Header */}
      <header className="px-8 py-5 border-b border-slate-200 flex items-center justify-between z-10 bg-white shadow-xs">
        <div className={`flex items-center gap-4 ${isUrdu ? 'flex-row-reverse' : ''}`}>
          {clinicLogo ? (
            <img 
              src={clinicLogo} 
              alt={clinicName} 
              className="w-12 h-12 object-contain rounded-xl border border-slate-100 p-1 bg-white" 
            />
          ) : null}
          <div className={isUrdu ? 'text-right' : 'text-left'}>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{clinicName}</h1>
            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-0.5">
              {isUrdu ? "لائیو او پی ڈی قطار بورڈ" : "Live OPD Queue Board"}
            </p>
          </div>
        </div>
 
        <button
          onClick={() => {
            const newIsUrdu = !isUrdu;
            setIsUrdu(newIsUrdu);
            if (typeof window !== "undefined") {
              localStorage.setItem("locale", newIsUrdu ? "ur" : "en");
            }
          }}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm cursor-pointer bg-white"
        >
          <span>{isUrdu ? "English" : "اردو"}</span>
        </button>
      </header>
 
      {errorMsg && (
        <div className="bg-amber-500 text-white px-8 py-2 text-center text-xs font-black tracking-wide z-20 shadow-sm flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>{errorMsg}</span>
        </div>
      )}
 
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center px-8 py-6">
        {calledTokens.length === 0 ? (
          /* Queue Clear State */
          <div className="text-center max-w-lg mx-auto py-12 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <div className="w-20 h-20 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Monitor className="w-9 h-9 text-[#00b495]" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#00b495] font-display">
              {isUrdu ? "قطار بالکل خالی ہے ✓" : "Queue Clear ✓"}
            </h2>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed font-medium">
              {isUrdu 
                ? "اس وقت کوئی فعال ٹوکن نہیں بلایا گیا۔ براہ کرم نشست سنبھالیں جب تک کہ استقبالیہ آپ کا نمبر نہ پکارے۔" 
                : "There are no active called tokens right now. Please have a seat until a receptionist calls your number."}
            </p>
          </div>
        ) : calledTokens.length === 1 ? (
          /* Single Doctor Called Token Layout */
          <div className="max-w-4xl mx-auto w-full text-center space-y-4">
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.25em]">
              {isUrdu ? "ابھی معائنہ جاری ہے" : "NOW SERVING"}
            </p>
 
            <div className="bg-white border border-slate-200 rounded-xl p-8 md:p-12 shadow-md relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#00b495]/5 via-transparent to-transparent pointer-events-none" />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={calledTokens[0].tokenNumber}
                  variants={slideTransition}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-4"
                >
                  <h2 className="text-8xl md:text-[140px] font-black text-[#00b495] tracking-tight leading-none select-none font-display" dir="ltr">
                    #{calledTokens[0].tokenNumber}
                  </h2>
                  <p className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
                    {calledTokens[0].patientName}
                  </p>
                  <div className="inline-flex items-center space-x-2 bg-teal-50 border border-teal-100 px-6 py-2.5 rounded-full text-lg font-bold text-[#00b495] mt-2">
                    <span>{formatDoctorName(calledTokens[0].doctorName)}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* Multi-Doctor Split Grid Layout */
          <div className="w-full space-y-6">
            <p className="text-center text-xs font-black text-slate-400 uppercase tracking-[0.25em]">
              {isUrdu ? "ابھی معائنہ جاری ہے" : "NOW SERVING"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              <AnimatePresence mode="popLayout">
                {calledTokens.map((tok) => (
                  <motion.div
                    key={tok.tokenId}
                    variants={slideTransition}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest block mb-2">
                        {isUrdu ? "فعال ٹوکن" : "Active Token"}
                      </span>
                      <h3 className="text-6xl font-black text-[#00b495] font-display leading-none" dir="ltr">
                        #{tok.tokenNumber}
                      </h3>
                      <p className="text-2xl font-black text-slate-900 mt-3 truncate">{tok.patientName}</p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 text-sm font-bold text-slate-500">
                      {formatDoctorName(tok.doctorName)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>
 
      {/* Bottom Up Next Section */}
      <footer className="bg-white border-t border-slate-200 py-6 px-8 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        <div className={`max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 ${isUrdu ? 'md:flex-row-reverse' : ''}`}>
          <div className={isUrdu ? 'text-right' : 'text-left'}>
            <h4 className={`text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ${isUrdu ? 'flex-row-reverse' : ''}`}>
              <Users className="w-3.5 h-3.5 text-teal-500" />
              <span>{isUrdu ? "قطار میں اگلا مریض" : "UP NEXT IN QUEUE"}</span>
            </h4>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {isUrdu ? "براہ کرم اپنی دستاویزات تیار رکھیں۔" : "Please have your documents ready."}
            </p>
          </div>
 
          <div className={`flex flex-wrap items-center gap-3 ${isUrdu ? 'flex-row-reverse' : ''}`}>
            {upNext.length === 0 ? (
              <span className="text-xs font-bold text-slate-400 italic">{isUrdu ? "کوئی بقایا ٹوکن نہیں" : "No pending tokens"}</span>
            ) : (
              upNext.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 ${isUrdu ? 'flex-row-reverse' : ''}`}
                >
                  <span className="text-xs font-black text-[#00b495] font-display bg-teal-50 px-2 py-0.5 rounded-md" dir="ltr">
                    #{item.tokenNumber}
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[100px]">
                    {item.patientName}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">
                    {isUrdu ? `← ${formatDoctorName(item.doctorName)}` : `→ ${formatDoctorName(item.doctorName)}`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
