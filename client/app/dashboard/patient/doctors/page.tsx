"use client";

import DoctorsList from "@/components/patient/DoctorsList";

export default function DoctorsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Our Specialist Doctors
                </h1>
                <p className="text-gray-500 dark:text-[#a1a1aa]">
                    Find and book appointments with top-rated medical professionals.
                </p>
            </div>

            <DoctorsList />
        </div>
    );
}
