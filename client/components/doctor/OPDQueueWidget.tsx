"use client";
 
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Ticket,
  ChevronDown,
  ChevronUp,
  User,
  CheckCircle2,
  Clock,
  Play,
  Activity,
  AlertCircle
} from "lucide-react";
import { toast } from "react-hot-toast";
import { socket } from "@/lib/socket";
import {
  useGetOPDQueueQuery,
  useCompleteTokenMutation
} from "@/store/api/clinicApi";
import { useGetDoctorProfileQuery } from "@/store/api/doctorApi";
import { useLocale } from "next-intl";
import type { RootState } from "@/store/store";
 
export default function OPDQueueWidget() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [isOpen, setIsOpen] = useState(true);
  const locale = useLocale();
  const isUrdu = locale === "ur";
 
  // Fetch doctor profile to get the associated clinicId
  const { data: profileData } = useGetDoctorProfileQuery(undefined, { skip: !user?._id });
  const clinicId = profileData?.data?.clinicId?._id || profileData?.data?.clinicId;
 
  const filterParams = {
    doctorId: user?._id || "",
    status: "all"
  };
 
  // Fetch tokens for this doctor
  const { data: queueData, isLoading, refetch } = useGetOPDQueueQuery(
    filterParams,
    { skip: !user?._id }
  );
 
  const [completeToken, { isLoading: isCompleting }] = useCompleteTokenMutation();
 
  const tokens = queueData?.data?.tokens || [];
  
  // Find current called token for this doctor
  const currentCalled = tokens.find((t: any) => t.status === "called");
  
  // Find next waiting token in the sorted queue for this doctor
  const nextWaiting = tokens.find((t: any) => t.status === "waiting");
  
  // Count unserved patients in waiting status
  const waitingCount = tokens.filter((t: any) => t.status === "waiting").length;
 
  useEffect(() => {
    if (!clinicId || !user?._id) return;
 
    if (!socket.connected) {
      socket.connect();
    }
 
    const onConnect = () => {
      socket.emit("join_opd", clinicId);
      console.log("Widget connected and joined room:", clinicId);
    };
 
    socket.on("connect", onConnect);
    if (socket.connected) {
      onConnect();
    }
 
    // Live queue events trigger cache reload
    const handleQueueChange = (data: any) => {
      console.log("Widget received queue change:", data);
      refetch();
    };
 
    socket.on("opd_token_issued", handleQueueChange);
    socket.on("opd_token_called", handleQueueChange);
    socket.on("opd_token_completed", handleQueueChange);
    socket.on("opd_token_skipped", handleQueueChange);
 
    return () => {
      socket.off("connect", onConnect);
      socket.off("opd_token_issued", handleQueueChange);
      socket.off("opd_token_called", handleQueueChange);
      socket.off("opd_token_completed", handleQueueChange);
      socket.off("opd_token_skipped", handleQueueChange);
    };
  }, [clinicId, user?._id, refetch]);
 
  // Complete current token
  const handleMarkCurrentDone = async () => {
    if (!currentCalled) return;
    try {
      await completeToken({ tokenId: currentCalled._id, filterParams }).unwrap();
      toast.success(isUrdu ? "موجودہ مریض کی خدمت کامیابی سے مکمل ہو گئی۔" : "Completed serving current patient.");
    } catch (err: any) {
      toast.error(err?.data?.message || (isUrdu ? "ٹوکن مکمل کرنے میں ناکامی" : "Failed to complete token"));
    }
  };
 
  return (
    <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden select-none">
      {/* Collapsible header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors border-none bg-transparent cursor-pointer ${isUrdu ? 'text-right flex-row-reverse' : 'text-left'}`}
      >
        <div className={`flex items-center gap-2.5 ${isUrdu ? 'flex-row-reverse' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-[#00b495]/10 flex items-center justify-center text-[#00b495] shrink-0">
            <Ticket className="w-4.5 h-4.5" />
          </div>
          <div className={isUrdu ? 'text-right' : 'text-left'}>
            <h4 className="text-sm font-bold text-slate-800">{isUrdu ? "آج آپ کی او پی ڈی قطار" : "Your OPD Queue Today"}</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              {isUrdu ? "کلینک ڈیسک کے ذریعے براہ راست اپ ڈیٹس" : "Live updates via clinic desk"}
            </p>
          </div>
        </div>
 
        <div className={`flex items-center gap-3 ${isUrdu ? 'flex-row-reverse' : ''}`}>
          {waitingCount > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {isUrdu ? `${waitingCount} انتظار میں` : `${waitingCount} waiting`}
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>
 
      {/* Body panel */}
      {isOpen && (
        <div className="border-t border-slate-100 p-5 bg-slate-50/30 space-y-4">
          {isLoading ? (
            <div className="text-center py-4 text-xs font-semibold text-slate-400">
              {isUrdu ? "قطار کی تفصیلات لوڈ ہو رہی ہیں..." : "Loading queue details..."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Serving Current Column */}
              <div className="bg-white border border-slate-150 rounded-xl p-4 flex flex-col justify-between shadow-xs">
                <div>
                  <span className={`text-[10px] font-black text-slate-400 uppercase tracking-widest block ${isUrdu ? 'text-right' : ''}`}>
                    {isUrdu ? "ابھی معائنہ جاری ہے" : "NOW SERVING"}
                  </span>
 
                  {currentCalled ? (
                    <div className={`mt-3 flex items-start gap-3 ${isUrdu ? 'flex-row-reverse' : ''}`}>
                      <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center font-display font-black text-lg text-[#00b495] shrink-0 animate-pulse" dir="ltr">
                        #{currentCalled.tokenNumber}
                      </div>
                      <div className={`min-w-0 flex-1 ${isUrdu ? 'text-right' : ''}`}>
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {currentCalled.patientName}
                        </p>
                        <p className={`text-[10px] text-teal-600 font-bold mt-0.5 flex items-center gap-1 ${isUrdu ? 'justify-end' : ''}`}>
                          {!isUrdu && <span className="w-1.5 h-1.5 rounded-full bg-[#00b495] animate-ping" />}
                          <span>{isUrdu ? "جاری سیشن" : "Active Session"}</span>
                          {isUrdu && <span className="w-1.5 h-1.5 rounded-full bg-[#00b495] animate-ping" />}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className={`mt-4 py-2 flex items-center gap-2 text-slate-400 ${isUrdu ? 'flex-row-reverse justify-start' : ''}`}>
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-semibold">{isUrdu ? "ابھی تک کسی مریض کو نہیں بلایا گیا" : "No active patient called yet"}</span>
                    </div>
                  )}
                </div>
 
                {currentCalled && (
                  <button
                    onClick={handleMarkCurrentDone}
                    disabled={isCompleting}
                    className="w-full mt-4 py-2 bg-[#00b495] hover:bg-[#009b80] disabled:bg-slate-200 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer border-none"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isCompleting ? (isUrdu ? "محفوظ ہو رہا ہے..." : "Saving...") : (isUrdu ? "موجودہ مریض کو مکمل مارک کریں" : "Mark Current Done")}</span>
                  </button>
                )}
              </div>
 
              {/* Up Next Column */}
              <div className="bg-white border border-slate-150 rounded-xl p-4 flex flex-col justify-between shadow-xs">
                <div>
                  <span className={`text-[10px] font-black text-slate-400 uppercase tracking-widest block ${isUrdu ? 'text-right' : ''}`}>
                    {isUrdu ? "اگلا مریض قطار میں" : "UP NEXT IN LINE"}
                  </span>
 
                  {nextWaiting ? (
                    <div className={`mt-3 flex items-start gap-3 ${isUrdu ? 'flex-row-reverse' : ''}`}>
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-display font-black text-lg text-slate-600 shrink-0" dir="ltr">
                        #{nextWaiting.tokenNumber}
                      </div>
                      <div className={`min-w-0 flex-1 ${isUrdu ? 'text-right' : ''}`}>
                        <p className="text-sm font-bold text-slate-700 truncate">
                          {nextWaiting.patientName}
                        </p>
                        <p className={`text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1 ${isUrdu ? 'justify-end' : ''}`}>
                          {!isUrdu && <Clock className="w-3.5 h-3.5" />}
                          <span>{isUrdu ? "انتظار گاہ میں موجود" : "Waiting in Lobby"}</span>
                          {isUrdu && <Clock className="w-3.5 h-3.5" />}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className={`mt-4 py-2 flex items-center gap-2 text-slate-400 ${isUrdu ? 'flex-row-reverse justify-start' : ''}`}>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-xs font-semibold text-slate-500">{isUrdu ? "قطار خالی ہے!" : "Queue is empty!"}</span>
                    </div>
                  )}
                </div>
 
                <div className={`mt-4 text-[11px] font-medium text-slate-500 bg-slate-50 rounded-lg p-2 flex justify-between items-center ${isUrdu ? 'flex-row-reverse' : ''}`}>
                  <span>{isUrdu ? "انتظار کرنے والے مریض:" : "Waiting Counter:"}</span>
                  <span className="font-bold text-[#00b495]">{isUrdu ? `${waitingCount} مریض` : `${waitingCount} Patients`}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
