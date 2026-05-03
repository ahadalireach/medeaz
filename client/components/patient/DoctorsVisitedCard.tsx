"use client";

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  clinicName: string;
}

interface DoctorsVisitedCardProps {
  doctors: Doctor[];
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { User } from "lucide-react";
import { useState } from "react";
import DoctorDetailsModal from "./DoctorDetailsModal";
import { useTranslations } from "next-intl";

export default function DoctorsVisitedCard({ doctors }: DoctorsVisitedCardProps) {
  const t = useTranslations();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t('patient.doctorsVisited')}</CardTitle>
      </CardHeader>
      <CardContent>
        {doctors.length === 0 ? (
          <p className="text-sm text-text-primary py-2">
            {t('common.noResults')}
          </p>
        ) : (
          <div className="space-y-4">
            {doctors.map((doctor) => (
              <button
                key={doctor._id}
                onClick={() => setSelectedDoctorId(doctor._id)}
                className="w-full text-start flex items-start gap-3 rounded-2xl border border-border-light p-4 hover:bg-background :bg-ink-soft/50 transition-all hover:border-primary/30 hover:shadow-md group"
              >
                <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-black/5 bg-background flex items-center justify-center transition-transform group-hover:scale-105 relative">
                  <img
                    src={(doctor as any).photo ? 
                      (((doctor as any).photo.startsWith('http') || (doctor as any).photo.startsWith('data:')) ? (doctor as any).photo : 
                      `${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000'}${((doctor as any).photo.startsWith('/') ? '' : '/')}${(doctor as any).photo}`)
                      : "/medeaz.jpeg"}
                    alt={doctor.name || "Doctor"}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/medeaz.jpeg";
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-text-primary group-hover:text-primary transition-colors">
                    {t('patient.bookAppointmentPage.doctorPrefix')} {doctor.name}
                  </p>
                  <p className="text-sm font-medium text-text-primary">
                    {doctor.specialization}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary mt-1">
                    {doctor.clinicName}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    {selectedDoctorId && (
        <DoctorDetailsModal 
            doctorId={selectedDoctorId} 
            isOpen={!!selectedDoctorId} 
            onClose={() => setSelectedDoctorId(null)} 
        />
    )}
    </>
  );
}
