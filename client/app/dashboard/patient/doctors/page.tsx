"use client";

import DoctorsList from "@/components/patient/DoctorsList";
import PageHeader from "@/components/shared/PageHeader";

export default function DoctorsPage() {
    return (
        <div className="space-y-6">
            <PageHeader 
                title="Our Specialist Doctors" 
                description="Find and book appointments with top-rated medical professionals." 
            />

            <DoctorsList />
        </div>
    );
}
