"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetSettingsQuery, useSaveSettingsMutation } from "@/store/api/clinicApi";
import { toast } from "react-hot-toast";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { useTranslations } from "next-intl";

const schema = z.object({
  name: z.string().min(2, "Clinic name is required"),
  address: z.string().min(5, "Address is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  workingHours: z.object({
    monday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean(),
    }),
    tuesday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean(),
    }),
    wednesday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean(),
    }),
    thursday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean(),
    }),
    friday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean(),
    }),
    saturday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean(),
    }),
    sunday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean(),
    }),
  }),
});

type FormData = z.infer<typeof schema>;

export default function ClinicSettingsForm() {
  const [clinicEmail, setClinicEmail] = useState<string>("");
  const t = useTranslations();
  const { data, isLoading } = useGetSettingsQuery(undefined);
  const [saveSettings, { isLoading: isSaving }] = useSaveSettingsMutation();
  const [photo, setPhoto] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(t('clinic.imageSizeError'));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      workingHours: {
        monday: { open: "09:00", close: "17:00", closed: false },
        tuesday: { open: "09:00", close: "17:00", closed: false },
        wednesday: { open: "09:00", close: "17:00", closed: false },
        thursday: { open: "09:00", close: "17:00", closed: false },
        friday: { open: "09:00", close: "17:00", closed: false },
        saturday: { open: "09:00", close: "17:00", closed: true },
        sunday: { open: "09:00", close: "17:00", closed: true },
      },
    },
  });

  useEffect(() => {
    if (data?.data) {
      reset({
        name: data.data.name,
        address: data.data.address,
        phone: data.data.phone,
        workingHours: data.data.workingHours,
      });
      if (data.data.email) {
        setClinicEmail(data.data.email);
      }
      if (data.data.photo) {
        setPhoto(data.data.photo.startsWith('http') || data.data.photo.startsWith('data:') ? data.data.photo : `${process.env.NEXT_PUBLIC_API_URL}${data.data.photo}`);
      }
    }
  }, [data, reset]);

  const onInvalid = (errors: any) => {
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toast.error(firstError.message);
    }
  };

  const onSubmit = async (formData: FormData) => {
    const safeT = (key: string, fallback: string) => {
      try {
        if (t && typeof t.has === 'function' && t.has(key)) {
          return t(key) || fallback;
        }
        return fallback;
      } catch (e) {
        return fallback;
      }
    };

    // Never submit email — it's immutable on the backend
    const { ...rest } = formData;
    toast.promise(saveSettings({ ...rest, photo }).unwrap(), {
      loading: safeT('common.loading', 'Loading...'),
      success: safeT('toast.settingsSaved', 'Settings saved successfully'),
      error: safeT('common.error', 'Something went wrong'),
    });
  };

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ] as const;

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-border-light h-96 animate-pulse"></div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-3 sm:gap-4 mb-2">
        <div className="flex items-center gap-3 sm:gap-4 bg-slate-50 dark:bg-slate-900/50 p-2 sm:p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="text-center px-3 sm:px-4 border-r border-slate-200 dark:border-slate-700">
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('clinic.period.month')}</p>
            <p className="text-base sm:text-lg font-black text-primary">{(data?.data as any)?.stats?.monthlyCompleted || 0}</p>
          </div>
          <div className="text-center px-3 sm:px-4 border-r border-slate-200 dark:border-slate-700">
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('clinic.period.week')}</p>
            <p className="text-base sm:text-lg font-black text-primary">{(data?.data as any)?.stats?.weeklyCompleted || 0}</p>
          </div>
          <div className="text-center px-3 sm:px-4">
            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500">{t('clinic.period.all')}</p>
            <p className="text-base sm:text-lg font-black text-primary">{(data?.data as any)?.stats?.totalCompleted || 0}</p>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-border-light">
          <h2 className="text-lg font-bold text-text-primary mb-6">
            {t('clinic.clinicName')}
          </h2>

          <div className="flex flex-col items-center mb-8 pb-8 border-b border-border-light">
            <div className="relative group">
              <div className="h-28 w-28 rounded-3xl overflow-hidden border-2 border-dashed border-border-light bg-background/50 flex items-center justify-center transition-all group-hover:border-primary/50">
                {photo ? (
                  <img src={photo} alt="Clinic Logo" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-text-secondary">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('clinic.identityLogo')}</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {photo && (
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                >
                  ×
                </button>
              )}
            </div>
            <p className="text-[10px] text-text-secondary mt-3 font-bold uppercase tracking-widest">{t('clinic.visualIdentity')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('settings.clinicName')}
              error={errors.name?.message}
              {...register("name")}
            />

            {/* Email is immutable — display only */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                {t('form.email')}
              </label>
              <div className="flex items-center h-11 px-4 rounded-xl border border-border-light bg-slate-50 text-text-secondary text-sm cursor-not-allowed select-none gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span className="truncate font-medium">{clinicEmail || "—"}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Email cannot be changed here.</p>
            </div>

            <Input
              label={t('form.phone')}
              error={errors.phone?.message}
              {...register("phone")}
            />

            <Input
              label={t('settings.address')}
              error={errors.address?.message}
              {...register("address")}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-border-light">
          <h2 className="text-lg font-bold text-text-primary mb-6">
            {t('settings.workingHours')}
          </h2>

          <div className="space-y-4">
            {days.map((day) => (
              <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 py-3 border-b border-slate-100 last:border-b-0">
                <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
                  <div className="w-24 sm:w-28">
                    <p className="text-sm font-semibold text-text-primary capitalize">
                      {t(`schedule.${day}`)}
                    </p>
                  </div>

                  <Controller
                    name={`workingHours.${day}.closed`}
                    control={control}
                    render={({ field }) => (
                      <label className="flex items-center gap-2 cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 text-primary rounded-lg border-border-light focus:ring-primary cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-text-secondary">
                          {t('settings.closed')}
                        </span>
                      </label>
                    )}
                  />
                </div>

                {!watch(`workingHours.${day}.closed`) && (
                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                    <input
                      type="time"
                      {...register(`workingHours.${day}.open`)}
                      className="w-full sm:w-32 px-3 py-2 text-xs font-medium border border-border-light rounded-xl bg-white text-text-primary focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                    <span className="text-text-secondary text-xs select-none shrink-0" dir="ltr">—</span>
                    <input
                      type="time"
                      {...register(`workingHours.${day}.close`)}
                      className="w-full sm:w-32 px-3 py-2 text-xs font-medium border border-border-light rounded-xl bg-white text-text-primary focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? t('common.loading') : t('clinic.saveSettings')}
          </Button>
        </div>
      </form>
    </div>
  );
}
