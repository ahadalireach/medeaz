"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"records" | "prescriptions" | "appointments">("records");

  useEffect(() => {
    if (params.patientId) {
      fetchPatientDetail();
    }
  }, [params.patientId]);

  const fetchPatientDetail = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/doctor/patients/${params.patientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPatient(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching patient details:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Patient not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="text-primary hover:text-primary-hover flex items-center gap-2"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Patients
      </button>

      {/* Patient Header */}
      <div className="bg-white p-6 rounded-lg border border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 bg-primary-light rounded-full flex items-center justify-center text-white font-semibold text-2xl">
              {patient.patient?.name?.[0] || "P"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">
                {patient.patient?.name}
              </h1>
              <p className="text-text-secondary">{patient.patient?.email}</p>
              {patient.patient?.phone && (
                <p className="text-text-secondary text-sm mt-1">
                  {patient.patient?.phone}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-text-muted text-sm">Patient since</div>
            <div className="text-black font-semibold">
              {new Date(patient.patient?.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          <div>
            <p className="text-text-muted text-sm">Total Visits</p>
            <p className="text-2xl font-bold text-black mt-1">
              {patient.stats?.totalVisits || 0}
            </p>
          </div>
          <div>
            <p className="text-text-muted text-sm">Prescriptions</p>
            <p className="text-2xl font-bold text-black mt-1">
              {patient.stats?.totalPrescriptions || 0}
            </p>
          </div>
          <div>
            <p className="text-text-muted text-sm">Last Visit</p>
            <p className="text-black font-semibold mt-1">
              {patient.stats?.lastVisit
                ? new Date(patient.stats.lastVisit).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("records")}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === "records"
                ? "text-primary border-b-2 border-primary bg-primary-bg"
                : "text-text-secondary hover:text-primary hover:bg-surface"
            }`}
          >
            Medical Records
          </button>
          <button
            onClick={() => setActiveTab("prescriptions")}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === "prescriptions"
                ? "text-primary border-b-2 border-primary bg-primary-bg"
                : "text-text-secondary hover:text-primary hover:bg-surface"
            }`}
          >
            Prescriptions
          </button>
          <button
            onClick={() => setActiveTab("appointments")}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === "appointments"
                ? "text-primary border-b-2 border-primary bg-primary-bg"
                : "text-text-secondary hover:text-primary hover:bg-surface"
            }`}
          >
            Appointments
          </button>
        </div>

        <div className="p-6">
          {activeTab === "records" && (
            <div className="space-y-4">
              {patient.medicalRecords?.length === 0 ? (
                <p className="text-text-secondary text-center py-8">
                  No medical records found
                </p>
              ) : (
                patient.medicalRecords?.map((record: any) => (
                  <div
                    key={record._id}
                    className="p-4 bg-surface rounded-lg border border-border"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-black">
                        {record.diagnosis}
                      </h3>
                      <span className="text-text-muted text-sm">
                        {new Date(record.visitDate).toLocaleDateString()}
                      </span>
                    </div>
                    {record.chiefComplaint && (
                      <p className="text-text-secondary text-sm">
                        {record.chiefComplaint}
                      </p>
                    )}
                    {record.notes && (
                      <p className="text-text-muted text-sm mt-2">{record.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "prescriptions" && (
            <div className="space-y-4">
              {patient.prescriptions?.length === 0 ? (
                <p className="text-text-secondary text-center py-8">
                  No prescriptions found
                </p>
              ) : (
                patient.prescriptions?.map((prescription: any) => (
                  <div
                    key={prescription._id}
                    className="p-4 bg-surface rounded-lg border border-border cursor-pointer hover:border-primary transition-colors"
                    onClick={() =>
                      router.push(`/doctor/prescriptions/${prescription._id}`)
                    }
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-black">
                        {prescription.diagnosis}
                      </h3>
                      <span className="text-text-muted text-sm">
                        {new Date(prescription.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-text-secondary text-sm">
                      {prescription.medicines?.length || 0} medicine(s) prescribed
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "appointments" && (
            <div className="space-y-4">
              {patient.appointments?.length === 0 ? (
                <p className="text-text-secondary text-center py-8">
                  No appointments found
                </p>
              ) : (
                patient.appointments?.map((appointment: any) => (
                  <div
                    key={appointment._id}
                    className="p-4 bg-surface rounded-lg border border-border"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-black">
                          {appointment.reason}
                        </h3>
                        <p className="text-text-secondary text-sm mt-1">
                          {new Date(appointment.dateTime).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          appointment.status === "completed"
                            ? "bg-surface text-primary"
                            : appointment.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-surface text-primary"
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
