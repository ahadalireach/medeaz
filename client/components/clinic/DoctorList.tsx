"use client";

import { useState } from "react";
import { useGetDoctorsQuery, useRemoveDoctorMutation } from "@/store/api/clinicApi";
import { BarChart2, Trash2, Plus, User } from "lucide-react";
import TrashIcon from "@/icons/trash-icon";
import { toast } from "react-hot-toast";
import { ConfirmModal } from "../ui/ConfirmModal";
import { TableSkeleton } from "../ui/Skeleton";
import AddDoctorModal from "./AddDoctorModal";
import DoctorStatsModal from "./DoctorStatsModal";
import { useTranslations } from "next-intl";

export default function DoctorList() {
  const [page, setPage] = useState(1);
  const limit = 8;
  const { data, isLoading } = useGetDoctorsQuery({ page, limit });
  const [removeDoctor, { isLoading: isRemoving }] = useRemoveDoctorMutation();
  const t = useTranslations();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  const handleRemove = async () => {
    if (!selectedDoctor) return;

    try {
      await removeDoctor(selectedDoctor._id).unwrap();
      toast.success(t('toast.doctorRemoved'));
      setShowConfirmModal(false);
      setSelectedDoctor(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Something went wrong");
    }
  };

  const doctors = data?.data?.doctors || [];
  const pagination = data?.data?.pagination;

  if (isLoading) {
    return <TableSkeleton rows={5} />;
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('nav.doctors')}
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all font-bold text-sm"
          >
            <Plus className="h-4 w-4" />
            {t('clinic.addDoctor')}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('clinic.staff.name')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('form.specialization')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('form.email')}
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor: any) => (
                <tr
                  key={doctor._id}
                  className="border-b border-gray-100 dark:border-gray-700/50"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl overflow-hidden border border-black/5 dark:border-white/10 shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        {doctor.userId?.photo ? (
                          <img
                            src={doctor.userId.photo}
                            alt={doctor.userId?.name || "Doctor"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {doctor.userId?.name || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700 dark:text-gray-300">
                    {doctor.specialization || "General"}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-700 dark:text-gray-300">
                    {doctor.userId?.email || "N/A"}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          setShowStatsModal(true);
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                      >
                        <BarChart2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          setShowConfirmModal(true);
                        }}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all group"
                      >
                        <TrashIcon className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {doctors.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {t('clinic.staff.noStaff')}
          </div>
        )}

        {pagination?.pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold disabled:opacity-50"
              >
                {t('common.back')}
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, pagination.pages))}
                disabled={page >= pagination.pages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold disabled:opacity-50"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      <AddDoctorModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {selectedDoctor && (
        <>
          <DoctorStatsModal
            isOpen={showStatsModal}
            onClose={() => {
              setShowStatsModal(false);
              setSelectedDoctor(null);
            }}
            doctorId={selectedDoctor._id}
          />

          <ConfirmModal
            isOpen={showConfirmModal}
            title={t('modal.removeDoctorTitle')}
            message={`${t('modal.removeDoctorMsg')} ${selectedDoctor.userId?.name}?`}
            confirmText={t('clinic.removeDoctor')}
            variant="danger"
            isLoading={isRemoving}
            onConfirm={handleRemove}
            onClose={() => {
              setShowConfirmModal(false);
              setSelectedDoctor(null);
            }}
          />
        </>
      )}
    </>
  );
}
