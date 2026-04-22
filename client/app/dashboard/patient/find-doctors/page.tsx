"use client";

import { useState } from "react";
import { useGetPublicDoctorsQuery } from "@/store/api/patientApi";
import { Search, Star, User, ArrowRight, ShieldCheck, MapPin as LocationIcon, Filter, Building2 } from "lucide-react";
import Link from "next/link";

const SPECIALIZATIONS = [
    "General Physician", "Cardiologist", "Dermatologist", "Pediatrician", 
    "Orthopedic Surgeon", "Gynecologist", "Neurologist", "Ophthalmologist", 
    "ENT Specialist", "Psychiatrist", "Radiologist", "Urologist", 
    "Dentist", "Nutritionist", "Homeopath", "Physiotherapist"
].sort();

const CITIES = [
    "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad",
    "Multan", "Peshawar", "Quetta", "Gujranwala", "Sialkot",
    "Bahawalpur", "Sargodha", "Sukkur", "Larkana", "Sheikhupura",
    "Rahim Yar Khan", "Jhang", "Dera Ghazi Khan", "Gujrat",
    "Sahiwal", "Wah Cantonment", "Mardan", "Kasur", "Okara", "Mingora"
].sort();

import { useTranslations } from "next-intl";

export default function FindDoctorsPage() {
    const t = useTranslations();
    const [filters, setFilters] = useState({
        search: "",
        specialization: "",
        city: "",
        minExperience: 0,
        minRating: 0
    });

    const [isSearching, setIsSearching] = useState(false);

    const { data: response, isLoading: queryLoading } = useGetPublicDoctorsQuery(filters);
    const isLoading = queryLoading || isSearching;
    const doctors = response?.data || [];

    const handleSearch = () => {
        setIsSearching(true);
        setTimeout(() => setIsSearching(false), 800);
    };

    // Frontend-only City filter for now
    const filteredDoctors = doctors.filter((doc: any) => {
        if (filters.city) {
            const cityLower = filters.city.toLowerCase();
            const cityMatch = doc.location?.city?.toLowerCase().includes(cityLower) ||
                doc.clinicId?.address?.toLowerCase().includes(cityLower) ||
                doc.location?.address?.toLowerCase().includes(cityLower);
            if (!cityMatch) return false;
        }
        return true;
    });

    return (
        <div className="flex flex-col lg:flex-row gap-8 max-w-[1550px] mx-auto pb-20 px-4">

            {/* Sidebar Filters */}
            <aside className="w-full lg:w-80 flex-shrink-0 space-y-6">
                <div className="bg-white rounded-[2rem] p-6 shadow-lens border border-black/5 sticky top-24">
                    <div className="flex items-center gap-2 mb-6 text-text-primary">
                        <Filter size={20} className="text-primary" />
                        <h2 className="text-xl font-bold tracking-tight">{t('patient.findDoctors.filters')}</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Search */}
                        <div>
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">{t('common.search')}</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                                <input
                                    type="text"
                                    placeholder={t('patient.findDoctors.searchPlaceholder')}
                                    className="w-full pl-11 pr-4 h-12 text-sm rounded-xl border border-border-light bg-white text-text-primary placeholder:text-text-secondary focus:ring-4 focus:ring-primary/5 focus:border-primary-hover focus:outline-none transition-all shadow-sm"
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                />
                            </div>
                        </div>

                        {/* Specialization */}
                        <div>
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">{t('doctor.profile.specialization')}</label>
                            <select
                                className="lens-input w-full h-12 text-sm appearance-none bg-no-repeat"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundSize: `1.5em 1.5em` }}
                                value={filters.specialization}
                                onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                            >
                                <option value="">{t('patient.findDoctors.allSpecializations')}</option>
                                {SPECIALIZATIONS.map(spec => (
                                    <option key={spec} value={spec}>{spec}</option>
                                ))}
                            </select>
                        </div>

                        {/* City */}
                        <div>
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">{t('form.city')}</label>
                            <select
                                className="lens-input w-full h-12 text-sm appearance-none bg-no-repeat"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundSize: `1.5em 1.5em` }}
                                value={filters.city}
                                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                            >
                                <option value="">{t('patient.findDoctors.anyLocation')}</option>
                                {CITIES.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>

                        {/* Experience Slider */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">{t('doctor.profile.experience')}</label>
                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{t('patient.findDoctors.yearsCount', { n: filters.minExperience })}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="30"
                                className="w-full accent-primary"
                                value={filters.minExperience}
                                onChange={(e) => setFilters({ ...filters, minExperience: parseInt(e.target.value) })}
                            />
                            <div className="flex justify-between text-xs text-text-secondary font-medium mt-1">
                                <span>0 {t('patient.findDoctors.years')}</span>
                                <span>30+ {t('patient.findDoctors.years')}</span>
                            </div>
                        </div>

                        {/* Reset */}
                        <div className="flex flex-col gap-3 pt-4 border-t border-black/5">
                            <button
                                onClick={handleSearch}
                                className="w-full h-12 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] transition-all"
                            >
                                {t('patient.findDoctors.searchDoctors')}
                            </button>
                            <button
                                onClick={() => setFilters({ search: "", specialization: "", city: "", minExperience: 0, minRating: 0 })}
                                className="w-full text-xs font-bold text-text-secondary hover:text-text-primary :text-white transition-colors uppercase tracking-widest"
                            >
                                {t('common.clearAll')}
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Results */}
            <main className="flex-1 space-y-6">
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary tracking-tight">{t('patient.findDoctors.title')}</h1>
                        <p className="text-text-secondary mt-1 font-medium">
                            {t('patient.findDoctors.foundDoctors', { count: filteredDoctors.length })}
                        </p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(n => (
                            <div key={n} className="h-64 rounded-[2rem] bg-surface animate-pulse" />
                        ))}
                    </div>
                ) : filteredDoctors.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-[2.5rem] border border-black/5 shadow-lens">
                        <div className="h-20 w-20 mx-auto bg-background rounded-full flex items-center justify-center mb-6">
                            <Search className="h-10 w-10 text-text-secondary" />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary">{t('patient.findDoctors.noDoctors')}</h3>
                        <p className="text-text-secondary mt-2 font-medium max-w-sm mx-auto">
                            {t('patient.findDoctors.adjustSearch')}
                        </p>
                        <button
                            onClick={() => setFilters({ search: "", specialization: "", city: "", minExperience: 0, minRating: 0 })}
                            className="mt-6 px-6 py-2 bg-primary/10 text-primary font-bold rounded-full hover:bg-primary hover:text-white transition-colors"
                        >
                            {t('common.clearAll')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 gap-8">
                        {filteredDoctors.map((doc: any) => (
                            <div key={doc._id} className="group relative bg-white rounded-[2rem] p-6 border border-black/5 shadow-lens hover:border-primary/20 transition-all duration-300">

                                <div className="flex gap-5">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-background border-2 border-border-light group-hover:border-primary/30 transition-all flex items-center justify-center">
                                            {doc.userId?.photo ? (
                                                <img src={doc.userId.photo.startsWith('http') ? doc.userId.photo : `${process.env.NEXT_PUBLIC_API_URL}${doc.userId.photo}`} alt={doc.userId?.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-surface">
                                                    <User size={40} className="text-text-secondary" />
                                                </div>
                                            )}
                                        </div>
                                        {doc.isVerified && (
                                            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm">
                                                <div className="bg-primary text-white p-1 rounded-full">
                                                    <ShieldCheck size={12} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 pt-1">
                                        <h3 className="text-lg font-bold text-text-primary truncate">{t('patient.bookAppointmentPage.doctorPrefix')} {doc.userId?.name}</h3>
                                        <p className="text-primary font-semibold text-sm truncate">{doc.specialization}</p>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
                                                <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                                                <span>{doc.averageRating > 0 ? doc.averageRating.toFixed(1) : t('patient.findDoctors.new')}</span>
                                                {doc.totalReviews > 0 && <span className="font-medium">({doc.totalReviews})</span>}
                                            </div>

                                            <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary">
                                                <Building2 className="w-3.5 h-3.5 text-primary" />
                                                <span className="truncate max-w-[120px]">
                                                    {(doc.clinicId?.name && !doc.clinicId.name.includes("#")) ? doc.clinicId.name : (doc.clinicId?.name?.includes("#") ? "MedEaz Health Clinic" : "Private Practice")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 p-4 rounded-2xl bg-background">
                                    <div>
                                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">{t('doctor.profile.specialization')}</p>
                                        <p className="text-sm font-bold text-text-primary truncate">{doc.specialization}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">{t('doctor.profile.experience')}</p>
                                        <p className="text-sm font-bold text-text-primary">{t('patient.findDoctors.yearsCount', { n: doc.experience || 0 })}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">{t('doctor.profile.consultationFee')}</p>
                                        <p className="text-sm font-bold text-text-primary">{t('common.pkr')} {doc.consultationFee || "TBD"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">{t('patient.findDoctors.clinic')}</p>
                                        <p className="text-sm font-bold text-text-primary truncate max-w-[150px]">{(doc.clinicId?.name && !doc.clinicId.name.includes("#")) ? doc.clinicId.name : (doc.clinicId?.name?.includes("#") ? "MedEaz Health Clinic" : "Private Practice")}</p>
                                    </div>
                                </div>

                                <Link href={`/dashboard/patient/book-appointment?doctorId=${doc._id}`} className="mt-6 flex items-center justify-center w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover shadow-lg hover:shadow-primary/25 transition-all">
                                    {t('patient.bookAppointment')}
                                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </Link>

                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
