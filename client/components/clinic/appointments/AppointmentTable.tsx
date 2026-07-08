"use client";

import { format } from "date-fns";
import { Eye, Trash2 } from "lucide-react";
import { useState } from "react";
import { useGetAppointmentByIdQuery, useDeleteAppointmentMutation } from "@/store/api/clinicApi";
import AppointmentDetailModal from "../../AppointmentDetailModal";
import AppointmentStatusBadge from "./AppointmentStatusBadge";
import AppointmentEmptyState from "./AppointmentEmptyState";
import { ConfirmModal } from "../../ui/ConfirmModal";
import { TableSkeleton } from "../../ui/Skeleton";
import { toast } from "react-hot-toast";

interface AppointmentTableProps {
  appointments: any[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
  isLoading: boolean;
  page: number;
  setPage: (page: number) => void;
  resetFilters: () => void;
}

export default function AppointmentTable({
  appointments,
  pagination,
  isLoading,
  page,
  setPage,
  resetFilters,
}: AppointmentTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [deleteAppointment, { isLoading: isDeleting }] = useDeleteAppointmentMutation();
  const { data: detailData, isLoading: isDetailLoading } = useGetAppointmentByIdQuery(selectedId!, {
    skip: !selectedId,
  });

  const handleOpenDetail = (id: string) => {
    setSelectedId(id);
    setIsDetailOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAppointment(deleteId).unwrap();
      toast.success("Appointment deleted successfully");
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to delete appointment");
    }
  };

  if (isLoading) {
    return <TableSkeleton rows={5} />;
  }

  if (appointments.length === 0) {
    return <AppointmentEmptyState onReset={resetFilters} />;
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-150">
              {appointments.map((appointment) => (
                <tr
                  key={appointment._id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold overflow-hidden border border-gray-200">
                        {appointment.patientId?.photo ? (
                          <img
                            src={appointment.patientId.photo}
                            alt="Patient"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>
                            {(appointment.patientId?.name || "P").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-primary">
                          {appointment.patientId?.name || "N/A"}
                        </span>
                        {appointment.patientId?.phone && (
                          <span className="text-xs text-gray-400">
                            {appointment.patientId.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-text-primary">
                        Dr. {appointment.doctorId?.name || "N/A"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {appointment.doctorId?.doctorProfile?.specialization || "General"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="text-xs font-bold text-text-primary">
                        {appointment.dateTime
                          ? format(new Date(appointment.dateTime), "MMM dd, yyyy • h:mm a")
                          : "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-text-primary">
                    <span className="capitalize">
                      {appointment.type || "Consultation"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <AppointmentStatusBadge status={appointment.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenDetail(appointment._id)}
                        title="View Details"
                        className="p-2 rounded-xl bg-gray-50 text-gray-600 hover:text-[#00b495] hover:bg-[#e6f8f4] transition-all border border-gray-200"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(appointment._id)}
                        title="Delete Appointment"
                        className="p-2 rounded-xl bg-gray-50 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all border border-gray-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total appointments)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(page - 1, 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 disabled:opacity-50 transition-all hover:bg-gray-50 disabled:hover:bg-white"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(page + 1, pagination.pages))}
                disabled={page >= pagination.pages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 disabled:opacity-50 transition-all hover:bg-gray-50 disabled:hover:bg-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AppointmentDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        appointment={detailData?.data}
        loading={isDetailLoading}
      />

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Appointment"
        message="Are you sure you want to delete this appointment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
