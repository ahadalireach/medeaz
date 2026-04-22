"use client";

import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
    Calendar,
    Activity,
    Pill,
    FileText,
    Droplet,
    Clock
} from "lucide-react";
import {
    MapPinIcon,
    UserIcon,
    FileDescriptionIcon,
    DownloadIcon,
    ClockIcon,
    GmailIcon,
    PhoneVolumeIcon
} from "@/icons";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { useFormatter, useTranslations } from "next-intl";

interface AppointmentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: any;
    loading?: boolean;
}

export default function AppointmentDetailModal({
    isOpen,
    onClose,
    appointment,
    loading = false
}: AppointmentDetailModalProps) {
    const t = useTranslations();
    const formatIntl = useFormatter();
    if (!appointment && !loading) return null;

    const handleDownloadPDF = () => {
        window.print();
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case "completed": return "teal";
            case "confirmed": return "blue";
            case "pending": return "yellow";
            case "reserved": return "yellow";
            case "cancelled": return "red";
            case "in-progress": return "purple";
            default: return "slate";
        }
    };

    const getStatusLabel = (status: string) => {
        const normalized = (status || "").toLowerCase();
        const labels: Record<string, string> = {
            pending: t('appointment.status.pending'),
            confirmed: t('appointment.status.confirmed'),
            reserved: t('appointment.status.reserved'),
            accepted: t('appointment.status.accepted'),
            completed: t('appointment.status.completed'),
            cancelled: t('appointment.status.cancelled'),
            'in-progress': t('appointment.status.in-progress'),
        };

        return labels[normalized] || normalized.replace(/-/g, " ");
    };

    const clinicName = appointment?.clinicId?.name || appointment?.clinic?.name || t('appointment.clinic');
    const clinicAddress = appointment?.clinicId?.address || appointment?.clinic?.address || t('common.noData');

    const resolveImageUrl = (photo?: string | null) => {
        if (!photo) return "";
        const trimmed = String(photo).trim();
        if (!trimmed) return "";
        if (/^https?:\/\//i.test(trimmed)) return trimmed;

        const baseApi = process.env.NEXT_PUBLIC_API_URL || "";
        const defaultApiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:5002";
        const baseOrigin = baseApi ? baseApi.replace(/\/api\/?$/, "") : defaultApiOrigin;
        if (!baseOrigin) return "";

        const normalizedPath = trimmed.startsWith("/")
            ? trimmed
            : trimmed.startsWith("uploads/")
                ? `/${trimmed}`
                : `/uploads/${trimmed}`;
        try {
            return new URL(normalizedPath, baseOrigin).toString();
        } catch {
            return "";
        }
    };

    const patientPhotoUrl = resolveImageUrl(appointment?.patient?.photo);
    const doctorPhotoUrl = resolveImageUrl(appointment?.doctor?.photo);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('doctor.appointments.viewDetails')}
            size="lg"
        >
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-text-secondary font-medium">{t('common.loading')}</p>
                </div>
            ) : (
                <div className="space-y-8 pb-4">
                    {/* Header Info */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-background rounded-4xl border border-border-light">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Calendar className="h-7 w-7 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">{t('common.date')}</p>
                                <p className="text-lg font-black text-text-primary">
                                    {appointment.dateTime ? formatIntl.dateTime(new Date(appointment.dateTime), { dateStyle: 'full' }) : t('common.noData')}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-sm font-medium text-text-secondary">
                                    <ClockIcon className="h-4 w-4" />
                                    {appointment.dateTime ? formatIntl.dateTime(new Date(appointment.dateTime), { hour: 'numeric', minute: '2-digit', hour12: true }) : t('common.noData')} ({appointment.duration || 0} {t('common.mins')})
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <Badge variant={getStatusColor(appointment.status)} className="mb-2">
                                {getStatusLabel(appointment.status)}
                            </Badge>
                            <div className="text-xs font-bold text-text-secondary uppercase tracking-widest">
                                {t('common.type')}: <span className="text-text-primary ml-1">{appointment.type}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Patient Section */}
                        <div className="space-y-4 p-6 rounded-4xl bg-white border border-border-light">
                            <div className="flex items-center gap-2">
                                <UserIcon className="h-5 w-5 text-primary" />
                                <h3 className="text-lg font-black text-text-primary">{t('clinic.appointments.patient')}</h3>
                            </div>

                            <div className="flex items-center gap-4 py-2">
                                <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-border-light bg-background flex items-center justify-center">
                                    {appointment.patient?.photo ? (
                                        patientPhotoUrl ? (
                                            <div className="relative h-full w-full">
                                                <UserIcon className="h-6 w-6 text-text-secondary absolute inset-0 m-auto" />
                                                <img
                                                    src={patientPhotoUrl}
                                                    alt={appointment.patient.name || t('clinic.appointments.patient')}
                                                    className="h-full w-full object-cover relative z-10"
                                                    onError={(e) => {
                                                        (e.currentTarget as HTMLImageElement).style.display = "none";
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <UserIcon className="h-6 w-6 text-text-secondary" />
                                        )
                                    ) : (
                                        <UserIcon className="h-6 w-6 text-text-secondary" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-text-primary">{appointment.patient?.name}</p>
                                    <p className="text-sm text-text-secondary">{appointment.patient?.email || t('common.noData')}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="p-3 bg-background rounded-2xl">
                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-tighter">{t('patient.profile.bloodGroup')}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <Droplet className="h-3 w-3 text-red-500" />
                                        <span className="font-bold text-text-primary">{appointment.patient?.bloodGroup || "O+"}</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-background rounded-2xl">
                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-tighter">{t('form.phone')}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <PhoneVolumeIcon className="h-3 w-3 text-text-secondary" />
                                        <span className="font-bold text-text-primary break-all">{appointment.patient?.contact || t('common.noData')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Doctor Section */}
                        <div className="space-y-4 p-6 rounded-4xl bg-white border border-border-light">
                            <div className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" />
                                <h3 className="text-lg font-black text-text-primary">{t('clinic.appointments.doctor')}</h3>
                            </div>

                            <div className="flex items-center gap-4 py-2">
                                <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-border-light bg-background flex items-center justify-center">
                                    {appointment.doctor?.photo ? (
                                        doctorPhotoUrl ? (
                                            <div className="relative h-full w-full">
                                                <UserIcon className="h-6 w-6 text-text-secondary absolute inset-0 m-auto" />
                                                <img
                                                    src={doctorPhotoUrl}
                                                    alt={appointment.doctor.name || t('appointment.doctor')}
                                                    className="h-full w-full object-cover relative z-10"
                                                    onError={(e) => {
                                                        (e.currentTarget as HTMLImageElement).style.display = "none";
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <UserIcon className="h-6 w-6 text-text-secondary" />
                                        )
                                    ) : (
                                        <UserIcon className="h-6 w-6 text-text-secondary" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-text-primary">
                                        {t('patient.bookAppointmentPage.doctorPrefix')} {appointment.doctor?.name}
                                    </p>
                                    <p className="text-sm text-primary font-bold">{appointment.doctor?.specialization}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4 text-sm font-medium text-text-secondary">
                                <MapPinIcon className="h-4 w-4 shrink-0 text-text-secondary" />
                                <span className="line-clamp-1">{clinicName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                                <MapPinIcon className="h-4 w-4 shrink-0 text-text-secondary" />
                                <span className="line-clamp-1">{clinicAddress}</span>
                            </div>
                        </div>
                    </div>

                    {/* Prescription Section */}
                    <div className="p-8 rounded-[2.5rem] bg-ink-soft text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -ml-24 -mb-24" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                        <Pill className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-black tracking-tight">{t('doctor.prescriptions.title')}</h3>
                                </div>
                                {appointment.prescription && (
                                    <Button
                                        onClick={handleDownloadPDF}
                                        size="sm"
                                        className="bg-white/10 hover:bg-white/20 border-white/10 text-white"
                                    >
                                        <DownloadIcon className="h-4 w-4 mr-2" />
                                        {t('common.view')}
                                    </Button>
                                )}
                            </div>

                            {!appointment.prescription ? (
                                <div className="py-8 flex flex-col items-center justify-center bg-white/5 rounded-4xl border border-white/5">
                                    <FileDescriptionIcon className="h-10 w-10 text-white/20 mb-3" />
                                    <p className="font-bold text-white/40">{t('doctor.prescriptions.noPrescriptions')}</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Diagnosis */}
                                    <div className="p-5 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">{t('doctor.diagnosis')}</p>
                                        <p className="text-lg font-bold leading-relaxed">{appointment.prescription.diagnosis}</p>
                                    </div>

                                    {/* Medicines Grid */}
                                    <div>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 ml-4">{t('doctor.prescriptions.table.medicines')}</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {appointment.prescription.medicines?.map((med: any, idx: number) => (
                                                <div key={idx} className="p-4 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-3 group/med hover:bg-white/10 transition-colors">
                                                    <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                                                    <div>
                                                        <p className="font-black text-sm">{med.name}</p>
                                                        <p className="text-xs text-white/40 font-bold">{med.dosage} — {med.duration}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Follow Up & Notes */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-5 bg-white/5 rounded-3xl border border-white/5">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{t('doctor.notes')}</p>
                                            <p className="text-xs text-white/60 font-medium leading-relaxed line-clamp-2">
                                                "{appointment.prescription.notes || t('common.noData')}"
                                            </p>
                                        </div>
                                        <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex flex-col justify-center">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{t('doctor.followUp')}</p>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-primary" />
                                                <p className="font-black text-lg">
                                                    {appointment.prescription.followUpDate ? formatIntl.dateTime(new Date(appointment.prescription.followUpDate), { dateStyle: 'medium' }) : t('common.noData')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Consultation Fees */}
                                    <div className="pt-2 flex justify-end">
                                        <div className="px-6 py-3 bg-primary rounded-2xl shadow-[0_8px_30px_rgb(20,184,166,0.3)] text-right">
                                            <p className="text-[10px] font-black text-primary/70 uppercase tracking-widest leading-none">{t('doctor.profile.consultationFee')}</p>
                                            <p className="text-2xl font-black mt-1">
                                                {appointment.prescription.totalCost?.toLocaleString() || appointment.prescription.consultationFee?.toLocaleString() || '0'} {t('common.pkr')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
