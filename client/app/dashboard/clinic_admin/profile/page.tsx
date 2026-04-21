"use client";

import { useSelector } from "react-redux";
import { User, Mail, Phone, Calendar, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function ClinicAdminProfilePage() {
  const t = useTranslations();
  const user = useSelector((state: any) => state.auth.user);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('clinic.profile.title')}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-[2rem] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900/50 p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative h-32 w-32 mb-6 group">
                {user.photo ? (
                  <Image
                    src={user.photo}
                    alt={user.name}
                    fill
                    className="rounded-full object-cover relative border-4 border-white dark:border-zinc-800 shadow-xl"
                  />
                ) : (
                  <div className="h-full w-full bg-primary/10 rounded-full flex items-center justify-center relative border-4 border-white dark:border-zinc-800 shadow-xl">
                    <User className="h-16 w-16 text-primary" />
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck className="h-3 w-3" />
                {t('clinic.profile.role')}
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-zinc-500">{t('form.email')}</p>
                  <p className="font-semibold text-gray-900 dark:text-white break-all">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-zinc-500">{t('doctor.profile.phone')}</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{user.phone || t('clinic.profile.notProvided')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-zinc-500">{t('clinic.profile.memberSince')}</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "March 2024"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-[2rem] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900/50 p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t('clinic.profile.accountSecurity')}</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-500 mb-6">
              {t('clinic.profile.securityNote')}
            </p>
            <div className="flex gap-4">
              <button 
                className="px-6 py-3 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
                onClick={() => window.location.href = '/dashboard/clinic_admin/settings'}
              >
                {t('clinic.profile.goToSettings')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
