"use client";

import { useState, useEffect } from "react";
import { useGetPatientsQuery, useDeletePatientMutation } from "@/store/api/doctorApi";
import Link from "next/link";
import { Search, User, Calendar as CalendarIcon, Loader, Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; patientId: string; patientName: string }>({
    isOpen: false,
    patientId: "",
    patientName: "",
  });

  const [deletePatient, { isLoading: deleting }] = useDeletePatientMutation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isFetching } = useGetPatientsQuery({ search: debouncedSearch, limit: 100 });

  const patients = data?.data?.patients || [];

  const handleDeleteClick = (e: React.MouseEvent, patientId: string, patientName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, patientId, patientName });
  };

  const handleDeleteConfirm = async () => {
    const toastId = toast.loading("Deleting patient...");
    setDeletingId(deleteConfirm.patientId);

    try {
      await deletePatient(deleteConfirm.patientId).unwrap();
      toast.success("Patient removed successfully", { id: toastId });
      setDeleteConfirm({ isOpen: false, patientId: "", patientName: "" });
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete patient", { id: toastId });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, patientId: "", patientName: "" })}
        onConfirm={handleDeleteConfirm}
        title="Delete Patient"
        message={`Are you sure you want to delete ${deleteConfirm.patientName}? This will permanently remove all their records and cannot be undone.`}
        confirmText="Delete Patient"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-black">My Patients</h1>
          <p className="text-text-secondary mt-2 text-lg">
            View and manage your patient records
          </p>
        </div>
        <Link
          href="/dashboard/doctor/patients/new"
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all shadow-lg"
        >
          <Plus className="h-5 w-5" />
          Add Patient
        </Link>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-border-light">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-muted" />
          <input
            type="text"
            placeholder="Search patients by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-transparent rounded-xl focus:outline-none focus:border-primary bg-surface/30 text-black placeholder:text-text-muted"
          />
          {isFetching && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <Loader className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-20 w-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-text-muted" />
            </div>
            <p className="text-text-secondary text-lg font-medium">No patients found</p>
            <p className="text-text-muted text-sm mt-1">
              {search ? "Try adjusting your search" : "Your patient list is empty"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-light">
            {patients.map((patient: any) => (
              <div key={patient._id} className="relative group">
                <Link
                  href={`/dashboard/doctor/patients/${patient._id}`}
                  className="block p-6 hover:bg-surface/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-2xl">
                        {patient.name?.[0]?.toUpperCase() || "P"}
                      </div>
                      <div>
                        <h3 className="font-bold text-black text-xl">
                          {patient.name || "Unnamed Patient"}
                        </h3>
                        <p className="text-text-secondary text-sm flex items-center gap-2 mt-1">
                          <User className="h-4 w-4" />
                          {patient.email || "No email"}
                        </p>
                        {patient.phone && (
                          <p className="text-text-muted text-xs mt-1">{patient.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {patient.lastVisit && (
                        <div className="flex items-center gap-2 text-text-secondary text-sm mb-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Last visit: {new Date(patient.lastVisit).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={(e) => handleDeleteClick(e, patient._id, patient.name)}
                  disabled={deletingId === patient._id}
                  className="absolute top-4 right-4 p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  title="Delete patient"
                >
                  {deletingId === patient._id ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
