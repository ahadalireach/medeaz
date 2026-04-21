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
          <p className="text-sm text-gray-500 dark:text-[#a1a1aa] py-2">
            {t('common.noResults')}
          </p>
        ) : (
          <div className="space-y-4">
            {doctors.map((doctor) => (
              <button
                key={doctor._id}
                onClick={() => setSelectedDoctorId(doctor._id)}
                className="w-full text-start flex items-start gap-3 rounded-2xl border border-gray-100 p-4 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all hover:border-primary/30 hover:shadow-md group"
              >
                <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-black/5 dark:border-white/10 bg-slate-50 dark:bg-slate-800 flex items-center justify-center transition-transform group-hover:scale-105">
                  {(doctor as any).photo ? (
                    <img
                      src={(doctor as any).photo.startsWith('http') ? (doctor as any).photo : `${process.env.NEXT_PUBLIC_API_URL}${(doctor as any).photo}`}
                      alt={doctor.name || "Doctor"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                    {t('patient.bookAppointmentPage.doctorPrefix')} {doctor.name}
                  </p>
                  <p className="text-sm font-medium text-gray-600 dark:text-[#a1a1aa]">
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
