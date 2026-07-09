"use client";

import { useState } from "react";
import { useGetStaffQuery, useDeleteStaffMutation } from "@/store/api/clinicApi";
import {
  Plus,
  User,
  Stethoscope,
  Heart,
  FlaskConical,
  Pill,
  PhoneCall,
  Briefcase,
  Sparkles,
  Shield,
  Eye,
} from "lucide-react";
import PenIcon from "@/icons/pen-icon";
import TrashIcon from "@/icons/trash-icon";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { ConfirmModal } from "../ui/ConfirmModal";
import { TableSkeleton } from "../ui/Skeleton";
import AddStaffModal from "./AddStaffModal";
import EditStaffModal from "./EditStaffModal";
import { useTranslations } from "next-intl";
import Link from "next/link";

const roleIcons: Record<string, React.ComponentType<any>> = {
  doctor: Stethoscope,
  nurse: Heart,
  "lab-technician": FlaskConical,
  pharmacist: Pill,
  receptionist: PhoneCall,
  "office-manager": Briefcase,
  cleaner: Sparkles,
  "security-guard": Shield,
};

const filterRoles = [
  "all",
  "doctor",
  "nurse",
  "lab-technician",
  "pharmacist",
  "receptionist",
  "office-manager",
  "cleaner",
  "security-guard",
];

export default function StaffList() {
  const t = useTranslations();
  const { data, isLoading } = useGetStaffQuery(undefined);
  const [deleteStaff, { isLoading: isDeleting }] = useDeleteStaffMutation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");

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

  const filteredStaff = selectedRoleFilter === "all"
    ? staff
    : staff.filter((member: any) => member.role === selectedRoleFilter);

  const getRoleBadge = (role: string, member: any) => {
    const Icon = roleIcons[role] || Shield;
    const label = t(`clinic.staff.roles.${role}`) || role;

    // Get specific extra field details
    let extraInfo = "";
    if (role === "doctor") {
      extraInfo = member.specialization ? `${member.specialization} (${member.licenseNumber || "N/A"})` : "";
    } else if (role === "nurse") {
      extraInfo = member.department ? `${member.department} (${member.licenseNumber || "N/A"})` : "";
    } else if (role === "lab-technician") {
      extraInfo = member.labSection ? `Section: ${member.labSection}` : "";
    } else if (role === "pharmacist") {
      extraInfo = member.licenseNumber ? `License: ${member.licenseNumber}` : "";
    } else if (role === "receptionist") {
      extraInfo = member.deskNumber ? `Desk: ${member.deskNumber}` : "";
    } else if (role === "office-manager") {
      extraInfo = member.officeLocation ? `Loc: ${member.officeLocation}` : "";
    } else if (role === "cleaner") {
      extraInfo = member.shiftTime ? `Shift: ${member.shiftTime}` : "";
    } else if (role === "security-guard") {
      extraInfo = member.badgeNumber ? `Badge: ${member.badgeNumber}` : "";
    }

    return (
      <div className="flex flex-col gap-1 items-start">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#00b495] border border-emerald-100">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        {extraInfo && (
          <span className="text-[11px] text-text-secondary font-medium pl-1">
            {extraInfo}
          </span>
        )}
      </div>
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

        {/* Role Pill Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filterRoles.map((r) => {
            const isActive = selectedRoleFilter === r;
            return (
              <button
                key={r}
                onClick={() => setSelectedRoleFilter(r)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                  isActive
                    ? "bg-primary border-primary text-white shadow-sm scale-105"
                    : "bg-background border-border-light text-text-secondary hover:border-primary/30 hover:bg-surface"
                }`}
              >
                {r === "all" ? t('common.filter.all') : (t(`clinic.staff.roles.${r}`) || r)}
              </button>
            );
          })}
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
              {filteredStaff.map((member: any) => (
                <tr
                  key={member._id}
                  className="border-b border-border-light hover:bg-surface/30 transition-colors"
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
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-primary flex items-center gap-2">
                          {member.name}
                          {member.role === "doctor" && member.linkedDoctorId && (
                            <Link
                              href={`/dashboard/clinic_admin/doctors/${member.linkedDoctorId}`}
                              className="inline-flex items-center text-xs font-semibold text-primary hover:underline hover:text-primary-hover gap-0.5"
                            >
                              <Eye size={12} />
                              {t('clinic.dashboard.viewProfile')}
                            </Link>
                          )}
                        </span>
                        {member.autoAdded && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded w-fit mt-0.5">
                            Auto Added
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-text-primary">
                    {member.email}
                  </td>
                  <td className="py-4 px-4">{getRoleBadge(member.role, member)}</td>
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

        {filteredStaff.length === 0 && (
          <div className="text-center py-12 text-text-primary font-medium">
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
