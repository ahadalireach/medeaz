"use client";

import { useGetDoctorsQuery } from "@/store/api/patientApi";
import { Calendar } from "lucide-react";
import MagnifierIcon from "@/icons/magnifier-icon";
import MapPinIcon from "@/icons/map-pin-icon";
import UserIcon from "@/icons/user-icon";
import StarIcon from "@/icons/star-icon";
import FilterIcon from "@/icons/filter-icon";
import { useState, useEffect } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStartConversationMutation } from "@/store/api/chatApi";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";
import AvailabilityBadge from "@/components/shared/AvailabilityBadge";
import { useDebounce } from "@/hooks/useDebounce";
import { Loader2 } from "lucide-react";

export default function DoctorsList() {
    const t = useTranslations();
    const PAKISTANI_CITIES = [
        t('common.allCities'), "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
        "Multan", "Peshawar", "Quetta", "Gujranwala", "Sialkot",
        "Bahawalpur", "Sargodha", "Sukkur", "Larkana", "Sheikhupura",
        "Rahim Yar Khan", "Jhang", "Dera Ghazi Khan", "Gujrat",
        "Sahiwal", "Wah Cantonment", "Mardan", "Kasur", "Okara", "Mingora"
    ].sort();
    const [availableOnly, setAvailableOnly] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [selectedCity, setSelectedCity] = useState("All Cities");
    
    const queryParams = {
        ...(availableOnly && { availableOnly: true }),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(selectedCity !== "All Cities" && { city: selectedCity })
    };

    const { data: response, isLoading: isQueryLoading, isFetching } = useGetDoctorsQuery(queryParams, {
        skip: debouncedSearch.length > 0 && debouncedSearch.trim().length < 2
    });
    const isLoading = isQueryLoading || isFetching;
    
    const router = useRouter();
    const [startConversation] = useStartConversationMutation();

    const doctors = response?.data || [];

    const filteredDoctors = doctors;

    const handleMessageClick = async (doctorId: string) => {
        try {
            const res = await startConversation({ doctorId }).unwrap();
            if (res.success) {
                router.push("/dashboard/patient/chat");
            }
        } catch (err) {
            toast.error("Failed to start chat");
        }
    };



    return (
        <div className="space-y-10">
            {/* Search and Filter Section */}
            <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative group flex-1">
                        <MagnifierIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder={t('patient.findDoctors.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-12 h-14 rounded-2xl border border-border-light bg-white text-base text-text-primary placeholder:text-text-secondary focus:ring-4 focus:ring-primary/5 focus:border-primary focus:outline-none transition-all shadow-sm"
                        />
                        {isFetching && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-5 w-5 animate-spin text-[#00b495]" />
                            </div>
                        )}
                    </div>

                    <div className="relative min-w-[200px]">
                        <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                        <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            className="w-full pl-12 pr-10 h-14 appearance-none rounded-2xl border border-border-light bg-white text-base text-text-primary focus:ring-4 focus:ring-primary/5 focus:border-primary focus:outline-none transition-all shadow-sm cursor-pointer"
                        >
                            {PAKISTANI_CITIES.map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    <button 
                        className="h-14 px-8 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all shrink-0 active:scale-95 cursor-pointer"
                    >
                        {t('common.search')}
                    </button>
                </div>
                {searchQuery.length > 0 && searchQuery.trim().length < 2 && (
                    <p className="text-[#9ca3af] text-[12px] font-inter ml-2">Type at least 2 characters to search</p>
                )}

                {/* Available Only toggle */}
                <div className="flex items-center justify-end">
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={availableOnly}
                            onChange={(e) => setAvailableOnly(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00b495] cursor-pointer"></div>
                        <span className="ml-2 text-xs font-bold text-slate-700">
                            Available Only
                        </span>
                    </label>
                </div>
            </div>

            {/* Doctors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 gap-8 max-w-5xl mx-auto">
                {(isLoading || isFetching) ? (
                    [1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-48 animate-pulse rounded-3xl border border-border-light bg-white" />
                    ))
                ) : filteredDoctors.map((doctor: any) => (
                    <div
                        key={doctor._id}
                        className="group relative bg-white rounded-3xl border border-border-light p-6 transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
                    >
                        <div className="flex items-start gap-5">
                            <div className="relative">
                                <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0 overflow-hidden">
                                    {doctor.photo ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src={doctor.photo.startsWith('http') ? doctor.photo : `${process.env.NEXT_PUBLIC_API_URL}${doctor.photo}`} alt={doctor.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <UserIcon size={36} strokeWidth={1.5} />
                                    )}
                                </div>
                                {doctor.isVerified && (
                                    <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-lg shadow-lg border-2 border-white">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-xl font-bold text-text-primary truncate">
                                        Dr. {doctor.name}
                                    </h3>
                                    <AvailabilityBadge status={doctor.availabilityStatus || "available"} />
                                </div>
                                <p className="text-sm font-bold text-primary mt-1">
                                    {doctor.specialization}
                                </p>

                                <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-widest">
                                    <MapPinIcon size={14} className="text-primary" />
                                    <span className="truncate">{doctor.clinicId?.name || "Private Practice"}</span>
                                </div>

                                <div className="mt-3 flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
                                        <Calendar size={14} className="text-primary" />
                                        {doctor.appointmentsCount || 0} Consults
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                                        <StarIcon size={14} color="currentColor" />
                                        {doctor.rating || "4.8"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-border-light flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{t('doctor.profile.consultationFee')}</span>
                                <span className="text-sm font-extrabold text-text-primary">{Math.round(doctor.consultationFee || 1500).toLocaleString()} {t('common.pkr')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleMessageClick(doctor._id)}
                                    className="p-3 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all"
                                    title={t('patient.findDoctors.sendMessage')}
                                >
                                    <MessageSquare size={18} />
                                </button>
                                <Link
                                    href={`/dashboard/patient/book-appointment?doctorId=${doctor._id}&clinicId=${doctor.clinicId?._id || ""}`}
                                    className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all"
                                >
                                    {t('patient.findDoctors.bookAppointment')}
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredDoctors.length === 0 && (
                <div className="text-center py-24 bg-background/50 rounded-3xl border border-dashed border-border-light">
                    <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MagnifierIcon className="h-10 w-10 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-text-primary">{t('patient.findDoctors.noDoctors')}</p>
                    <p className="text-text-secondary mt-2 font-medium">{t('patient.findDoctors.adjustSearch')}</p>
                </div>
            )}
        </div>
    );
}
