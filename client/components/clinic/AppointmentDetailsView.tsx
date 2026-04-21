"use client";

import { useGetAppointmentByIdQuery } from "@/store/api/clinicApi";
import { format } from "date-fns";
import { Calendar, Clock, FileText, Activity, User, BriefcaseMedical, CircleDollarSign, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function AppointmentDetailsView({ appointmentId }: { appointmentId: string }) {
    const t = useTranslations();
    const { data, isLoading, error } = useGetAppointmentByIdQuery(appointmentId);

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                    <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                </div>
            </div>
        );
    }

    const appointment = data?.data;

    if (error || !appointment) {
        return (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">Failed to load appointment details.</p>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
            confirmed: "bg-primary/20 text-primary border border-primary/30",
            accepted: "bg-primary/20 text-primary border border-primary/30",
            completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
            cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
        };

        return (
            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${styles[status] || styles.pending}`}>
                {t(`common.status.${status}`) || status.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0 text-primary">
                            <Calendar className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                {t('clinic.dashboard.scheduledFor')}
                            </p>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {format(new Date(appointment.dateTime), "MMMM dd, yyyy")}
                                </h2>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <p className="text-xl font-medium text-primary">
                                    {format(new Date(appointment.dateTime), "h:mm a")}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col md:items-end gap-2">
                        {getStatusBadge(appointment.status)}
                        <p className="text-sm font-medium bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full uppercase tracking-wider mt-2 inline-block">
                            {appointment.type || "CONSULTATION"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient Block */}
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="h-20 w-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500 ring-4 ring-blue-50 dark:ring-blue-900/10">
                            {appointment.patientId?.photo ? (
                                <img src={appointment.patientId.photo} alt="Patient" className="h-full w-full rounded-full object-cover" />
                            ) : (
                                <User className="h-10 w-10" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {appointment.patientId?.name || t('common.noData')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('patient.dashboard.viewDetails')}</p>
                        </div>
                        <div className="w-full pt-4 space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700/50">
                                <span className="text-sm text-gray-500 dark:text-gray-400">{t('form.email')}</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{appointment.patientId?.email || t('common.noData')}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">{t('form.phone')}</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white break-all">{appointment.patientId?.phone || t('common.noData')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Doctor Block */}
                <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center text-primary ring-4 ring-primary/5">
                            {appointment.doctorId?.photo ? (
                                <img src={appointment.doctorId.photo} alt="Doctor" className="h-full w-full rounded-full object-cover" />
                            ) : (
                                <BriefcaseMedical className="h-10 w-10" />
                            )}
                        </div>
                        <div>
                            <Link href={`/dashboard/clinic_admin/doctors/${appointment.doctorId?._id}`} className="hover:underline">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {t('common.doctorPrefix')} {appointment.doctor?.fullName || appointment.doctorId?.name || t('common.noData')}
                                </h3>
                            </Link>
                            <p className="text-sm text-primary font-medium mt-1">
                                {appointment.doctorId?.doctorProfile?.specialization || t('common.noData')}
                            </p>
                        </div>
                        <div className="w-full pt-4 space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700/50">
                                <span className="text-sm text-gray-500 dark:text-gray-400">{t('form.email')}</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{appointment.doctorId?.email || t('common.noData')}</span>
                            </div>
                            <Link 
                                href={`/dashboard/clinic_admin/doctors/${appointment.doctorId?._id}`}
                                className="flex justify-between items-center py-2 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded-lg px-2 -mx-2 transition-colors group"
                            >
                                <span className="text-sm text-gray-500 dark:text-gray-400">{t('clinic.dashboard.viewProfile')}</span>
                                <span className="text-sm font-bold text-primary group-hover:underline">{t('common.viewAll')} →</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-400" />
                    {t('clinic.dashboard.clinicalFinancialDetails')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('common.patientReason')}</h4>
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                <p className="text-gray-700 dark:text-gray-300 ">
                                    "{appointment.reason || t('common.noResults')}"
                                </p>
                            </div>
                        </div>
                        {appointment.notes && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('common.doctorNotes')}</h4>
                                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 p-4 rounded-lg">
                                    <p className="text-yellow-800 dark:text-yellow-200">
                                        {appointment.notes}
                                    </p>
                                </div>
                            </div>
                        )}
                        {appointment.cancellationReason && (
                            <div>
                                <h4 className="text-sm font-medium text-red-500 uppercase tracking-wider mb-2">{t('common.cancellationReason')}</h4>
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-lg">
                                    <p className="text-red-800 dark:text-red-400">
                                        {appointment.cancellationReason}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 border border-green-100 dark:border-green-800/50 p-6 rounded-xl relative overflow-hidden">
                            <div className="absolute right-0 top-0 opacity-10">
                                <CircleDollarSign className="w-48 h-48 -mr-12 -mt-12 text-green-600 dark:text-green-400" />
                            </div>
                            <h4 className="text-sm font-bold text-green-800 dark:text-green-400 uppercase tracking-wider mb-6 relative z-10">
                                Revenue Breakdown
                            </h4>
                            <div className="space-y-4 relative z-10">
                                <div className="flex items-center justify-between pb-4 border-b border-green-200 dark:border-green-800/40">
                                    <span className="text-green-700 dark:text-green-300 font-medium">{t('common.totalFeesProcessed')}</span>
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">{(appointment.totalFee || 0).toLocaleString()} {t('common.pkr')}</span>
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-green-700 dark:text-green-300 font-medium flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        {t('common.clinicShare')} (20%)
                                    </span>
                                    <span className="text-2xl font-black text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-sm border border-green-100 dark:border-green-800/50">
                                        {(appointment.clinicRevenue || 0).toLocaleString()} {t('common.pkr')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {appointment.prescriptionId && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-6 rounded-xl">
                                <h4 className="text-sm font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    {t('doctor.prescriptions.title')}
                                </h4>
                                <p className="text-blue-700 dark:text-blue-300 mb-4 text-sm">
                                    A prescription has been created for this appointment containing medications or tests.
                                </p>
                                <div className="flex gap-3">
                                    <Link href={`/dashboard/clinic_admin/prescriptions/${appointment.prescriptionId._id}`} className="flex-1">
                                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors">
                                            {t('prescription.medicalPrescription')}
                                        </button>
                                    </Link>
                                    <button 
                                        onClick={() => window.print()}
                                        className="px-4 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 py-2 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                    >
                                        {t('common.download')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
