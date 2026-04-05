"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  useGetFamilyMembersQuery,
  useAddFamilyMemberMutation,
  useEditFamilyMemberMutation,
  useDeleteFamilyMemberMutation,
} from "@/store/api/patientApi";
import { Users, Plus, Edit, Trash2, FileText } from "lucide-react";
import PenIcon from "@/icons/pen-icon";
import TrashIcon from "@/icons/trash-icon";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { useTranslations } from "next-intl";
import { showToast } from "@/lib/toast";

interface FamilyMemberFormData {
  name: string;
  relation: string;
  dob?: string;
  bloodGroup?: string;
  allergies?: string;
}

export default function FamilyPage() {
  const t = useTranslations();
  const { data, isLoading, refetch } = useGetFamilyMembersQuery(undefined);
  const [addMember] = useAddFamilyMemberMutation();
  const [editMember] = useEditFamilyMemberMutation();
  const [deleteMember] = useDeleteFamilyMemberMutation();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>("");
  const [newPhotoBase64, setNewPhotoBase64] = useState<string>("");
  const [editPhotoBase64, setEditPhotoBase64] = useState<string>("");

  const members = data?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FamilyMemberFormData>();

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: errorsEdit },
    reset: resetEdit,
    setValue,
  } = useForm<FamilyMemberFormData>();

  const onAdd = async (data: FamilyMemberFormData) => {
    try {
      const allergiesArray = data.allergies
        ? data.allergies.split(",").map((a) => a.trim())
        : [];

      await addMember({
        ...data,
        allergies: allergiesArray,
        photo: newPhotoBase64
      }).unwrap();

      showToast.familyAdded(t);
      refetch();
      reset();
      setNewPhotoBase64("");
      setShowAddModal(false);
    } catch (error: any) {
      showToast.error(t, error?.data?.message);
    }
  };

  const onEdit = async (data: FamilyMemberFormData) => {
    try {
      const allergiesArray = data.allergies
        ? data.allergies.split(",").map((a) => a.trim())
        : [];

      await editMember({
        id: editingMember._id,
        ...data,
        allergies: allergiesArray,
        photo: editPhotoBase64
      }).unwrap();

      toast.success(t('common.success'));
      refetch();
      resetEdit();
      setEditPhotoBase64("");
      setEditingMember(null);
    } catch (error: any) {
      showToast.error(t, error?.data?.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteMember(deleteId).unwrap();
      showToast.familyRemoved(t);
      refetch();
      setDeleteId(null);
    } catch (error: any) {
      showToast.error(t, error?.data?.message);
    }
  };

  const confirmDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
  };

  const openEditModal = (member: any) => {
    setEditingMember(member);
    setEditPhotoBase64(member.photo || "");
    setValue("name", member.name);
    setValue("relation", member.relation);
    setValue("dob", member.dob ? member.dob.split("T")[0] : "");
    setValue("bloodGroup", member.bloodGroup || "");
    setValue("allergies", member.allergies?.join(", ") || "");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('nav.family')}
        </h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('patient.addFamilyMember')}
        </Button>
      </div>

      {/* Family Members List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-[#1a1a1a]"
            />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-700 dark:bg-[#1a1a1a]">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            {t('family.noMembers')}
          </h3>
          <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-400">
            {t('family.addFirstMember')}
          </p>
          <Button onClick={() => setShowAddModal(true)} className="mt-4">
            {t('patient.addFamilyMember')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member: any) => (
            <div
              key={member._id}
              className="rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-primary dark:border-gray-700 dark:bg-[#1a1a1a]"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 h-14 w-14 flex items-center justify-center overflow-hidden shrink-0">
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
                    ) : (
                      <Users className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {member.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {member.relation}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(member)}
                    className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 group"
                  >
                    <PenIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => confirmDelete(member._id, member.name)}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 group"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {member.dob && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date of Birth:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(member.dob).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {member.bloodGroup && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Blood Group:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {member.bloodGroup}
                    </span>
                  </div>
                )}
                {member.allergies && member.allergies.length > 0 && (
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Allergies:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {member.allergies.map((allergy: string, idx: number) => (
                        <span
                          key={idx}
                          className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800 dark:bg-red-900/20 dark:text-red-400"
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href={`/dashboard/patient/family/${member._id}/records`}
                className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
              >
                <FileText className="h-4 w-4" />
                View Medical Records
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); reset(); }}
        title={t('patient.addFamilyMember')}
      >
        <form onSubmit={handleSubmit(onAdd)} className="space-y-4">
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="relative group overflow-hidden h-20 w-20 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center">
              {newPhotoBase64 ? (
                <img src={newPhotoBase64} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <Users className="h-8 w-8 text-gray-400" />
              )}
              <label htmlFor="new-photo" className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-white text-[10px] font-semibold">Upload</span>
              </label>
              <input
                id="new-photo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => setNewPhotoBase64(event.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
            <span className="text-xs text-gray-500">Profile Picture (Optional)</span>
          </div>

          <Input label={t('form.name')} placeholder="Full name" error={errors.name?.message} {...register("name", { required: t('form.required') })} />
          <Input label={t('patient.relation')} placeholder="e.g., Spouse, Child, Parent" error={errors.relation?.message} {...register("relation", { required: t('form.required') })} />
          <Input label={t('form.dob')} type="date" {...register("dob")} />
          <Input label={t('patient.bloodGroup')} placeholder="e.g., A+, B-, O+" {...register("bloodGroup")} />
          <Input label={t('patient.allergies')} placeholder="Comma separated, e.g., Peanuts, Penicillin" {...register("allergies")} />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setShowAddModal(false); reset(); }}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('patient.addFamilyMember')}</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        isOpen={!!editingMember}
        onClose={() => {
          setEditingMember(null);
          resetEdit();
        }}
        title={t('patient.editFamilyMember')}
      >
        <form onSubmit={handleSubmitEdit(onEdit)} className="space-y-4">
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="relative group overflow-hidden h-20 w-20 rounded-full border border-gray-200 bg-gray-100 flex items-center justify-center">
              {editPhotoBase64 ? (
                <img src={editPhotoBase64} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <Users className="h-8 w-8 text-gray-400" />
              )}
              <label htmlFor="edit-photo" className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-white text-[10px] font-semibold">Update</span>
              </label>
              <input
                id="edit-photo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => setEditPhotoBase64(event.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
            <span className="text-xs text-gray-500">Profile Picture</span>
          </div>

          <Input
            label={t('form.name')}
            placeholder={t('form.fullName')}
            error={errorsEdit.name?.message}
            {...registerEdit("name", { required: t('form.required') })}
          />
          <Input
            label={t('patient.relation')}
            placeholder="e.g., Spouse, Child, Parent"
            error={errorsEdit.relation?.message}
            {...registerEdit("relation", { required: t('form.required') })}
          />
          <Input
            label={t('form.dob')}
            type="date"
            {...registerEdit("dob")}
          />
          <Input
            label={t('patient.bloodGroup')}
            placeholder="e.g., A+, B-, O+"
            {...registerEdit("bloodGroup")}
          />
          <Input
            label={t('patient.allergies')}
            placeholder="Comma separated, e.g., Peanuts, Penicillin"
            {...registerEdit("allergies")}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingMember(null);
                resetEdit();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Update Member</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('modal.removeFamilyTitle')}
        message={t('modal.removeFamilyMsg')}
        confirmText={t('common.delete')}
        variant="danger"
      />
    </div>
  );
}
