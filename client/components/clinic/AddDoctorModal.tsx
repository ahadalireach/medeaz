"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAddDoctorMutation, useSearchDoctorByEmailQuery, useSendConnectionRequestMutation } from "@/store/api/clinicApi";
import { toast } from "react-hot-toast";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { showToast } from "@/lib/toast";
import { Search, Plus, Building2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslations } from "next-intl";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  specialization: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddDoctorModal({
  isOpen,
  onClose,
}: AddDoctorModalProps) {
  const t = useTranslations();
  const [addDoctor] = useAddDoctorMutation();
  const [sendRequest, { isLoading: isSendingRequest }] = useSendConnectionRequestMutation();
  const isLoading = isSendingRequest;
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [mode, setMode] = useState<"options" | "search" | "manual">("options");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [addingDoctorEmail, setAddingDoctorEmail] = useState<string | null>(null);
  const debouncedSearchEmail = useDebounce(searchEmail, 300);
  const { data: searchData, isFetching: isSearchingByEmail } = useSearchDoctorByEmailQuery(debouncedSearchEmail, {
    skip: !debouncedSearchEmail || debouncedSearchEmail.length < 2,
  });

  useEffect(() => {
    if (mode === "search") {
      setSearchResults(searchData?.data || null);
    } else {
      setSearchResults(null);
    }
  }, [mode, searchData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t('clinic.imageSizeError'));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await addDoctor({ ...data, photo: profileImage }).unwrap();
      showToast.doctorAdded(t);
      reset();
      setProfileImage(null);
      onClose();
    } catch (error: any) {
      if (error?.status === 404) {
        toast.error(t('clinic.doctorNotFound'));
      } else {
        showToast.error(t, error?.data?.message);
      }
    }
  };

  const handleClose = () => {
    reset();
    setProfileImage(null);
    setMode("options");
    setSearchEmail("");
    setSearchResults(null);
    onClose();
  };

  const handleSelectSearchResult = async (doctor: any) => {
    // declined can be re-invited after 7 days
    if (doctor.connectionStatus === 'declined') {
      const respondedAt = new Date(doctor.requestRespondedAt).getTime();
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (respondedAt > sevenDaysAgo) {
        toast.error("You can resend a request to this doctor after 7 days.");
        return;
      }
    }

    try {
      setAddingDoctorEmail(doctor.email);
      await sendRequest({ doctorId: doctor._id }).unwrap();
      toast.success(`Connection request sent to ${doctor.name}`);
      handleClose();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to send request");
    } finally {
      setAddingDoctorEmail(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('clinic.addDoctor')}>
      {mode === "options" && (
        <div className="space-y-4">
          <p className="text-sm text-text-secondary font-medium">{t('clinic.chooseDoctorAddMethod') || "Choose how to add a doctor:"}</p>

          <button
            onClick={() => setMode("search")}
            className="w-full p-4 rounded-2xl border-2 border-primary/20 hover:border-primary/50 bg-primary/5 hover:bg-primary/10 transition-all flex items-center gap-3 text-left"
          >
            <Search className="h-6 w-6 text-primary" />
            <div>
              <p className="font-bold text-text-primary">{t('clinic.searchByEmail') || "Search Doctor by Email"}</p>
              <p className="text-xs text-text-secondary">{t('clinic.searchByEmailDesc') || "Find and add existing doctors"}</p>
            </div>
          </button>

          <button
            onClick={() => setMode("manual")}
            className="w-full p-4 rounded-2xl border-2 border-border-light hover:border-primary/50 bg-background hover:bg-primary/5 transition-all flex items-center gap-3 text-left"
          >
            <Plus className="h-6 w-6 text-text-secondary" />
            <div>
              <p className="font-bold text-text-primary">{t('clinic.manuallyAddDoctor') || "Add Manually"}</p>
              <p className="text-xs text-text-secondary">{t('clinic.manuallyAddDoctorDesc') || "Enter doctor details manually"}</p>
            </div>
          </button>

          <Button type="button" variant="outline" onClick={handleClose} className="w-full">
            {t('common.cancel')}
          </Button>
        </div>
      )}

      {mode === "search" && (
        <div className="space-y-4">
          <div className="relative">
            <Input
              label={t('form.email')}
              type="email"
              placeholder="doctor@example.com"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
            {isSearchingByEmail && (
              <div className="absolute right-3 top-[38px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              </div>
            )}
            <p className="text-[10px] text-text-secondary mt-2">{t('clinic.typeEmailToSearch') || "Type a doctor's email to search"}</p>
            {searchEmail.length > 0 && searchEmail.trim().length < 2 && (
              <p className="text-[#9ca3af] text-[12px] font-inter mt-1">Type at least 2 characters to search</p>
            )}
          </div>

          {searchEmail.length >= 2 && isSearchingByEmail && !searchResults && (
            <div className="p-6 flex flex-col items-center justify-center border border-border-light rounded-xl bg-slate-50 dark:bg-slate-900/10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
              <span className="text-xs text-text-secondary font-bold uppercase tracking-widest">{t('common.loading') || "Searching..."}</span>
            </div>
          )}

          {searchEmail.length >= 2 && (!isSearchingByEmail || searchResults) && searchResults && (
            <div className="border border-border-light rounded-xl overflow-hidden max-h-75 overflow-y-auto">
              {Array.isArray(searchResults) && searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.slice(0, 5).map((doctor: any) => {
                    let isDisabled = isLoading || doctor.isLimitReached || doctor.connectionStatus === 'pending' || doctor.connectionStatus === 'accepted' || doctor.connectionStatus === 'already_in_clinic';

                    if (doctor.connectionStatus === 'declined') {
                      const respondedAt = new Date(doctor.requestRespondedAt).getTime();
                      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                      if (respondedAt > sevenDaysAgo) {
                        isDisabled = true;
                      }
                    }

                    return (
                      <div
                        key={doctor._id || doctor.email}
                        className="w-full p-3 text-left hover:bg-background dark:hover:bg-slate-800/50 border-b border-border-light last:border-b-0 transition-colors"
                      >
                        <div className="flex justify-between items-center w-full">
                          <div>
                            <p className="font-semibold text-text-primary">{doctor.fullName || doctor.name || 'N/A'}</p>
                            <p className="text-xs text-text-secondary">{doctor.email}</p>
                            <p className="text-[10px] text-text-secondary">{doctor.specialization || "General"}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Building2 className="h-3 w-3 text-text-secondary" />
                              <span className="text-[11px] text-text-secondary">
                                {doctor.currentClinicName ? `Currently at: ${doctor.currentClinicName}` : "Independent practice"}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              {doctor.connectionStatus === 'already_in_clinic' && (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 whitespace-nowrap">
                                  In Clinic ✓
                                </span>
                              )}
                              {doctor.connectionStatus === 'accepted' && (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 whitespace-nowrap">
                                  In Your Clinic ✓
                                </span>
                              )}
                              {doctor.connectionStatus === 'pending' && (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 whitespace-nowrap">
                                  Request Sent
                                </span>
                              )}
                              {!['already_in_clinic', 'accepted', 'pending'].includes(doctor.connectionStatus) && doctor.isLimitReached && (
                                <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20 whitespace-nowrap">
                                  Limit Reached (2/2)
                                </span>
                              )}

                              {!['already_in_clinic', 'accepted', 'pending'].includes(doctor.connectionStatus) && !doctor.isLimitReached && (
                                <button
                                  disabled={isDisabled}
                                  onClick={(e) => { e.stopPropagation(); handleSelectSearchResult(doctor); }}
                                  className="text-[11px] font-bold text-[#00b495] border border-[#00b495] hover:bg-[#00b495] hover:text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                  {doctor.connectionStatus === 'declined' ? "Resend Request" : "Invite"}
                                </button>
                              )}

                              {addingDoctorEmail === doctor.email && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : !isSearchingByEmail && (
                <div className="p-4 text-center text-text-secondary">
                  {t('clinic.noDoctorsFound') || "No doctors found with that email"}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setMode("options")} className="flex-1">
              {t('common.back')}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}

      {mode === "manual" && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/15">
            <p className="text-xs font-semibold text-text-primary">
              {t('clinic.patientSearch.searchPlaceholder')}
            </p>
          </div>

          {/* Photo Upload Section */}
          <div className="flex flex-col items-center pb-4">
            <label className="text-sm font-bold text-text-primary mb-2 w-full">
              {t('form.profilePhoto')} ({t('common.optional')})
            </label>
            <div className="relative group w-32 h-32">
              <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-dashed border-border-light bg-background flex items-center justify-center transition-all group-hover:border-primary/50">
                {profileImage ? (
                  <img src={profileImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-text-secondary">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t('form.changePhoto')}</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              {profileImage && (
                <button
                  type="button"
                  onClick={() => setProfileImage(null)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-20"
                >
                  ×
                </button>
              )}
            </div>
            <p className="text-[10px] text-text-secondary mt-2">{t('common.optional')} — 2MB max</p>
          </div>

          <Input
            label={t('form.email')}
            type="email"
            placeholder={t('clinic.emailPlaceholder')}
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label={t('form.specialization')}
            placeholder={t('clinic.specializationPlaceholder')}
            error={errors.specialization?.message}
            {...register("specialization")}
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setMode("options")} disabled={isLoading} className="flex-1">
              {t('common.back')}
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? t('common.loading') : t('clinic.addDoctor')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
