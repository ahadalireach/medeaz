"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { Linkedin, Instagram, Facebook } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Footer() {
    const { resolvedTheme } = useTheme();
    const pathname = usePathname();
    const t = useTranslations();

    const getDashboardPrefix = () => {
        if (pathname?.includes("/dashboard/doctor")) return "/dashboard/doctor";
        if (pathname?.includes("/dashboard/clinic_admin")) return "/dashboard/clinic_admin";
        if (pathname?.includes("/dashboard/patient")) return "/dashboard/patient";
        return "/dashboard/patient";
    };

    const prefix = getDashboardPrefix();

    return (
        <footer className="w-full mt-auto border-t border-black/5 dark:border-white/5 bg-white dark:bg-[#18181b]">
            <div className="w-full max-w-[1440px] mx-auto px-4 md:px-12 lg:px-16 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

                <div className="flex flex-col gap-5">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <Image
                            src="/logo-light.svg"
                            alt="MedEaz"
                            width={120}
                            height={40}
                            priority
                            className="group-hover:scale-105 transition-transform dark:hidden"
                        />
                        <Image
                            src="/logo-dark.svg"
                            alt="MedEaz"
                            width={120}
                            height={40}
                            priority
                            className="group-hover:scale-105 transition-transform hidden dark:block"
                        />
                    </Link>
                    <p className="text-sm text-text-secondary dark:text-[#a1a1aa] leading-relaxed">
                        {t('footer.tagline')}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                            className="p-2 rounded-full border border-black/10 dark:border-white/10 text-text-secondary dark:text-[#a1a1aa] hover:text-primary hover:border-primary transition-colors">
                            <Linkedin size={16} />
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                            className="p-2 rounded-full border border-black/10 dark:border-white/10 text-text-secondary dark:text-[#a1a1aa] hover:text-primary hover:border-primary transition-colors">
                            <Instagram size={16} />
                        </a>
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                            className="p-2 rounded-full border border-black/10 dark:border-white/10 text-text-secondary dark:text-[#a1a1aa] hover:text-primary hover:border-primary transition-colors">
                            <Facebook size={16} />
                        </a>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-[#f4f4f5] uppercase tracking-wide">{t('footer.product')}</h4>
                    <Link href={`${prefix}`} className="text-sm text-text-secondary dark:text-[#a1a1aa] hover:text-primary transition-colors">{t('nav.dashboard')}</Link>
                    <Link href={`${prefix}/appointments`} className="text-sm text-text-secondary dark:text-[#a1a1aa] hover:text-primary transition-colors">{t('nav.appointments')}</Link>
                    <Link href={`${prefix}/prescriptions`} className="text-sm text-text-secondary dark:text-[#a1a1aa] hover:text-primary transition-colors">{t('nav.prescriptions')}</Link>
                    {!pathname?.includes("/dashboard/doctor") && !pathname?.includes("/dashboard/clinic_admin") && (
                        <Link href={`${prefix}/find-doctors`} className="text-sm text-text-secondary dark:text-[#a1a1aa] hover:text-primary transition-colors">{t('nav.doctors')}</Link>
                    )}
                </div>

                <div className="flex flex-col gap-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-[#f4f4f5] uppercase tracking-wide">{t('footer.company')}</h4>
                    <Link href="/about" className="text-sm text-text-secondary dark:text-[#a1a1aa] hover:text-primary transition-colors">{t('footer.about')}</Link>
                    <Link href="/privacy-policy" className="text-sm text-text-secondary dark:text-[#a1a1aa] hover:text-primary transition-colors">{t('footer.privacy')}</Link>
                    <Link href="/cookie-policy" className="text-sm text-text-secondary dark:text-[#a1a1aa] hover:text-primary transition-colors">{t('footer.cookies')}</Link>
                    <Link href="/support" className="text-sm text-text-secondary dark:text-[#a1a1aa] hover:text-primary transition-colors">{t('footer.support')}</Link>
                </div>

                <div className="flex flex-col gap-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-[#f4f4f5] uppercase tracking-wide">{t('footer.contact')}</h4>
                    <p className="text-sm text-text-secondary dark:text-[#a1a1aa]">support@medeaz.com</p>
                    <p className="text-sm text-text-secondary dark:text-[#a1a1aa]">+92 311 000 0000</p>
                </div>

            </div>

            <div className="w-full border-t border-black/5 dark:border-white/5 py-6">
                <div className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-text-muted dark:text-[#71717a] font-medium">
                        {t('footer.copyright', { year: new Date().getFullYear() })}
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="/privacy-policy" className="text-xs text-text-muted dark:text-[#71717a] hover:text-primary transition-colors">{t('footer.privacy')}</Link>
                        <Link href="/cookie-policy" className="text-xs text-text-muted dark:text-[#71717a] hover:text-primary transition-colors">{t('footer.cookies')}</Link>
                        <Link href="/support" className="text-xs text-text-muted dark:text-[#71717a] hover:text-primary transition-colors hover:font-bold">{t('footer.support')}</Link>
                    </div>
                </div>
            </div>

        </footer>
    );
}
