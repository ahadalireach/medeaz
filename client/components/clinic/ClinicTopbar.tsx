"use client";

import { useTheme } from "next-themes";
import { Calendar, Search, UserCog, Settings, HeartPulse } from "lucide-react";
import LayoutDashboardIcon from "@/icons/layout-dashboard-icon";
import UsersIcon from "@/icons/users-icon";
import UserIconAnimated from "@/icons/user-icon";
import FilledBellIcon from "@/icons/filled-bell-icon";
import XIcon from "@/icons/x-icon";
import LogoutIcon from "@/icons/logout-icon";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import toast from "react-hot-toast";
import Link from "next/link";
import { useGetNotificationsQuery } from "@/store/api/notificationApi";
import { setNotifications } from "@/store/slices/notificationSlice";
import { useLocale, useTranslations } from "next-intl";


interface TopbarProps {
  title?: string;
}

import Image from "next/image";
import NotificationPanel from "@/components/NotificationPanel";
import { Hamburger } from "@/components/ui/Hamburger";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function ClinicTopbar({ title }: TopbarProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isRtl = locale === "ur";
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { theme } = useTheme();

  const user = useSelector((state: any) => state.auth.user);
  const { unreadCount } = useSelector((state: any) => state.notifications);
  const { data: notificationsData } = useGetNotificationsQuery("clinic_admin", { skip: !mounted });
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (notificationsData?.data) {
      dispatch(setNotifications(notificationsData.data));
    }
  }, [notificationsData, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.clear();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const navLinks = [
    { href: "/dashboard/clinic_admin", label: t('nav.dashboard'), icon: LayoutDashboardIcon },
    { href: "/dashboard/clinic_admin/doctors", label: t('nav.doctors'), icon: UsersIcon },
    { href: "/dashboard/clinic_admin/appointments", label: t('nav.appointments'), icon: Calendar },
    { href: "/dashboard/clinic_admin/patients/search", label: t('nav.patients'), icon: Search },
    { href: "/dashboard/clinic_admin/staff", label: t('nav.staff'), icon: UserCog },
    { href: "/dashboard/clinic_admin/profile", label: t('nav.profile'), icon: UserIconAnimated },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard/clinic_admin") return pathname === href;
    return pathname?.startsWith(href);
  };

  if (!mounted) return null;

  return (
    <>
      <header className="lens-topbar h-16 border-b border-black/5 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between w-full">
        {/* Logo - ONLY MOBILE */}
        <Link href="/dashboard/clinic_admin" className="flex items-center gap-2.5 group lg:hidden">
          <Image
            src={mounted && theme === 'dark' ? "/logo-dark.svg" : "/logo-light.svg"}
            alt="MedEaz"
            width={120}
            height={40}
            priority
            className="group-hover:scale-105 transition-all"
          />
        </Link>

        {/* Title - ONLY DESKTOP */}
        <h1 className="hidden lg:block text-sm font-black uppercase tracking-[0.2em] text-text-primary">
          {title || t('nav.clinicPortal')}
        </h1>

        {/* Right Side Options */}
        <div className="flex items-center gap-3">
          {/* Desktop Notifications */}
          <button
            onClick={() => setIsNotificationOpen(true)}
            className="h-10 w-10 text-text-secondary hover:bg-black/5 :bg-white/5 rounded-xl flex items-center justify-center relative transition-colors cursor-pointer group"
          >
            <FilledBellIcon className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center shadow-sm pointer-events-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <LanguageSwitcher />

          {/* Unified Hamburger - ALWAYS RIGHT */}
          <Hamburger
            isOpen={isMenuOpen}
            onClick={() => setIsMenuOpen(true)}
            className="text-black ml-2 cursor-pointer lg:hidden"
          />
        </div>
      </header>

      <NotificationPanel isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />

      {/* Right Drawer */}
      <div className={`fixed inset-0 z-50 transition-all duration-500 ${isMenuOpen ? "visible" : "invisible"}`}>
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${isMenuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setIsMenuOpen(false)}
        />

        <div className={`absolute right-0 top-0 h-full w-full max-w-[88vw] sm:max-w-sm bg-white  shadow-2xl transition-transform duration-500 ease-out border-l border-black/5  ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-black/5 flex items-center justify-between">
              <h2 className={`font-bold text-text-primary  text-sm ${isRtl ? "tracking-normal" : "uppercase tracking-[0.2em] text-xs"}`}>{t('nav.clinicPortal')}</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-surface :bg-white/5 transition-colors"
                title="Close Menu"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>


            <nav className={`flex-1 overflow-y-auto p-4 space-y-1 ${isRtl ? "text-right" : ""}`}>
              <p className={`px-3 text-[11px] font-bold text-text-secondary mt-4 mb-2 ${isRtl ? "tracking-normal" : "uppercase tracking-widest text-[10px]"}`}>{t('nav.navigation')}</p>
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${isRtl ? "justify-end" : ""} ${isActive(link.href)
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                      : "text-text-secondary hover:text-primary hover:bg-primary/5"
                      }`}
                  >
                    <Icon size={18} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-6 border-t border-black/5 space-y-3">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-3 bg-red-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95 group"
              >
                <LogoutIcon className="h-4 w-4 stroke-white duration-200" />
                <span className="text-white">{t('nav.signOut')}</span>
              </button>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
