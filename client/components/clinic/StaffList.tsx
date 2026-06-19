"use client";

import { useState } from "react";
import { useGetStaffQuery, useDeleteStaffMutation } from "@/store/api/clinicApi";
import { Edit2, Trash2, Plus, User } from "lucide-react";
import PenIcon from "@/icons/pen-icon";
import TrashIcon from "@/icons/trash-icon";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { ConfirmModal } from "../ui/ConfirmModal";
import { TableSkeleton } from "../ui/Skeleton";
import AddStaffModal from "./AddStaffModal";
import EditStaffModal from "./EditStaffModal";
import { useTranslations } from "next-intl";

export default function StaffList() {
  const t = useTranslations();
  const { data, isLoading } = useGetStaffQuery(undefined);
  const [deleteStaff, { isLoading: isDeleting }] = useDeleteStaffMutation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  const handleDelete = async () => {
    if (!selectedStaff) return;

    try {
      await deleteStaff(selectedStaff._id).unwrap();
      toast.success(t('toast.staffRemoved'));
      setShowConfirmModal(false);
      setSelectedStaff(null);
    } catch (error: any) {
      toast.error(error?.data?.message || "Something went wrong");
    }
  };

  const staff = data?.data || [];

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: "bg-surface-lavender text-primary  ",
      nurse: "bg-surface text-primary  ",
      receptionist: "bg-surface text-primary  ",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[role as keyof typeof styles] || styles.receptionist
          }`}
      >
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return <TableSkeleton rows={5} />;
  }

  return (
    <>
      <div className="bg-white p-6 rounded-xl border border-border-light">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-text-primary">
            {t('clinic.staff.title')}
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-all font-bold text-sm"
          >
            <Plus className="h-4 w-4" />
            {t('clinic.staff.addStaff')}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light">
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  {t('clinic.staff.name')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  {t('clinic.staff.email')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  {t('clinic.staff.role')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  {t('form.phone')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-primary">
                  {t('clinic.staff.createdOn')}
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-text-primary">
                  {t('clinic.appointments.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member: any) => (
                <tr
                  key={member._id}
                  className="border-b border-border-light"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl overflow-hidden border border-black/5 shrink-0 bg-surface flex items-center justify-center">
                        {member.photo ? (
                          <img
                            src={member.photo}
                            alt={member.name || "Staff"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-text-primary" />
                        )}
                      </div>
                      <span className="text-sm font-bold text-text-primary">
                        {member.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-text-primary">
                    {member.email}
                  </td>
                  <td className="py-4 px-4">{getRoleBadge(member.role)}</td>
                  <td className="py-4 px-4 text-sm text-text-primary">
                    {member.phone || "N/A"}
                  </td>
                  <td className="py-4 px-4 text-sm text-text-primary">
                    {member.createdAt
                      ? format(new Date(member.createdAt), "MMM dd, yyyy")
                      : "N/A"}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedStaff(member);
                          setShowEditModal(true);
                        }}
                        className="p-2 hover:bg-surface :bg-text-secondary rounded-lg transition-all group"
                      >
                        <PenIcon className="h-4 w-4 text-text-primary" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStaff(member);
                          setShowConfirmModal(true);
                        }}
                        className="p-2 hover:bg-red-50 :bg-red-900/20 rounded-lg transition-all group"
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

        {staff.length === 0 && (
          <div className="text-center py-12 text-text-primary">
            {t('clinic.staff.noStaff')}
          </div>
        )}
      </div>

      <AddStaffModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      {selectedStaff && (
        <>
          <EditStaffModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedStaff(null);
            }}
            staff={selectedStaff}
          />

          <ConfirmModal
            isOpen={showConfirmModal}
            title={t('clinic.staff.addForm.title')}
            message={t('clinic.staff.deleteConfirm')}
            confirmText={t('common.delete')}
            variant="danger"
            isLoading={isDeleting}
            onConfirm={handleDelete}
            onClose={() => {
              setShowConfirmModal(false);
              setSelectedStaff(null);
            }}
          />
        </>
      )}
    </>
  );
}
