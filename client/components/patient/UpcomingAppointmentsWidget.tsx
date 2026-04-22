"use client";

import Link from "next/link";
import { Calendar, Clock, Building2 } from "lucide-react";

interface Appointment {
  _id: string;
  dateTime: string;
  reason: string;
  status: string;
  doctorId: {
    name?: string;
    doctorProfile?: {
      fullName?: string;
      specialization?: string;
    };
  };
  clinicId?: {
    name?: string;
    address?: string;
  };
}

interface UpcomingAppointmentsWidgetProps {
  appointments: Appointment[];
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useFormatter, useTranslations } from "next-intl";

export default function UpcomingAppointmentsWidget({ appointments }: UpcomingAppointmentsWidgetProps) {
  const t = useTranslations();
  const format = useFormatter();
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


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format.dateTime(date, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format.dateTime(date, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-surface/50 text-primary  ";
      case "pending":
        return "bg-surface-cream/50 text-[#B45309]  ";
      case "cancelled":
        return "bg-red-100/50 text-red-700  ";
      case "completed":
        return "bg-surface/50 text-primary  ";
      default:
        return "bg-surface/50 text-text-primary  ";
    }
  };

  const getDoctorName = (appointment: Appointment) => {
    return appointment.doctorId?.doctorProfile?.fullName || appointment.doctorId?.name || "Doctor";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">{t('patient.upcomingAppointments')}</CardTitle>
        <Link
          href="/dashboard/patient/appointments"
          className="text-sm font-bold text-primary hover:underline hover:underline-offset-4"
        >
          {t('patient.dashboard.viewAll')}
        </Link>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <p className="mb-4 text-sm text-text-secondary">
              {t('patient.dashboard.noUpcoming')}
            </p>
            <Link
              href="/dashboard/patient/book-appointment"
              className="inline-flex items-center rounded-full bg-primary px-6 py-2 text-sm font-black text-white hover:bg-primary/90 transition-all shadow-lens hover:shadow-lens-hover"
            >
              {t('patient.dashboard.bookNow')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.slice(0, 3).map((appointment) => (
              <div
                key={appointment._id}
                className="group relative rounded-2xl border border-border-light p-5 hover:bg-background :bg-ink-soft/50 transition-all hover:scale-[1.01]"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-text-primary">
                      {t('patient.bookAppointmentPage.doctorPrefix')} {getDoctorName(appointment)}
                    </p>
                    <p className="text-sm font-medium text-text-secondary">
                      {appointment.doctorId?.doctorProfile?.specialization || t('appointment.doctor')}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${getStatusColor(appointment.status)}`}
                  >
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-text-secondary flex-wrap font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    {appointment.dateTime ? formatDate(appointment.dateTime) : "TBD"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    {appointment.dateTime ? formatTime(appointment.dateTime) : "TBD"}
                  </div>
                </div>
                {appointment.clinicId?.name && (
                  <div className="mt-3 space-y-1 text-xs font-bold text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {appointment.clinicId.name}
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Building2 className="h-3.5 w-3.5" />
                      {appointment.clinicId.address || t('common.noData')}
                    </div>
                  </div>
                )}
                {!appointment.clinicId?.name && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-text-secondary">
                    <Building2 className="h-3.5 w-3.5" />
                    {t('appointment.clinic')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
