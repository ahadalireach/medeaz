"use client";

import { useSelector } from "react-redux";
import { User, Mail, Phone, Calendar, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useGetProfileQuery } from "@/store/api/authApi";

export default function ClinicAdminProfilePage() {
  const t = useTranslations();
  const user = useSelector((state: any) => state.auth.user);
  const { data: profileData } = useGetProfileQuery(undefined);
  const currentUser = profileData?.data || user;

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text-primary">{t('clinic.profile.title')}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-4xl border border-black/5 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative h-32 w-32 mb-6 group">
                {currentUser.photo ? (
                  <Image
                    src={currentUser.photo}
                    alt={currentUser.name}
                    fill
                    className="rounded-full object-cover relative border-4 border-white shadow-xl"
                  />
                ) : (
                  <div className="h-full w-full bg-primary/10 rounded-full flex items-center justify-center relative border-4 border-white shadow-xl">
                    <User className="h-16 w-16 text-primary" />
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-text-primary">{currentUser.name}</h2>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-text-secondary">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">{t('form.email')}</p>
                  <p className="font-semibold text-text-primary break-all">{currentUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-text-secondary">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">{t('clinic.profile.phone')}</p>
                  <p className="font-semibold text-text-primary">{currentUser.phone || t('clinic.profile.notProvided')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-text-secondary">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">{t('clinic.profile.memberSince')}</p>
                  <p className="font-semibold text-text-primary">
                    {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : "March 2024"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-4xl border border-black/5 bg-white p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-4 text-text-primary">{t('clinic.profile.accountSecurity')}</h3>
            <p className="text-sm text-text-secondary mb-6">
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
