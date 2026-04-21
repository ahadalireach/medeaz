"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { Calendar, Pill, MessageSquare, ChevronLeft, ChevronRight, HeartPulse, LogOut } from "lucide-react";
import { useGetConversationsQuery } from "@/store/api/chatApi";
import { logout } from "@/store/slices/authSlice";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import NextImage from "next/image";
import LayoutDashboardIcon from "@/icons/layout-dashboard-icon";
import UsersIcon from "@/icons/users-icon";
import MessageCircleIcon from "@/icons/message-circle-icon";
import UserIcon from "@/icons/user-icon";
import DescriptionIcon from "@/icons/file-description-icon";
import AlarmClockPlusIcon from "@/icons/alarm-clock-plus-icon";
import { toggleSidebar } from "@/store/slices/uiSlice";
import { RootState } from "@/store/store";
import { useTranslations } from "next-intl";

export default function PatientSidebar() {
  const t = useTranslations();
  const pathname = usePathname();
  const isCollapsed = useSelector((state: RootState) => state.ui.sidebarCollapsed);
  const dispatch = useDispatch();
  const router = useRouter();
  const { theme } = useTheme();

  const navLinks = [
    { href: "/dashboard/patient", label: t('nav.dashboard'), icon: LayoutDashboardIcon },
    { href: "/dashboard/patient/records", label: t('nav.records'), icon: DescriptionIcon },
    { href: "/dashboard/patient/find-doctors", label: t('nav.doctors'), icon: UsersIcon },
    { href: "/dashboard/patient/appointments", label: t('nav.appointments'), icon: Calendar },
    { href: "/dashboard/patient/book-appointment", label: t('nav.bookAppointment'), icon: AlarmClockPlusIcon },
    { href: "/dashboard/patient/family", label: t('nav.family'), icon: UsersIcon },
    { href: "/dashboard/patient/chat", label: t('nav.chat'), icon: MessageSquare },
    { href: "/dashboard/patient/ai-assistant", label: t('nav.aiAssistant'), icon: MessageCircleIcon },
    { href: "/dashboard/patient/profile", label: t('nav.profile'), icon: UserIcon },
  ];

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: conversationsData } = useGetConversationsQuery({ viewerRole: 'patient' }, {
    pollingInterval: 30000,
    skip: !mounted
  });

  const totalUnread = conversationsData?.data?.reduce((acc: number, conv: any) => acc + (conv.unreadCount || 0), 0) || 0;

  const isActive = (href: string) => {
    if (href === "/dashboard/patient") {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.clear();
    toast.success(t('toast.loggedOut'));
    router.push("/login");
  };

  return (
    <aside className={`lens-sidebar sticky top-0 self-start hidden lg:flex relative ${isCollapsed ? 'lens-sidebar-collapsed' : ''}`}>
      <button
        onClick={() => dispatch(toggleSidebar())}
        className={`absolute ${t.raw('nav.navigation') === 'نیویگیشن' ? '-left-3' : '-right-3'} top-20 bg-primary text-white p-1 rounded-full shadow-lg border-2 border-white dark:border-[#18181b] z-50 hover:scale-110 transition-transform hidden lg:block`}
      >
        {t.raw('nav.navigation') === 'نیویگیشن' 
            ? (isCollapsed ? <ChevronLeft size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />)
            : (isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />)
        }
      </button>

      <div className={`px-5 mb-8 ${isCollapsed ? 'opacity-0 scale-0 overflow-hidden h-0' : 'opacity-100 scale-100 pt-2 transition-all shadow-none'}`}>
        <Link href="/dashboard/patient" className="flex items-center gap-2.5 group">
            <NextImage
                src={mounted && theme === 'dark' ? "/logo-dark.svg" : "/logo-light.svg"}
                alt="MedEaz"
                width={100}
                height={34}
                priority
                className="group-hover:scale-105 transition-all"
            />
        </Link>
        <p className="text-[10px] font-bold text-gray-400 dark:text-[#52525b] leading-none uppercase tracking-widest mt-2 px-1 text-nowrap">
            {t('nav.patientPortal')}
        </p>
      </div>

      {isCollapsed && (
        <div className="flex justify-center mb-8">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <HeartPulse size={20} />
          </div>
        </div>
      )}

      <nav className="flex flex-col gap-1">
        {!isCollapsed && <p className="lens-section-label mb-2">{t('nav.navigation')}</p>}
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              title={isCollapsed ? link.label : ""}
              className={`${isActive(link.href) ? "lens-nav-item-active" : "lens-nav-item"} ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon size={18} strokeWidth={isActive(link.href) ? 2.5 : 2} className="shrink-0" />
              {!isCollapsed && <span>{link.label}</span>}
              {link.label === "Chat" && totalUnread > 0 && (
                <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-[#18181b]`}>
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-5 py-6 space-y-4">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-bold transition-all text-red-500 hover:bg-red-500/10 ${isCollapsed ? 'justify-center px-0' : ''}`}
          title={isCollapsed ? t('nav.signOut') : ""}
        >
          <LogOut size={18} strokeWidth={2.5} className="shrink-0" />
          {!isCollapsed && <span>{t('nav.signOut')}</span>}
        </button>

        {!isCollapsed && (
          <p className="text-[10px] font-bold text-gray-400 dark:text-[#52525b] uppercase tracking-[0.2em] px-4">
              MEDEAZ HEALTHCARE
          </p>
        )}
      </div>
    </aside>
  );
}
