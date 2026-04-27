"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  Calendar,
  UserCog,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  LogOut,
  DollarSign,
} from "lucide-react";
import { logout } from "@/store/slices/authSlice";
import toast from "react-hot-toast";
import LayoutDashboardIcon from "@/icons/layout-dashboard-icon";
import UsersIcon from "@/icons/users-icon";
import UserIcon from "@/icons/user-icon";
import MagnifierIcon from "@/icons/magnifier-icon";
import NextImage from "next/image";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { toggleSidebar } from "@/store/slices/uiSlice";
import { RootState } from "@/store/store";
import { useTranslations } from "next-intl";

export default function ClinicSidebar() {
  const t = useTranslations();
  const pathname = usePathname();
  const isCollapsed = useSelector(
    (state: RootState) => state.ui.sidebarCollapsed,
  );
  const dispatch = useDispatch();
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    {
      href: "/dashboard/clinic_admin",
      label: t("nav.dashboard"),
      icon: LayoutDashboardIcon,
    },
    {
      href: "/dashboard/clinic_admin/doctors",
      label: t("nav.doctors"),
      icon: UsersIcon,
    },
    {
      href: "/dashboard/clinic_admin/appointments",
      label: t("nav.appointments"),
      icon: Calendar,
    },
    {
      href: "/dashboard/clinic_admin/patients/search",
      label: t("nav.searchPatients"),
      icon: MagnifierIcon,
    },
    {
      href: "/dashboard/clinic_admin/staff",
      label: t("nav.staff"),
      icon: UserCog,
    },
    {
      href: "/dashboard/clinic_admin/profile",
      label: t("nav.profile"),
      icon: UserIcon,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard/clinic_admin") {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.clear();
    toast.success(t("toast.logoutSuccess"));
    router.push("/login");
  };

  return (
    <aside
      className={`lens-sidebar sticky top-0 self-start hidden lg:flex relative ${isCollapsed ? "lens-sidebar-collapsed" : ""}`}
    >
      <button
        onClick={() => dispatch(toggleSidebar())}
        className={`absolute ${t.raw("nav.navigation") === "نیویگیشن" ? "-left-3" : "-right-3"} top-20 bg-primary text-white p-1 rounded-full shadow-lg border-2 border-white  z-50 hover:scale-110 transition-transform hidden lg:block`}
      >
        {t.raw("nav.navigation") === "نیویگیشن" ? (
          isCollapsed ? (
            <ChevronLeft size={14} strokeWidth={3} />
          ) : (
            <ChevronRight size={14} strokeWidth={3} />
          )
        ) : isCollapsed ? (
          <ChevronRight size={14} strokeWidth={3} />
        ) : (
          <ChevronLeft size={14} strokeWidth={3} />
        )}
      </button>

      <div
        className={`px-3 mb-6 ${isCollapsed ? "opacity-0 scale-0 overflow-hidden h-0" : "opacity-100 scale-100 pt-2 transition-all"}`}
      >
        <Link
          href="/dashboard/clinic_admin"
          className="flex items-center gap-2 group"
        >
          <NextImage
            src="/medeaz.jpeg"
            alt="Medeaz Logo"
            width={36}
            height={36}
            priority
            className="h-9 w-9 rounded-lg object-cover"
          />
          <span className="font-display text-[22px] leading-none text-text-primary tracking-tight">
            Medeaz
          </span>
        </Link>
        <p className="text-[10px] font-bold text-text-secondary leading-none uppercase tracking-widest mt-3 px-1 text-nowrap">
          {t("nav.clinicPortal")}
        </p>
      </div>

      {isCollapsed && (
        <div className="flex justify-center mb-8">
          <Link href="/dashboard/clinic_admin" className="h-10 w-10 relative group">
            <NextImage
              src="/medeaz.jpeg"
              alt="Medeaz"
              fill
              className="object-cover rounded-lg shadow-md transition-transform group-hover:scale-110"
            />
          </Link>
        </div>
      )}

      <nav className="flex flex-col gap-1">
        {!isCollapsed && (
          <p className="lens-section-label mb-2">{t("nav.navigation")}</p>
        )}
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              title={isCollapsed ? link.label : ""}
              className={`${isActive(link.href) ? "lens-nav-item-active" : "lens-nav-item"} ${isCollapsed ? "justify-center px-0" : ""}`}
            >
              <Icon
                size={18}
                strokeWidth={isActive(link.href) ? 2.5 : 2}
                className="shrink-0"
              />
              {!isCollapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-5 py-6 space-y-4">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-bold transition-all text-red-500 hover:bg-red-500/10 ${isCollapsed ? "justify-center px-0" : ""}`}
          title={isCollapsed ? t("nav.signOut") : ""}
        >
          <LogOut size={18} strokeWidth={2.5} className="shrink-0" />
          {!isCollapsed && <span>{t("nav.signOut")}</span>}
        </button>

        {!isCollapsed && (
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] px-4">
            MEDEAZ HEALTHCARE
          </p>
        )}
      </div>
    </aside>
  );
}
