"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBookAppointmentMutation, useGetClinicsQuery, useGetAvailableSlotsQuery, useReserveSlotMutation } from "@/store/api/patientApi";
import { ArrowLeft, ArrowRight, Check, Calendar, Clock, User, Building2, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { SuccessModal } from "@/components/ui/SuccessModal";
import { useTranslations, useLocale } from "next-intl";
import { resolveMediaUrl } from "@/lib/media";

const steps = (t: any) => [
  { id: 1, name: t('patient.bookAppointmentPage.steps.clinic'), icon: Building2 },
  { id: 2, name: t('patient.bookAppointmentPage.steps.doctor'), icon: User },
  { id: 3, name: t('patient.bookAppointmentPage.steps.dateTime'), icon: Calendar },
  { id: 4, name: t('patient.bookAppointmentPage.steps.confirm'), icon: Check },
];

export default function BookAppointmentPage() {
  const t = useTranslations();
  const locale = useLocale();

  const getClinicHoursDisplay = (clinic: any) => {
    const to12h = (t24: string) => {
      if (!t24) return "";
      if (t24.includes("AM") || t24.includes("PM")) return t24;
      const [h, m] = t24.split(":").map(Number);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
    };
    if (!clinic || !clinic.workingHours) return locale === 'ur' ? "آج بند ہے" : "Closed Today";
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const todayName = dayNames[new Date().getDay()];
    const todayHours = clinic.workingHours[todayName];
    if (todayHours && !todayHours.closed && todayHours.open && todayHours.close) {
      return `${to12h(todayHours.open)} - ${to12h(todayHours.close)}`;
    }
    for (const day of dayNames) {
      const hours = clinic.workingHours[day];
      if (hours && !hours.closed && hours.open && hours.close) {
        const getUrduDay = (engDay: string) => {
          const mapping: Record<string, string> = {
            monday: 'پیر',
            tuesday: 'منگل',
            wednesday: 'بدھ',
            thursday: 'جمعرات',
            friday: 'جمعہ',
            saturday: 'ہفتہ',
            sunday: 'اتوار'
          };
          return mapping[engDay.toLowerCase()] || engDay;
        };
        return locale === 'ur'
          ? `${getUrduDay(day)}: ${to12h(hours.open)} - ${to12h(hours.close)}`
          : `${day.charAt(0).toUpperCase() + day.slice(1)}: ${to12h(hours.open)} - ${to12h(hours.close)}`;
      }
    }
    return locale === 'ur' ? "بند" : "Closed";
  };

  const isSlotHighlighted = (slot: string) => {
    if (!formData.appointmentTime) return false;
    const slot12 = formatTo12Hour(slot);
    if (formData.appointmentTime === slot12) return true;

    if (formData.duration === 30) {
      const clickedIdx = availableSlots.findIndex(s => formatTo12Hour(s) === formData.appointmentTime);
      if (clickedIdx !== -1) {
        const nextSlot = availableSlots[clickedIdx + 1];
        if (nextSlot && nextSlot === slot) return true;
      }
    }
    return false;
  };

  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [bookAppointment, { isLoading }] = useBookAppointmentMutation();
  const [reserveSlot, { isLoading: reserving }] = useReserveSlotMutation();
  const { data: clinicsData, isLoading: loadingClinics } = useGetClinicsQuery(undefined);
  const [prefill, setPrefill] = useState<{ clinicId: string; doctorId: string }>({ clinicId: "", doctorId: "" });
  const [prefillApplied, setPrefillApplied] = useState(false);

  const clinics = clinicsData?.data || [];

  const [formData, setFormData] = useState({
    doctorId: "",
    doctorName: "",
    specialization: "",
    clinicId: "",
    clinicName: "",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
    duration: 15,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const doctorId = params.get("doctorId") || "";
    const clinicId = params.get("clinicId") || "";
    if (doctorId || clinicId) {
      setPrefill({ doctorId, clinicId });
    }
  }, []);

  const selectedClinic = clinics.find((c: any) => c._id === formData.clinicId);
  const doctors = selectedClinic?.doctors || [];

  const selectedDoctor = doctors.find((d: any) => d._id === formData.doctorId);
  const doctorSchedule = selectedDoctor?.schedule || {};

  useEffect(() => {
    if (prefillApplied || !clinics.length) return;
    if (!prefill.doctorId && !prefill.clinicId) return;

    let matchedClinic: any = null;
    let matchedDoctor: any = null;

    if (prefill.clinicId) {
      matchedClinic = clinics.find((c: any) => c._id === prefill.clinicId) || null;
    }

    if (!matchedClinic && prefill.doctorId) {
      matchedClinic = clinics.find((c: any) =>
        Array.isArray(c.doctors) && c.doctors.some((d: any) => d._id === prefill.doctorId)
      ) || null;
    }

    if (matchedClinic && prefill.doctorId) {
      matchedDoctor = (matchedClinic.doctors || []).find((d: any) => d._id === prefill.doctorId) || null;
    }

    if (matchedClinic) {
      const doc = matchedDoctor || null;
      const docName = doc ? (doc.userId?.name || doc.fullName || "Doctor") : "";

      setFormData((prev) => ({
        ...prev,
        clinicId: matchedClinic._id,
        clinicName: matchedClinic.name || "",
        doctorId: doc?._id || prev.doctorId,
        doctorName: docName || prev.doctorName,
        specialization: doc?.specialization || prev.specialization,
      }));

      // If doctor is known, jump directly to date/time step
      setCurrentStep(doc ? 3 : 2);
      setPrefillApplied(true);
    }
  }, [clinics, prefill, prefillApplied]);

  const getAvailableSlots = () => {
    if (!formData.appointmentDate) return [];
    
    // Filter for future slots if the appointment is for today
    const now = new Date();
    const isToday = formData.appointmentDate === now.toLocaleDateString('en-CA');
    
    if (selectedDoctor?.availabilityStatus === 'on-leave' && isToday) return [];
    
    const date = new Date(formData.appointmentDate + "T00:00:00");
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const dayName = dayNames[date.getDay()];
    const slots24h = doctorSchedule[dayName] || [];

    let filteredSlots = [...slots24h].sort();

    if (isToday) {
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();

      filteredSlots = filteredSlots.filter(slot => {
        // Handle both "HH:mm" and "hh:mm AM" formats
        let hour = 0;
        let minute = 0;

        if (slot.includes("AM") || slot.includes("PM")) {
          const [time, ampm] = slot.split(" ");
          const [h, m] = time.split(":").map(Number);
          hour = ampm === "PM" && h < 12 ? h + 12 : ampm === "AM" && h === 12 ? 0 : h;
          minute = m;
        } else {
          const [h, m] = slot.split(":").map(Number);
          hour = h;
          minute = m;
        }

        if (hour > currentHour) return true;
        if (hour === currentHour && minute > currentMin) return true;
        return false;
      });
    }

    return filteredSlots;
  };

  const formatTo12Hour = (time24: string) => {
    if (!time24) return "";
    // Already in 12-hour format?
    if (time24.includes("AM") || time24.includes("PM")) return time24;
    const [h, m] = time24.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  const getEndTimeStr = (time12: string, duration: number) => {
    if (!time12) return "";
    const [time, ampm] = time12.split(" ");
    let [h, m] = time.split(":").map(Number);
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;

    m += duration;
    if (m >= 60) {
      h += Math.floor(m / 60);
      m = m % 60;
    }

    const endAmpm = h >= 12 && h < 24 ? "PM" : "AM";
    const endH = (h % 12) || 12;
    return `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${endAmpm}`;
  };

  const availableSlots = getAvailableSlots();

  const { data: bookedData, isFetching: fetchingSlots } = useGetAvailableSlotsQuery(
    { doctorId: formData.doctorId, date: formData.appointmentDate },
    { skip: !formData.doctorId || !formData.appointmentDate }
  );

  const bookedSlots = bookedData?.data?.bookedSlots || [];

  const isSlotBookedForDuration = (slot: string, duration: number) => {
    if (bookedSlots.includes(slot)) return true;
    if (duration === 30) {
      // Slot is 24h format like "10:15"
      let [h, m] = slot.split(':').map(Number);
      m += 15;
      if (m >= 60) {
        h += 1;
        m -= 60;
      }
      const nextSlot = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      if (bookedSlots.includes(nextSlot)) return true;
      if (!availableSlots.includes(nextSlot)) return true; // Next consecutive slot not available
    }
    return false;
  };

  const filteredClinics = clinics.filter((c: any) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesClinic = c.name?.toLowerCase().includes(searchLower) ||
      c.address?.toLowerCase().includes(searchLower);

    const matchesDoctor = c.doctors?.some((d: any) =>
      (d.fullName || d.userId?.name || "").toLowerCase().includes(searchLower) ||
      (d.specialization || "").toLowerCase().includes(searchLower)
    );

    return matchesClinic || matchesDoctor;
  });

  const getAvailabilityBadge = (schedule: any) => {
    if (!schedule) return locale === 'ur' ? "شیڈول نامعلوم" : "Schedule Unknown";
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const now = new Date();
    const todayIdx = now.getDay();
    const todayName = days[todayIdx];

    // Check today specifically for future slots
    const todaySlots = schedule[todayName] || [];
    if (todaySlots.length > 0) {
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();

      const hasFutureSlots = todaySlots.some((slot: string) => {
        let hour = 0;
        let minute = 0;
        if (slot.includes("AM") || slot.includes("PM")) {
          const [time, ampm] = slot.split(" ");
          const [h, m] = time.split(":").map(Number);
          hour = ampm === "PM" && h < 12 ? h + 12 : ampm === "AM" && h === 12 ? 0 : h;
          minute = m;
        } else {
          const [h, m] = slot.split(":").map(Number);
          hour = h;
          minute = m;
        }
        return (hour > currentHour) || (hour === currentHour && minute > currentMin);
      });

      if (hasFutureSlots) return locale === 'ur' ? "آج دستیاب ہے" : "Available Today";
      return locale === 'ur' ? "آج دستیاب نہیں ہے" : "Not Available Today";
    }

    if (schedule[days[(todayIdx + 1) % 7]]?.length > 0) return t('patient.bookAppointmentPage.availability.tomorrow');

    for (let i = 2; i < 7; i++) {
      const dayIdx = (todayIdx + i) % 7;
      const dayName = days[dayIdx];
      if (schedule[dayName]?.length > 0) {
        const getUrduDay = (engDay: string) => {
          const mapping: Record<string, string> = {
            monday: 'پیر',
            tuesday: 'منگل',
            wednesday: 'بدھ',
            thursday: 'جمعرات',
            friday: 'جمعہ',
            saturday: 'ہفتہ',
            sunday: 'اتوار'
          };
          return mapping[engDay.toLowerCase()] || engDay;
        };
        return locale === 'ur'
          ? `${getUrduDay(dayName)} کو دستیاب ہے`
          : t('patient.bookAppointmentPage.availability.available', { day: dayName.charAt(0).toUpperCase() + dayName.slice(1) });
      }
    }

    return t('patient.bookAppointmentPage.availability.check');
  };

  const handleNext = async () => {
    if (currentStep === 1 && !formData.clinicId) {
      toast.error("Please select a clinic");
      return;
    }
    if (currentStep === 2 && !formData.doctorId) {
      toast.error("Please select a doctor");
      return;
    }
    if (currentStep === 3) {
      if (!formData.appointmentDate || !formData.appointmentTime) {
        toast.error("Please select date and time");
        return;
      }
      try {
        await reserveSlot({
          doctorId: formData.doctorId,
          appointmentDate: formData.appointmentDate,
          appointmentTime: formData.appointmentTime,
          duration: formData.duration,
        }).unwrap();
      } catch (err: any) {
        toast.error(err?.data?.message || "Slot is currently reserved or unavailable.");
        return;
      }
    }
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleSubmit = async () => {
    if (!formData.reason.trim()) {
      toast.error("Please provide a reason for your visit");
      return;
    }
    try {
      await bookAppointment({
        doctorId: formData.doctorId,
        clinicId: formData.clinicId,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        reason: formData.reason,
        duration: formData.duration,
      }).unwrap();
      setIsSuccessModalOpen(true);
    } catch (error: any) {
      if (error?.status === 409) {
        toast.error(t('toast.slotUnavailable'));
      } else {
        toast.error(error?.data?.message || t('toast.error'));
      }
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-4">
          {currentStep > 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary :text-white group"
            >
              <ArrowLeft className="h-5 w-5 transition-transform" />
              <span className="text-sm font-bold uppercase tracking-widest">{t('patient.bookAppointmentPage.previousStep')}</span>
            </button>
          ) : (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary :text-white group"
            >
              <ArrowLeft className="h-5 w-5 transition-transform" />
              <span className="text-sm font-bold uppercase tracking-widest">{t('common.back')}</span>
            </button>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight uppercase">{t('patient.bookAppointmentPage.title')}</h1>
      </div>

      {/* Progress Steps */}
      <div className="rounded-xl border border-black/5 bg-white p-4 sm:p-8 shadow-sm">
        <div className="relative flex items-center justify-between w-full">
          {/* Connecting line background */}
          <div className="absolute left-0 top-[20px] sm:top-[24px] w-full h-1 bg-surface -z-10 rounded-full" />
          {/* Active Connecting line */}
          <div
            className="absolute left-0 top-[20px] sm:top-[24px] h-1 bg-primary -z-10 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (steps(t).length - 1)) * 100}%` }}
          />

          {steps(t).map((step: any) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <div
                key={step.id}
                className={`flex flex-col items-center group ${isCompleted || isActive ? "cursor-pointer" : ""}`}
                onClick={() => {
                  if (step.id < currentStep || (step.id === 1 && currentStep > 1) || (step.id === 2 && formData.clinicId) || (step.id === 3 && formData.doctorId)) {
                    setCurrentStep(step.id);
                  }
                }}
              >
                <div
                  className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition-all duration-300 ${isCompleted
                    ? "bg-primary text-white"
                    : isActive
                      ? "bg-primary/20 text-primary ring-2 ring-primary ring-offset-2 "
                      : "bg-surface text-text-secondary "
                    }`}
                >
                  {isCompleted ? <Check className="h-5 w-5 sm:h-6 sm:w-6" /> : <Icon className="h-5 w-5 sm:h-6 sm:w-6" />}
                </div>
                <p
                  className={`mt-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-center ${isActive || isCompleted ? "text-text-primary " : "text-text-secondary "
                    }`}
                >
                  <span className="hidden xs:inline">{step.name}</span>
                  <span className="xs:hidden">{step.name.split(" ")[0]}</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-xl border border-border-light bg-white p-8">
        {/* Step 1: Select Clinic */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">{t('patient.bookAppointmentPage.selectClinicTitle')}</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  placeholder={t('patient.bookAppointmentPage.searchClinicsPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  className="w-full rounded-xl border border-border-light bg-white pl-10 pr-4 py-3 text-text-primary focus:border-primary focus:outline-none"
                />
              </div>
              <button
                onClick={handleNext}
                className="h-12 px-6 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all"
              >
                {t('patient.bookAppointmentPage.findClinic')}
              </button>
            </div>
            {loadingClinics ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-lg border border-border-light bg-surface" />
                ))}
              </div>
            ) : filteredClinics.length === 0 ? (
              <p className="text-center text-text-secondary py-8">
                {clinics.length === 0 ? t('patient.bookAppointmentPage.noClinics') : t('patient.bookAppointmentPage.noClinicsMatch')}
              </p>
            ) : (
              <div className="grid gap-4">
                {filteredClinics.map((clinic: any) => (
                  <button
                    key={clinic._id}
                    onClick={() =>
                      setFormData({ ...formData, clinicId: clinic._id, clinicName: clinic.name, doctorId: "", doctorName: "" })
                    }
                    className={`rounded-lg border-2 p-4 text-left transition-all ${formData.clinicId === clinic._id
                      ? "border-primary bg-primary/5 "
                      : "border-border-light hover:border-border  :border-border"
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-full border border-primary/20 overflow-hidden bg-primary/5 flex items-center justify-center shrink-0">
                        {clinic.photo ? (
                          <img
                            src={resolveMediaUrl(clinic.photo)}
                            alt={clinic.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Building2 className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">{clinic.name}</h3>
                        {clinic.address && (
                          <p className="text-sm text-text-secondary">{clinic.address}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
                            {clinic.doctors?.length === 1 ? t('patient.bookAppointmentPage.doctorsCountSingle') : t('patient.bookAppointmentPage.doctorsCount', { n: clinic.doctors?.length || 0 })}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20" dir="ltr">
                            <Clock className="h-3 w-3" />
                            <span>{getClinicHoursDisplay(clinic)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20" dir="ltr">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            <span>{clinic.clinicRating?.overall ? clinic.clinicRating.overall.toFixed(1) : "N/A"}</span>
                            <span className="opacity-70">({clinic.clinicRating?.totalReviews || 0} {locale === 'ur' ? 'جائزے' : 'reviews'})</span>
                          </div>
                        </div>
                      </div>
                      {formData.clinicId === clinic._id && <Check className="h-6 w-6 text-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Doctor */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-text-primary">{t('patient.bookAppointmentPage.selectDoctorTitle')}</h2>
            <p className="text-sm text-text-secondary">{t('patient.bookAppointmentPage.fromClinic')} {formData.clinicName}</p>
            {doctors.length === 0 ? (
              <p className="text-center text-text-secondary py-8">{t('patient.bookAppointmentPage.noDoctors')}</p>
            ) : (
              <div className="grid gap-4">
                {doctors.map((doctor: any) => {
                  const docName = doctor.userId?.name || doctor.fullName || "Doctor";
                  return (
                    <button
                      key={doctor._id}
                      onClick={() =>
                        setFormData({ ...formData, doctorId: doctor._id, doctorName: docName, specialization: doctor.specialization })
                      }
                      className={`rounded-lg border-2 p-4 text-left transition-all ${formData.doctorId === doctor._id
                        ? "border-primary bg-primary/5 "
                        : "border-border-light hover:border-border  :border-border"
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-full border border-primary/20 overflow-hidden bg-primary/5 flex items-center justify-center shrink-0">
                          {doctor.userId?.photo || doctor.photo ? (
                            <img
                              src={resolveMediaUrl(doctor.userId?.photo || doctor.photo)}
                              alt={docName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-text-primary">Dr. {docName}</h3>
                          <p className="text-sm text-text-secondary">{doctor.specialization}</p>
                          {doctor.availabilityStatus === 'on-leave' ? (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200 rounded-full">
                              {t('patient.bookAppointmentPage.availability.onLeave')}
                            </div>
                          ) : (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-surface text-primary rounded-full">
                              {getAvailabilityBadge(doctor.schedule)}
                            </div>
                          )}
                        </div>
                        {formData.doctorId === doctor._id && <Check className="h-6 w-6 text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Date & Time */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">{t('patient.bookAppointmentPage.pickDateTimeTitle')}</h2>
            <div>
              <label className="mb-2 block text-sm font-semibold text-text-primary">
                {t('patient.bookAppointmentPage.appointmentDate')}
              </label>
              <input
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                min={new Date().toLocaleDateString('en-CA')}
                className="w-full rounded-xl border border-border-light bg-white px-4 py-3 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-text-primary">
                {t('patient.bookAppointmentPage.availableTimeSlots')}
              </label>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {availableSlots.length > 0 ? (
                  availableSlots.map((slot: string) => {
                    const isBooked = isSlotBookedForDuration(slot, formData.duration);
                    return (
                      <button
                        key={slot}
                        disabled={isBooked}
                        onClick={() => setFormData({ ...formData, appointmentTime: formatTo12Hour(slot) })}
                        dir="ltr"
                        className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${isSlotHighlighted(slot)
                          ? "border-primary bg-primary text-white font-bold"
                          : isBooked
                            ? "border-border-light bg-[#f4f4f5] dark:bg-[#27272a] text-gray-400 dark:text-gray-600 cursor-not-allowed line-through opacity-50"
                            : "border-border-light text-text-primary hover:border-border :border-border"
                          }`}
                      >
                        {formatTo12Hour(slot)}
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-3 sm:col-span-4 rounded-xl border border-dashed border-border p-6 text-center text-sm font-medium text-text-secondary">
                    {formData.appointmentDate ? (() => {
                      const now = new Date();
                      const isToday = formData.appointmentDate === now.toLocaleDateString('en-CA');
                      if (selectedDoctor?.availabilityStatus === 'on-leave' && isToday) {
                        return t('patient.bookAppointmentPage.doctorNotAvailableToday');
                      }
                      const dateObj = new Date(formData.appointmentDate + "T00:00:00");
                      const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
                      const dayName = dayNames[dateObj.getDay()];
                      const isDayInSchedule = doctorSchedule[dayName] && doctorSchedule[dayName].length > 0;
                      return !isDayInSchedule
                        ? t('patient.bookAppointmentPage.noSlotAvailableToday')
                        : t('patient.bookAppointmentPage.noSlotsAvailable');
                    })() : (
                      t('patient.bookAppointmentPage.selectDateFirst')
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 bg-surface p-4 rounded-xl border border-black/5 mt-4">
              <input
                type="checkbox"
                id="double-slot"
                checked={formData.duration === 30}
                onChange={(e) => {
                  const newDuration = e.target.checked ? 30 : 15;
                  // Clear selected time if it becomes invalid with new duration
                  let newTime = formData.appointmentTime;
                  if (newDuration === 30 && formData.appointmentTime) {
                    // Find original 24h slot to test
                    const origSlot = availableSlots.find(s => formatTo12Hour(s) === formData.appointmentTime);
                    if (origSlot && isSlotBookedForDuration(origSlot, 30)) {
                      newTime = "";
                    }
                  }
                  setFormData({ ...formData, duration: newDuration, appointmentTime: newTime });
                }}
                className="w-5 h-5 accent-primary rounded-lg cursor-pointer"
              />
              <label htmlFor="double-slot" className="cursor-pointer flex-1">
                <p className="text-sm font-bold text-text-primary">
                  {t('patient.bookAppointmentPage.extendedConsultationTitle')}
                </p>
                <p className="text-xs text-text-secondary">
                  {t('patient.bookAppointmentPage.extendedConsultationDescription')}
                </p>
              </label>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-text-primary">
                {t('patient.bookAppointmentPage.reasonForVisit')}
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                placeholder={t('patient.bookAppointmentPage.reasonPlaceholder')}
                className="w-full rounded-xl border border-border-light bg-white px-4 py-3 text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary :text-text-secondary"
              />
            </div>
          </div>
        )}

        {/* Step 4: Confirm */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-text-primary">{t('patient.bookAppointmentPage.confirmTitle')}</h2>
            <div className="space-y-4 rounded-lg border border-border-light p-6">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-6 w-6 rounded-full border border-primary/20 overflow-hidden bg-primary/5 flex items-center justify-center shrink-0">
                  {selectedClinic?.photo ? (
                    <img
                      src={resolveMediaUrl(selectedClinic.photo)}
                      alt={formData.clinicName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-text-secondary">{t('patient.bookAppointmentPage.clinicLabel')}</p>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-text-primary">{formData.clinicName}</p>
                    {selectedClinic?.clinicRating?.overall && (
                      <div className="flex items-center gap-0.5 text-xs text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded-full" dir="ltr">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        <span>{selectedClinic.clinicRating.overall.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-6 w-6 rounded-full border border-primary/20 overflow-hidden bg-primary/5 flex items-center justify-center shrink-0">
                  {selectedDoctor?.userId?.photo || selectedDoctor?.photo ? (
                    <img
                      src={resolveMediaUrl(selectedDoctor?.userId?.photo || selectedDoctor?.photo)}
                      alt={formData.doctorName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-text-secondary">{t('patient.bookAppointmentPage.doctorLabel')}</p>
                  <p className="font-semibold text-text-primary">{t('patient.bookAppointmentPage.doctorPrefix')} {formData.doctorName}</p>
                  <p className="text-sm text-text-secondary">{formData.specialization}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-1 h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-text-secondary">{t('patient.bookAppointmentPage.dateTimeLabel')}</p>
                  <p className="font-semibold text-text-primary">
                    {new Date(formData.appointmentDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-text-secondary" dir="ltr">
                    {formData.appointmentTime} {formData.duration === 30 ? `- ${getEndTimeStr(formData.appointmentTime, 30)} (30 Mins)` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 text-primary text-lg font-bold flex items-center justify-center w-5 h-5">₨</div>
                <div>
                  <p className="text-sm text-text-secondary">{locale === 'ur' ? 'مشاورتی فیس' : 'Consultation Fee'}</p>
                  <p className="font-semibold text-text-primary">
                    {locale === 'ur' ? 'روپے' : 'Rs.'} {formData.duration === 30 ? (selectedDoctor?.consultationFee || 0) * 2 : (selectedDoctor?.consultationFee || 0)} {formData.duration === 30 ? (locale === 'ur' ? ' (ڈبل سلاٹس)' : ' (Double Slots)') : (locale === 'ur' ? ' (سنگل سلاٹ)' : ' (Single Slot)')}
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-[#f4f4f5] dark:bg-[#27272a] p-4">
                <p className="text-sm font-semibold text-text-secondary">{t('patient.bookAppointmentPage.reasonForVisit')}</p>
                <p className="mt-1 text-text-primary">{formData.reason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} disabled={currentStep === 1}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
          {currentStep < 4 ? (
            <Button onClick={handleNext} disabled={reserving}>
              {reserving ? t('patient.bookAppointmentPage.reserving') : t('patient.bookAppointmentPage.next')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? t('patient.bookAppointmentPage.booking') : t('patient.bookAppointmentPage.confirmBooking')}
              <Check className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          router.push("/dashboard/patient/appointments");
        }}
        title={t('patient.bookAppointmentPage.successTitle')}
        message={t('patient.bookAppointmentPage.successMessage', { doctorName: formData.doctorName, date: new Date(formData.appointmentDate).toLocaleDateString(), time: formData.appointmentTime })}
        actionText={t('patient.bookAppointmentPage.reviewAppointments')}
      />
    </div>
  );
}
