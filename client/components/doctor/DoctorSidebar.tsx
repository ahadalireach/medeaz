"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { Calendar, MessageSquare, ChevronLeft, ChevronRight, HeartPulse, LogOut } from "lucide-react";
import { useGetConversationsQuery } from "@/store/api/chatApi";
import { logout } from "@/store/slices/authSlice";
import toast from "react-hot-toast";
import { MedeazLogo } from "@/components/ui/MedeazLogo";
import LayoutDashboardIcon from "@/icons/layout-dashboard-icon";
import UsersIcon from "@/icons/users-icon";
import ClockIcon from "@/icons/clock-icon";
import UserIcon from "@/icons/user-icon";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { toggleSidebar } from "@/store/slices/uiSlice";
import { RootState } from "@/store/store";
import DescriptionIcon from "@/icons/file-description-icon";
import { useTranslations } from "next-intl";
import { useChatSocket } from "@/providers/ChatSocketProvider";
import { Sparkles } from "lucide-react";

export default function DoctorSidebar() {
    const t = useTranslations();
    const pathname = usePathname();
    const user = useSelector((state: any) => state.auth.user);
    const isCollapsed = useSelector((state: RootState) => state.ui.sidebarCollapsed);
    const dispatch = useDispatch();
    const router = useRouter();
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const navLinks = [
        { href: "/dashboard/doctor", label: t('nav.dashboard'), icon: LayoutDashboardIcon },
        { href: "/dashboard/doctor/patients", label: t('nav.patients'), icon: UsersIcon },
        { href: "/dashboard/doctor/prescriptions", label: t('nav.prescriptions'), icon: DescriptionIcon },
        { href: "/dashboard/doctor/appointments", label: t('nav.appointments'), icon: Calendar },
        { href: "/dashboard/doctor/chat", label: t('nav.chat'), icon: MessageSquare },
        { href: "/dashboard/doctor/schedule", label: t('nav.schedule'), icon: ClockIcon },
        { href: "/dashboard/doctor/ai-assistant", label: t('nav.aiAssistant'), icon: Sparkles },
        { href: "/dashboard/doctor/profile", label: t('nav.profile'), icon: UserIcon },
    ];

    const { data: conversationsData, refetch } = useGetConversationsQuery({ viewerRole: 'doctor' }, {
        pollingInterval: 30000,
        skip: !mounted
    });
    const { onConversationUpdated, onNewMessage } = useChatSocket();

    useEffect(() => {
        const unsubConversation = onConversationUpdated?.(() => {
            refetch();
        });
        const unsubMessage = onNewMessage?.(() => {
            refetch();
        });
        return () => {
            unsubConversation?.();
            unsubMessage?.();
        };
    }, [onConversationUpdated, onNewMessage, refetch]);

    const totalUnread = conversationsData?.data?.reduce((acc: number, conv: any) => acc + (conv.unreadCount || 0), 0) || 0;

    const isActive = (href: string) => {
        if (href === "/dashboard/doctor") {
            return pathname === href;
        }
        return pathname?.startsWith(href);
    };

    const handleLogout = () => {
        dispatch(logout());
        localStorage.clear();
        toast.success(t('toast.logoutSuccess'));
        router.push("/login");
    };

    return (
        <aside style={{ zIndex: 600 }} className={`lens-sidebar self-start hidden lg:flex flex-col h-screen overflow-y-auto ${isCollapsed ? 'lens-sidebar-collapsed' : ''}`}>
            <button
                onClick={() => dispatch(toggleSidebar())}
                className={`absolute ${t.raw('nav.navigation') === 'نیویگیشن' ? '-left-3' : '-right-3'} top-20 bg-primary text-white p-1 rounded-full border-2 border-white dark:border-[#18181b] z-50 hover:bg-primary/90 transition-colors hidden lg:block`}
            >
                {t.raw('nav.navigation') === 'نیویگیشن'
                    ? (isCollapsed ? <ChevronLeft size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />)
                    : (isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />)
                }
            </button>

            <div className={`px-3 mb-6 ${isCollapsed ? 'opacity-0 scale-0 overflow-hidden h-0' : 'opacity-100 scale-100 pt-2 transition-all'}`}>
                <Link
                    href="/dashboard/doctor"
                    className="flex items-center gap-2 group"
                >
                    <MedeazLogo size={36} />
                    <span className="font-display text-[22px] leading-none text-text-primary tracking-tight">
                        Medeaz
                    </span>
                </Link>
                <p className="text-[10px] font-bold leading-none tracking-widest mt-2 px-1 text-nowrap" style={{ color: '#00b495' }}>
                    {t('nav.doctorPortal')}
                </p>
            </div>

            {isCollapsed && (
                <div className="flex justify-center mb-8">
                    <Link href="/dashboard/doctor" className="flex items-center justify-center">
                        <MedeazLogo size={40} />
                    </Link>
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
                            {link.href.includes('/chat') && totalUnread > 0 && (
                                <span className={`${isCollapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-[#18181b]`}>
                                    {totalUnread > 9 ? '9+' : totalUnread}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className={`mt-auto border-t border-black/6 pt-3 pb-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
                <button
                    onClick={handleLogout}
                    title={isCollapsed ? t('nav.signOut') : ""}
                    className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors ${isCollapsed ? 'justify-center w-auto px-2.5' : ''}`}
                >
                    <LogOut size={15} strokeWidth={2} className="shrink-0" />
                    {!isCollapsed && <span>{t('nav.signOut')}</span>}
                </button>
            </div>
        </aside>
    );
}
