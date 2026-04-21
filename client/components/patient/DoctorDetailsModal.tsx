"use client";

import { useGetPublicDoctorByIdQuery } from "@/store/api/patientApi";
import { Modal } from "../ui/Modal";
import { User, MapPin, Building2, Phone, Calendar, Star, ShieldCheck, GraduationCap, Globe, Clock, MessageSquare, DollarSign } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStartConversationMutation } from "@/store/api/chatApi";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useTranslations } from "next-intl";

interface DoctorDetailsModalProps {
    doctorId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function DoctorDetailsModal({ doctorId, isOpen, onClose }: DoctorDetailsModalProps) {
    const t = useTranslations('patient.doctorProfile');
    const ct = useTranslations('common');
    const bt = useTranslations('patient.bookAppointmentPage');
    const { data: response, isLoading } = useGetPublicDoctorByIdQuery(doctorId, { skip: !isOpen });
    const doctor = response?.data;
    const router = useRouter();
    const { user } = useSelector((state: RootState) => state.auth);
    const [startConversation] = useStartConversationMutation();

    const handleMessageClick = async () => {
        try {
            const targetUserId = doctor.userId?._id || doctor.userId;
            if (!targetUserId) {
                toast.error("Doctor's user account not found");
                return;
            }
            if (!user?._id) {
                toast.error("Please login to start chat");
                return;
            }
            // Explicitly pass both IDs to avoid backend validation errors
            const res = await startConversation({ 
                doctorId: targetUserId,
                patientId: user._id 
            }).unwrap();
            
            if (res.success) {
                toast.success("Starting conversation...");
                router.push("/dashboard/patient/chat");
            }
        } catch (err) {
            console.error("Chat start error:", err);
            toast.error("Failed to start chat");
        }
    };

    if (isLoading) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title={t('title')} size="xl">
                <div className="flex flex-col gap-6 animate-pulse">
                    <div className="flex items-center gap-6">
                        <div className="h-24 w-24 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
                        <div className="flex-1 space-y-3">
                            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800/50 rounded-2xl" />
                        ))}
                    </div>
                </div>
            </Modal>
        );
    }

    if (!isLoading && !doctor) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title={t('profileNotFound')} size="md">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-20 w-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                        <User size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('doctorNotFound')}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">{t('doctorNotFoundDesc')}</p>
                    <button onClick={onClose} className="mt-6 px-8 py-2 bg-primary text-white font-bold rounded-xl shadow-lg">{ct('close')}</button>
                </div>
            </Modal>
        );
    }

    const doctorPhoto = doctor.userId?.photo 
        ? (doctor.userId.photo.startsWith('http') ? doctor.userId.photo : `${process.env.NEXT_PUBLIC_API_URL}${doctor.userId.photo}`)
        : null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('title')} size="xl">
            <div className="flex flex-col gap-8">
                {/* Header Info */}
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="relative">
                        <div className="h-32 w-32 rounded-3xl overflow-hidden border-4 border-primary/10 shadow-xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-center">
                            {doctorPhoto ? (
                                <img src={doctorPhoto} alt={doctor.fullName} className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-16 w-16 text-slate-300" />
                            )}
                        </div>
                        {doctor.isVerified && (
                            <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-2xl shadow-lg border-4 border-white dark:border-zinc-900">
                                <ShieldCheck size={16} />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                                {bt('doctorPrefix')} {doctor.userId?.name || doctor.fullName}
                            </h2>
                            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                                {doctor.specialization}
                            </span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-2xl">
                            {doctor.bio || t('professionalSummary', { clinic: doctor.clinicId?.name || "MedEaz Clinic" })}
                        </p>
                        
                        <div className="flex flex-wrap gap-6 pt-2">
                            <div className="flex items-center gap-2.5 text-sm font-bold text-gray-700 dark:text-gray-300">
                                <div className="h-6 w-6 bg-amber-500/10 rounded-full flex items-center justify-center">
                                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                </div>
                                <span>{doctor.averageRating || "4.8"} <span className="text-gray-400 font-medium">({doctor.totalReviews || 0} {t('reviews')})</span></span>
                            </div>
                            <div className="flex items-center gap-2.5 text-sm font-bold text-gray-700 dark:text-gray-300">
                                <div className="h-6 w-6 bg-primary/10 rounded-full flex items-center justify-center">
                                    <Building2 className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <span className="max-w-[180px] truncate">
                                    {doctor.clinicId?.name || "MedEaz Clinic"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Practical Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    <div className="p-4 md:p-5 bg-slate-50 dark:bg-zinc-800/40 rounded-3xl border border-black/5 dark:border-white/5 group hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-3 mb-2 md:mb-3">
                            <div className="h-8 w-8 md:h-10 md:w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                <MapPin size={18} />
                            </div>
                            <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('location')}</span>
                        </div>
                        <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white truncate">
                            {doctor.clinicId?.address || doctor.location?.address || "Islamabad, PK"}
                        </p>
                    </div>

                    <div className="p-4 md:p-5 bg-slate-50 dark:bg-zinc-800/40 rounded-3xl border border-black/5 dark:border-white/5 group hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-3 mb-2 md:mb-3">
                            <div className="h-8 w-8 md:h-10 md:w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                <DollarSign size={18} />
                            </div>
                            <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('fee')}</span>
                        </div>
                        <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">
                            {ct('pkr')} {doctor.consultationFee || "1,500"}
                        </p>
                    </div>

                    <div className="p-4 md:p-5 bg-slate-50 dark:bg-zinc-800/40 rounded-3xl border border-black/5 dark:border-white/5 group hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-3 mb-2 md:mb-3">
                            <div className="h-8 w-8 md:h-10 md:w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                <Clock size={18} />
                            </div>
                            <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('experience')}</span>
                        </div>
                        <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">
                            {t('yearsActive', { n: doctor.experience || 0 })}
                        </p>
                    </div>

                    <div className="p-4 md:p-5 bg-slate-50 dark:bg-zinc-800/40 rounded-3xl border border-black/5 dark:border-white/5 group hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-3 mb-2 md:mb-3">
                            <div className="h-8 w-8 md:h-10 md:w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                <GraduationCap size={18} />
                            </div>
                            <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('education')}</span>
                        </div>
                        <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white truncate">
                            {Array.isArray(doctor.education) && doctor.education.length > 0
                                ? doctor.education[0].degree
                                : "MBBS, MD"}
                        </p>
                    </div>

                    <div className="p-4 md:p-5 bg-slate-50 dark:bg-zinc-800/40 rounded-3xl border border-black/5 dark:border-white/5 group hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-3 mb-2 md:mb-3">
                            <div className="h-8 w-8 md:h-10 md:w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                <Globe size={18} />
                            </div>
                            <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('languages')}</span>
                        </div>
                        <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white truncate">
                            {doctor.languages?.[0] || "English"}, {doctor.languages?.[1] || "Urdu"}
                        </p>
                    </div>

                    <div className="p-4 md:p-5 bg-slate-50 dark:bg-zinc-800/40 rounded-3xl border border-black/5 dark:border-white/5 group hover:border-primary/20 transition-all">
                        <div className="flex items-center gap-3 mb-2 md:mb-3">
                            <div className="h-8 w-8 md:h-10 md:w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                <Phone size={18} />
                            </div>
                            <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('contact')}</span>
                        </div>
                        <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">
                            {t('contactViaChat')}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-black/5 dark:border-white/5">
                    <button 
                        onClick={handleMessageClick}
                        className="flex-1 h-14 bg-white dark:bg-zinc-900 text-primary border-2 border-primary/20 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:bg-primary hover:text-white hover:border-primary transition-all group active:scale-[0.98]"
                    >
                        <MessageSquare className="h-5 w-5 group-hover:scale-110 transition-transform" strokeWidth={3} />
                        {t('consultViaChat')}
                    </button>
                    <Link 
                        href={`/dashboard/patient/book-appointment?doctorId=${doctor._id}&clinicId=${doctor.clinicId?._id || ""}`}
                        className="flex-1 h-14 bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/25 hover:bg-primary-hover hover:-translate-y-0.5 transition-all group active:scale-[0.98]"
                    >
                        <Calendar className="h-5 w-5 group-hover:scale-110 transition-transform" strokeWidth={3} />
                        {t('getAppointment')}
                    </Link>
                </div>
            </div>
        </Modal>
    );
}
