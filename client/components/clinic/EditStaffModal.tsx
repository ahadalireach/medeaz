import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEditStaffMutation } from "@/store/api/clinicApi";
import { toast } from "react-hot-toast";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { User } from "lucide-react";
import { useTranslations } from "next-intl";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional().refine(
    (val) => !val || /^03\d{9}$/.test(val),
    { message: "Invalid Pakistani phone number format (should be 03xxxxxxxxx)" }
  ),
  role: z.enum([
    "doctor",
    "nurse",
    "lab-technician",
    "pharmacist",
    "receptionist",
    "office-manager",
    "cleaner",
    "security-guard",
  ]),
  licenseNumber: z.string().optional(),
  specialization: z.string().optional(),
  department: z.string().optional(),
  labSection: z.string().optional(),
  deskNumber: z.string().optional(),
  officeLocation: z.string().optional(),
  shiftTime: z.string().optional(),
  badgeNumber: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role === "doctor") {
    if (!data.licenseNumber || data.licenseNumber.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "License number is required for Doctor",
        path: ["licenseNumber"],
      });
    }
    if (!data.specialization || data.specialization.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Specialization is required for Doctor",
        path: ["specialization"],
      });
    }
  } else if (data.role === "nurse") {
    if (!data.licenseNumber || data.licenseNumber.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "License number is required for Nurse",
        path: ["licenseNumber"],
      });
    }
    if (!data.department || data.department.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Department is required for Nurse",
        path: ["department"],
      });
    }
  } else if (data.role === "lab-technician") {
    if (!data.labSection || data.labSection.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Lab section is required for Lab Technician",
        path: ["labSection"],
      });
    }
  } else if (data.role === "pharmacist") {
    if (!data.licenseNumber || data.licenseNumber.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "License number is required for Pharmacist",
        path: ["licenseNumber"],
      });
    }
  } else if (data.role === "receptionist") {
    if (!data.deskNumber || data.deskNumber.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Desk number is required for Receptionist",
        path: ["deskNumber"],
      });
    }
  } else if (data.role === "office-manager") {
    if (!data.officeLocation || data.officeLocation.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Office location is required for Office Manager",
        path: ["officeLocation"],
      });
    }
  } else if (data.role === "cleaner") {
    if (!data.shiftTime || data.shiftTime.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Shift time is required for Cleaner",
        path: ["shiftTime"],
      });
    }
  } else if (data.role === "security-guard") {
    if (!data.badgeNumber || data.badgeNumber.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Badge number is required for Security Guard",
        path: ["badgeNumber"],
      });
    }
  }
});

type FormData = z.infer<typeof schema>;

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: any;
}

export default function EditStaffModal({
  isOpen,
  onClose,
  staff,
}: EditStaffModalProps) {
  const t = useTranslations();
  const [editStaff, { isLoading }] = useEditStaffMutation();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedRole = watch("role");

  useEffect(() => {
    if (staff && isOpen) {
      reset({
        name: staff.name,
        email: staff.email,
        phone: staff.phone || "",
        role: staff.role,
        licenseNumber: staff.licenseNumber || "",
        specialization: staff.specialization || "",
        department: staff.department || "",
        labSection: staff.labSection || "",
        deskNumber: staff.deskNumber || "",
        officeLocation: staff.officeLocation || "",
        shiftTime: staff.shiftTime || "",
        badgeNumber: staff.badgeNumber || "",
      });
      if (staff.photo) {
        setProfileImage(staff.photo);
      } else {
        setProfileImage(null);
      }
    }
  }, [staff, isOpen, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await editStaff({ id: staff._id, ...data, photo: profileImage }).unwrap();
      toast.success("Staff updated");
      onClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update staff");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('clinic.staff.editForm.title')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
        <div className="flex flex-col items-center mb-6">
          <div className="relative group">
            <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-dashed border-border-light bg-background flex items-center justify-center transition-all group-hover:border-primary/50">
              {profileImage ? (
                <img src={profileImage} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1 text-text-secondary">
                  <User size={32} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t('clinic.staff.photo')}</span>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {profileImage && (
              <button
                type="button"
                onClick={() => setProfileImage(null)}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            )}
          </div>
          <p className="text-[10px] text-text-secondary mt-2 font-medium">{t('clinic.staff.uploadPhoto')}</p>
        </div>

        <Input
          label={t('clinic.staff.name')}
          placeholder="John Doe"
          error={errors.name?.message}
          {...register("name")}
        />

        <Input
          label={t('clinic.staff.email')}
          type="email"
          placeholder="staff@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label={t('form.phone')}
          placeholder="+1 234 567 8900"
          error={errors.phone?.message}
          {...register("phone")}
        />

        <div>
          <label className="block text-sm font-semibold text-text-primary mb-2">
            {t('clinic.staff.role')}
          </label>
          <select
            disabled
            className="w-full px-4 py-2 border border-border-light rounded-lg bg-gray-50 text-text-secondary cursor-not-allowed focus:outline-none text-sm font-semibold"
          >
            <option value="doctor">{t('clinic.staff.roles.doctor')}</option>
            <option value="nurse">{t('clinic.staff.roles.nurse')}</option>
            <option value="lab-technician">{t('clinic.staff.roles.lab-technician')}</option>
            <option value="pharmacist">{t('clinic.staff.roles.pharmacist')}</option>
            <option value="receptionist">{t('clinic.staff.roles.receptionist')}</option>
            <option value="office-manager">{t('clinic.staff.roles.office-manager')}</option>
            <option value="cleaner">{t('clinic.staff.roles.cleaner')}</option>
            <option value="security-guard">{t('clinic.staff.roles.security-guard')}</option>
          </select>
          <input type="hidden" {...register("role")} />
        </div>

        {/* Dynamic Fields */}
        {(selectedRole === "doctor" || selectedRole === "nurse" || selectedRole === "pharmacist") && (
          <Input
            label={t('clinic.staff.fields.licenseNumber')}
            placeholder={
              selectedRole === "doctor" ? "LIC-123456" : selectedRole === "nurse" ? "RN-987654" : "PH-887766"
            }
            error={errors.licenseNumber?.message}
            {...register("licenseNumber")}
          />
        )}

        {selectedRole === "doctor" && (
          <Input
            label={t('clinic.staff.fields.specialization')}
            placeholder="Cardiology"
            error={errors.specialization?.message}
            {...register("specialization")}
          />
        )}

        {selectedRole === "nurse" && (
          <Input
            label={t('clinic.staff.fields.department')}
            placeholder="Pediatrics"
            error={errors.department?.message}
            {...register("department")}
          />
        )}

        {selectedRole === "lab-technician" && (
          <Input
            label={t('clinic.staff.fields.labSection')}
            placeholder="Hematology"
            error={errors.labSection?.message}
            {...register("labSection")}
          />
        )}

        {selectedRole === "receptionist" && (
          <Input
            label={t('clinic.staff.fields.deskNumber')}
            placeholder="Desk A"
            error={errors.deskNumber?.message}
            {...register("deskNumber")}
          />
        )}

        {selectedRole === "office-manager" && (
          <Input
            label={t('clinic.staff.fields.officeLocation')}
            placeholder="Block B, Room 301"
            error={errors.officeLocation?.message}
            {...register("officeLocation")}
          />
        )}

        {selectedRole === "cleaner" && (
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-text-primary mb-2">
              {t('clinic.staff.fields.shiftTime')}
            </label>
            <select
              {...register("shiftTime")}
              className="w-full px-4 py-2 border border-border-light rounded-lg bg-white text-text-primary placeholder:text-text-secondary focus:ring-2 focus:ring-primary focus:outline-none text-sm font-semibold"
            >
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
            </select>
            {errors.shiftTime && (
              <p className="mt-1 text-sm text-red-600">
                {errors.shiftTime.message}
              </p>
            )}
          </div>
        )}

        {selectedRole === "security-guard" && (
          <Input
            label={t('clinic.staff.fields.badgeNumber')}
            placeholder="SG-007"
            error={errors.badgeNumber?.message}
            {...register("badgeNumber")}
          />
        )}

        <div className="flex gap-3 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t('clinic.staff.editForm.updating') : t('clinic.staff.editForm.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
