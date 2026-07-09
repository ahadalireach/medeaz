"use client";

import { useReducer, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Search,
  Check,
  Calendar as CalendarIcon,
  Clock,
  User,
  Building2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  useGetDoctorsQuery,
  useSearchPatientsQuery,
  useCreateAppointmentMutation,
} from "@/store/api/clinicApi";
import { useGetAvailableSlotsQuery } from "@/store/api/patientApi";
import { useTranslations } from "next-intl";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "react-hot-toast";

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormState = {
  step: 1 | 2 | 3;
  doctorId: string;
  doctorObj: any;
  patientId: string;
  patientObj: any;
  date: string;
  selectedSlot: string;
  slotIndex: number;
  type: "in-person" | "online" | "follow-up";
  notes: string;
};

type Action =
  | { type: "SET_STEP"; payload: 1 | 2 | 3 }
  | { type: "SELECT_DOCTOR"; payload: { id: string; doctor: any } }
  | { type: "SELECT_PATIENT"; payload: { id: string; patient: any } }
  | { type: "SET_DATE"; payload: string }
  | { type: "SELECT_SLOT"; payload: { slot: string; index: number } }
  | { type: "SET_TYPE"; payload: "in-person" | "online" | "follow-up" }
  | { type: "SET_NOTES"; payload: string }
  | { type: "RESET" };

const initialState: FormState = {
  step: 1,
  doctorId: "",
  doctorObj: null,
  patientId: "",
  patientObj: null,
  date: "",
  selectedSlot: "",
  slotIndex: -1,
  type: "in-person",
  notes: "",
};

function formReducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "SELECT_DOCTOR":
      return {
        ...state,
        doctorId: action.payload.id,
        doctorObj: action.payload.doctor,
        date: "",
        selectedSlot: "",
        slotIndex: -1,
      };
    case "SELECT_PATIENT":
      return {
        ...state,
        patientId: action.payload.id,
        patientObj: action.payload.patient,
      };
    case "SET_DATE":
      return { ...state, date: action.payload, selectedSlot: "", slotIndex: -1 };
    case "SELECT_SLOT":
      return {
        ...state,
        selectedSlot: action.payload.slot,
        slotIndex: action.payload.index,
      };
    case "SET_TYPE":
      return { ...state, type: action.payload };
    case "SET_NOTES":
      return { ...state, notes: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export default function CreateAppointmentModal({
  isOpen,
  onClose,
}: CreateAppointmentModalProps) {
  const t = useTranslations("clinic.createAppointmentModal");
  const [state, dispatch] = useReducer(formReducer, initialState);
  const [doctorSearch, setDoctorSearch] = useState("");
  const debouncedDoctorSearch = useDebounce(doctorSearch, 300);
  const [patientSearch, setPatientSearch] = useState("");
  const patientDebounced = useDebounce(patientSearch, 300);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Reset form when modal closes/opens
  useEffect(() => {
    if (!isOpen) {
      dispatch({ type: "RESET" });
      setDoctorSearch("");
      setPatientSearch("");
    }
  }, [isOpen]);

  // RTK Query calls
  const { data: doctorsResponse, isLoading: loadingDoctors, isFetching: fetchingDoctors } = useGetDoctorsQuery(
    { search: debouncedDoctorSearch, page: 1, limit: 100 },
    { skip: !isOpen || (debouncedDoctorSearch.length > 0 && debouncedDoctorSearch.trim().length < 2) }
  );

  const { data: patientsResponse, isLoading: searchingPatients, isFetching: fetchingPatients } = useSearchPatientsQuery(
    { q: patientDebounced, page: 1, limit: 20 },
    { skip: !isOpen || patientDebounced.length > 0 && patientDebounced.trim().length < 2 }
  );

  const { data: slotsResponse, isFetching: fetchingSlots } = useGetAvailableSlotsQuery(
    { doctorId: state.doctorId, date: state.date },
    { skip: !state.doctorId || !state.date }
  );

  const [createAppointment, { isLoading: submitting }] = useCreateAppointmentMutation();

  const getAvatarUrl = (photo: string) => {
    if (!photo) return "";
    if (photo.startsWith("http") || photo.startsWith("data:")) return photo;
    const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");
    return `${base}${photo.startsWith("/") ? "" : "/"}${photo}`;
  };

  const doctorsList = doctorsResponse?.data?.doctors || [];
  const filteredDoctors = doctorsList;

  const patientsList = patientsResponse?.data?.patients || [];

  const getAvailableSlots = () => {
    if (!state.date || !state.doctorObj) return [];
    const now = new Date();
    const isToday = state.date === now.toLocaleDateString('en-CA');
    if (state.doctorObj?.availabilityStatus === 'on-leave' && isToday) return [];
    const date = new Date(state.date + "T00:00:00");
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = dayNames[date.getDay()];
    const slots = state.doctorObj.schedule?.[dayName] || [];
    return [...slots].sort();
  };

  const allSlots = getAvailableSlots();
  const bookedSlots = slotsResponse?.data?.bookedSlots || [];

  const formatTo12Hour = (time24: string) => {
    if (!time24) return "";
    if (time24.includes("AM") || time24.includes("PM")) return time24;
    const [h, m] = time24.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, "0")}:${m} ${ampm}`;
  };

  const getSlotsTodayCount = (doctor: any) => {
    const today = new Date();
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = dayNames[today.getDay()];
    return doctor.schedule?.[dayName]?.length || 0;
  };

  const handleCreate = async () => {
    if (!state.doctorId || !state.patientId || !state.date || !state.selectedSlot) {
      toast.error(t("messages.fillRequired"));
      return;
    }

    try {
      const combinedIso = new Date(`${state.date}T${state.selectedSlot}:00`).toISOString();
      await createAppointment({
        doctorId: state.doctorId,
        patientId: state.patientId,
        dateTime: combinedIso,
        type: state.type,
        notes: state.notes,
        slotIndex: state.slotIndex,
      }).unwrap();

      toast.success(t("messages.success"));
      onClose();
    } catch (error: any) {
      if (error?.status === 409) {
        toast.error(t("messages.conflict"));
      } else {
        toast.error(error?.data?.message || t("messages.error"));
      }
    }
  };

  if (!isOpen || !isMounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300"
        style={{ animation: "medeazModalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
            <p className="text-xs text-text-secondary mt-0.5">{t("subtitle")}</p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="bg-[#fcfdfd] border-b border-gray-50 px-8 py-5 shrink-0">
          <div className="relative flex items-center justify-between w-full">
            {/* Connector line */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-100 -z-10" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#00b495] -z-10 transition-all duration-300"
              style={{ width: `${((state.step - 1) / 2) * 100}%` }}
            />

            {[
              { id: 1, name: t("doctorStep.title"), stepName: t("steps.doctor") },
              { id: 2, name: t("patientStep.title"), stepName: t("steps.patient") },
              { id: 3, name: t("detailsStep.title"), stepName: t("steps.details") },
            ].map((s) => {
              const isActive = state.step === s.id;
              const isCompleted = state.step > s.id;
              return (
                <button
                  key={s.id}
                  disabled={!isCompleted && !isActive}
                  onClick={() => dispatch({ type: "SET_STEP", payload: s.id as any })}
                  className="flex flex-col items-center focus:outline-none"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 z-10 ${
                      isCompleted
                        ? "bg-[#00b495] text-white"
                        : isActive
                        ? "bg-white text-[#00b495] ring-2 ring-[#00b495] ring-offset-2"
                        : "bg-white text-gray-400 border border-gray-200"
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : s.id}
                  </div>
                  <span
                    className={`mt-1.5 text-[10px] font-bold uppercase tracking-wider ${
                      isActive || isCompleted ? "text-[#00b495]" : "text-gray-400"
                    }`}
                  >
                    {s.stepName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0 bg-[#fafcfc]">
          {/* STEP 1: Select Doctor */}
          {state.step === 1 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">{t("doctorStep.title")}</h3>
                {state.doctorObj && (
                  <span className="text-xs font-semibold text-[#00b495] bg-[#00b495]/10 px-2 py-0.5 rounded-full">
                    {t("doctorStep.selected", { name: state.doctorObj.userId?.name || state.doctorObj.fullName })}
                  </span>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder={t("doctorStep.searchPlaceholder")}
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-10 py-3 text-sm focus:border-[#00b495] focus:ring-1 focus:ring-[#00b495] outline-none transition-all placeholder:text-gray-400"
                />
                {fetchingDoctors && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#00b495]" />
                  </div>
                )}
              </div>
              {doctorSearch.length > 0 && doctorSearch.trim().length < 2 && (
                <p className="text-[#9ca3af] text-[12px] font-inter mt-1 ml-2">Type at least 2 characters to search</p>
              )}

              {/* List */}
              {loadingDoctors && !doctorsList.length ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Loader2 className="h-8 w-8 text-[#00b495] animate-spin" />
                  <p className="text-xs font-semibold text-gray-500">{t("doctorStep.loading")}</p>
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                  <p className="text-sm font-semibold text-gray-400">{t("doctorStep.noDoctors")}</p>
                </div>
              ) : (
                <div className="grid gap-3 max-h-[350px] overflow-y-auto pr-1">
                  {filteredDoctors.map((doc: any) => {
                    const isSelected = state.doctorId === doc.userId?._id;
                    const docName = doc.userId?.name || doc.fullName || "Doctor";
                    const avatar = getAvatarUrl(doc.userId?.photo);
                    const slotsCount = getSlotsTodayCount(doc);

                    return (
                      <button
                        key={doc._id}
                        onClick={() =>
                          dispatch({
                            type: "SELECT_DOCTOR",
                            payload: { id: doc.userId?._id, doctor: doc },
                          })
                        }
                        className={`w-full text-left p-4 bg-white border rounded-2xl transition-all flex items-center justify-between group ${
                          isSelected
                            ? "border-[#00b495] bg-[#00b495]/5 shadow-[0_4px_12px_rgba(0,180,149,0.08)]"
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {avatar ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={avatar}
                              alt={docName}
                              className="h-11 w-11 rounded-xl object-cover border border-gray-100"
                            />
                          ) : (
                            <div className="h-11 w-11 rounded-xl bg-[#00b495]/10 flex items-center justify-center text-[#00b495]">
                              <User className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm group-hover:text-[#00b495] transition-colors flex items-center gap-2 flex-wrap">
                               Dr. {docName}
                               {doc.availabilityStatus === 'on-leave' && (
                                 <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-red-100 text-red-700 border border-red-200">
                                   {t("doctorStep.onLeave")}
                                 </span>
                                )}
                             </h4>
                            <p className="text-xs text-gray-500">{doc.specialization}</p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {t("doctorStep.slotsCount", { slots: slotsCount })}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="h-6 w-6 rounded-full bg-[#00b495] flex items-center justify-center text-white">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Select Patient */}
          {state.step === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">{t("patientStep.title")}</h3>
                {state.patientObj && (
                  <span className="text-xs font-semibold text-[#00b495] bg-[#00b495]/10 px-2 py-0.5 rounded-full">
                    {t("patientStep.selected", { name: state.patientObj.name })}
                  </span>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder={t("patientStep.searchPlaceholder")}
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-10 py-3 text-sm focus:border-[#00b495] focus:ring-1 focus:ring-[#00b495] outline-none transition-all placeholder:text-gray-400"
                />
                {fetchingPatients && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#00b495]" />
                  </div>
                )}
              </div>
              {patientSearch.length > 0 && patientSearch.trim().length < 2 && (
                <p className="text-[#9ca3af] text-[12px] font-inter mt-1 ml-2">Type at least 2 characters to search</p>
              )}

              {/* List */}
              {searchingPatients && !patientsList.length ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Loader2 className="h-8 w-8 text-[#00b495] animate-spin" />
                  <p className="text-xs font-semibold text-gray-500">{t("patientStep.loading")}</p>
                </div>
              ) : patientsList.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 space-y-2">
                  <p className="text-sm font-semibold text-gray-400">{t("patientStep.notFound")}</p>
                  <p className="text-xs">
                    <a
                      href="/dashboard/clinic_admin/patients/search"
                      className="text-[#00b495] font-bold hover:underline"
                    >
                      {t("patientStep.addFirst")}
                    </a>
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 max-h-[350px] overflow-y-auto pr-1">
                  {patientsList.map((patient: any) => {
                    const isSelected = state.patientId === patient._id;
                    const patientName = patient.name;
                    const phone = patient.phone || "No phone number";
                    const dob = patient.patientProfile?.dob
                      ? new Date(patient.patientProfile.dob).toLocaleDateString()
                      : "Not specified";
                    const avatar = getAvatarUrl(patient.photo || patient.patientProfile?.profilePhoto);

                    return (
                      <button
                        key={patient._id}
                        onClick={() =>
                          dispatch({
                            type: "SELECT_PATIENT",
                            payload: { id: patient._id, patient },
                          })
                        }
                        className={`w-full text-left p-4 bg-white border rounded-2xl transition-all flex items-center justify-between group ${
                          isSelected
                            ? "border-[#00b495] bg-[#00b495]/5 shadow-[0_4px_12px_rgba(0,180,149,0.08)]"
                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {avatar ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={avatar}
                              alt={patientName}
                              className="h-11 w-11 rounded-xl object-cover border border-gray-100"
                            />
                          ) : (
                            <div className="h-11 w-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                              <User className="h-5 w-5" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm group-hover:text-[#00b495] transition-colors">
                              {patientName}
                            </h4>
                            <p className="text-xs text-gray-500">{phone}</p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {t("patientStep.dob", { dob: dob })}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="h-6 w-6 rounded-full bg-[#00b495] flex items-center justify-center text-white">
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Appointment Details */}
          {state.step === 3 && (
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-gray-900">{t("detailsStep.title")}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5 text-[#00b495]" /> {t("detailsStep.dateLabel")}
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={state.date}
                    onChange={(e) => dispatch({ type: "SET_DATE", payload: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-[#00b495] focus:ring-1 focus:ring-[#00b495] outline-none transition-all"
                  />
                </div>

                {/* Appointment Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t("detailsStep.typeLabel")}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-2xl">
                    {[
                      { value: "in-person", label: t("detailsStep.typeInPerson") },
                      { value: "online", label: t("detailsStep.typeOnline") },
                      { value: "follow-up", label: t("detailsStep.typeFollowUp") },
                    ].map((opt) => {
                      const isActive = state.type === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            dispatch({ type: "SET_TYPE", payload: opt.value as any })
                          }
                          className={`text-center py-2 text-xs font-bold rounded-xl transition-all ${
                            isActive
                              ? "bg-[#00b495] text-white shadow-md shadow-[#00b495]/20"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Time Slots Grid */}
              {state.date && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#00b495]" /> {t("detailsStep.timeLabel")}
                  </label>

                  {fetchingSlots ? (
                    <div className="flex items-center gap-2 py-4 justify-center">
                      <Loader2 className="h-4 w-4 text-[#00b495] animate-spin" />
                      <span className="text-xs text-gray-500 font-semibold">{t("detailsStep.loadingSlots")}</span>
                    </div>
                  ) : allSlots.length === 0 ? (
                    <div className="p-4 bg-white rounded-xl border border-gray-100 text-center">
                      <p className="text-xs font-semibold text-red-500">
                        {state.date ? (() => {
                          const now = new Date();
                          const isToday = state.date === now.toLocaleDateString('en-CA');
                          if (state.doctorObj?.availabilityStatus === 'on-leave' && isToday) {
                            return t("detailsStep.doctorNotAvailableToday");
                          }
                          const dateObj = new Date(state.date + "T00:00:00");
                          const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
                          const dayName = dayNames[dateObj.getDay()];
                          const isDayInSchedule = state.doctorObj?.schedule?.[dayName] && state.doctorObj.schedule[dayName].length > 0;
                          return !isDayInSchedule
                            ? t("detailsStep.noSlotAvailableToday")
                            : t("detailsStep.noSlots");
                        })() : null}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[140px] overflow-y-auto pr-1">
                      {allSlots.map((slot, index) => {
                        const isBooked = bookedSlots.includes(slot);
                        const isSelected = state.selectedSlot === slot;

                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={isBooked}
                            dir="ltr"
                            onClick={() =>
                              dispatch({ type: "SELECT_SLOT", payload: { slot, index } })
                            }
                            className={`py-2 px-1 text-center text-xs font-bold rounded-xl transition-all border ${
                              isBooked
                                ? "bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed"
                                : isSelected
                                ? "bg-[#00b495] border-[#00b495] text-white shadow-md shadow-[#00b495]/20"
                                : "bg-white border-gray-200 text-gray-700 hover:border-[#00b495] hover:text-[#00b495]"
                            }`}
                          >
                            {formatTo12Hour(slot)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  {t("detailsStep.notesLabel")}
                </label>
                <textarea
                  placeholder={t("detailsStep.notesPlaceholder")}
                  value={state.notes}
                  maxLength={500}
                  onChange={(e) => dispatch({ type: "SET_NOTES", payload: e.target.value })}
                  rows={2}
                  className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:border-[#00b495] focus:ring-1 focus:ring-[#00b495] outline-none transition-all placeholder:text-gray-400"
                />
                <p className="text-[10px] text-right text-gray-400">
                  {t("detailsStep.charLimit", { count: state.notes.length })}
                </p>
              </div>

              {/* Summary Card */}
              {state.doctorObj && state.patientObj && state.date && state.selectedSlot && (
                <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {t("detailsStep.summary.title")}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-[#00b495]/10 flex items-center justify-center text-[#00b495]">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">{t("detailsStep.summary.doctor")}</p>
                        <p className="text-xs font-bold text-gray-800">
                          Dr. {state.doctorObj.userId?.name || state.doctorObj.fullName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">{t("detailsStep.summary.patient")}</p>
                        <p className="text-xs font-bold text-gray-800">
                          {state.patientObj.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-[#00b495]/10 flex items-center justify-center text-[#00b495]">
                        <CalendarIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">{t("detailsStep.summary.dateTime")}</p>
                         <p className="text-xs font-bold text-gray-800" dir="ltr">
                          {new Date(state.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          at {formatTo12Hour(state.selectedSlot)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">{t("detailsStep.summary.type")}</p>
                        <p className="text-xs font-bold text-gray-800 capitalize">
                          {state.type}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0 bg-white">
          <Button
            variant="outline"
            disabled={state.step === 1}
            onClick={() => dispatch({ type: "SET_STEP", payload: (state.step - 1) as any })}
          >
            <ChevronLeft className="h-4 w-4 mr-1.5" /> {t("buttons.back")}
          </Button>

          {state.step < 3 ? (
            <Button
              disabled={
                (state.step === 1 && !state.doctorId) ||
                (state.step === 2 && !state.patientId)
              }
              onClick={() => dispatch({ type: "SET_STEP", payload: (state.step + 1) as any })}
            >
              {t("buttons.next")} <ChevronRight className="h-4 w-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              disabled={submitting || !state.selectedSlot || !state.date}
              onClick={handleCreate}
              className="bg-[#00b495] hover:bg-[#009c81] text-white font-bold"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> {t("buttons.creating")}
                </>
              ) : (
                <>
                  {t("buttons.create")} <Plus className="h-4 w-4 ml-1.5" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes medeazModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}
