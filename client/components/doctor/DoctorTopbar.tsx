"use client";

import { FileText, Calendar, HeartPulse, MessageSquare } from "lucide-react";
import { useGetConversationsQuery } from "@/store/api/chatApi";
import LayoutDashboardIcon from "@/icons/layout-dashboard-icon";
import UsersIcon from "@/icons/users-icon";
import ClockIcon from "@/icons/clock-icon";
import UserIconAnimated from "@/icons/user-icon";
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
import FilledBellIcon from "@/icons/filled-bell-icon";
import XIcon from "@/icons/x-icon";
import LogoutIcon from "@/icons/logout-icon";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function DoctorTopbar({ title }: TopbarProps) {
    const t = useTranslations();
    const locale = useLocale();
    const isRtl = locale === "ur";
    const [mounted, setMounted] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const user = useSelector((state: any) => state.auth.user);
    const { unreadCount } = useSelector((state: any) => state.notifications);
    const { data: notificationsData } = useGetNotificationsQuery("doctor", { skip: !mounted });
    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (notificationsData?.data) {
            const list = notificationsData.data.notifications || notificationsData.data;
            dispatch(setNotifications(list));
        }
    }, [notificationsData, dispatch]);

    const handleLogout = () => {
        dispatch(logout());
        localStorage.clear();
        toast.success(t('toast.logoutSuccess'));
        router.push("/login");
    };

    const navLinks = [
        { href: "/dashboard/doctor", label: t('nav.dashboard'), icon: LayoutDashboardIcon },
        { href: "/dashboard/doctor/patients", label: t('nav.patients'), icon: UsersIcon },
        { href: "/dashboard/doctor/prescriptions", label: t('nav.prescriptions'), icon: FileText },
        { href: "/dashboard/doctor/appointments", label: t('nav.appointments'), icon: Calendar },
        { href: "/dashboard/doctor/chat", label: t('nav.chat'), icon: MessageSquare },
        { href: "/dashboard/doctor/schedule", label: t('nav.schedule'), icon: ClockIcon },
    ];

    const { data: conversationsData } = useGetConversationsQuery({ viewerRole: 'doctor' }, {
        pollingInterval: 30000,
        skip: !mounted
    });

    const totalChatUnread = conversationsData?.data?.reduce((acc: number, conv: any) => acc + (conv.unreadCount || 0), 0) || 0;

    const isActive = (href: string) => {
        if (href === "/dashboard/doctor") return pathname === href;
        return pathname?.startsWith(href);
    };

    if (!mounted) return null;

    return (
        <>
            <header className="lens-topbar h-16 border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#18181b]/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between w-full">
                {/* Logo - ONLY MOBILE */}
                <Link href="/dashboard/doctor" className="flex items-center gap-2.5 group lg:hidden">
                    <Image
                        src="/medeaz.jpeg"
                        alt="Medeaz Logo"
                        width={32}
                        height={32}
                        priority
                        className="rounded-lg object-cover group-hover:scale-105 transition-all"
                    />
                </Link>

                <h1 className="hidden lg:block text-sm font-black uppercase tracking-[0.2em] text-text-primary">
                    {title || t('nav.doctorPortal')}
                </h1>

                {/* Right Side Options */}
                <div className="flex items-center gap-3">
                    {/* Desktop Notifications */}
                    <button
                        onClick={() => setIsNotificationOpen(true)}
                        className="h-10 w-10 text-text-secondary hover:bg-black/5 rounded-xl flex items-center justify-center relative transition-colors cursor-pointer group"
                    >
                        <FilledBellIcon className="h-5 w-5" />
                        {(unreadCount > 0 || totalChatUnread > 0) && (
                            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-[#18181b] flex items-center justify-center shadow-sm pointer-events-none">
                                {(unreadCount + totalChatUnread) > 9 ? '9+' : (unreadCount + totalChatUnread)}
                            </span>
                        )}
                    </button>

                    <LanguageSwitcher />

                    {/* Unified Hamburger - ALWAYS RIGHT */}
                    <Hamburger
                        isOpen={isMenuOpen}
                        onClick={() => setIsMenuOpen(true)}
                        className="text-black dark:text-white ml-2 cursor-pointer lg:hidden"
                    />
                </div>
            </header>

            <NotificationPanel isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />

            {/* Right Drawer */}
            <div className={`fixed inset-0 z-50 transition-all duration-500 ${isMenuOpen ? "visible" : "invisible"}`}>
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${isMenuOpen ? "opacity-100" : "opacity-0"}`}
                    onClick={() => setIsMenuOpen(false)}
                />

                {/* Drawer Panel */}
                <div className={`absolute right-0 top-0 h-full w-full max-w-[88vw] sm:max-w-sm bg-white dark:bg-[#18181b] shadow-2xl transition-transform duration-500 ease-out border-l border-black/5 dark:border-white/5 ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
                    <div className="flex flex-col h-full">
                        {/* Drawer Header */}
                        <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                            <h2 className={`font-bold text-gray-900 dark:text-white text-sm ${isRtl ? "tracking-normal" : "uppercase tracking-[0.2em] text-xs"}`}>{t('nav.doctorPortal')}</h2>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            >
                                <XIcon className="h-5 w-5" />
                            </button>
                        </div>


                        {/* Navigation Links */}
                        <nav className={`flex-1 overflow-y-auto p-4 space-y-1 ${isRtl ? "text-right" : ""}`}>
                            <p className={`px-3 text-[11px] font-bold text-gray-400 mt-4 mb-2 ${isRtl ? "tracking-normal" : "uppercase tracking-widest text-[10px]"}`}>{t('nav.navigation')}</p>
                            {navLinks.map((link) => {
                                const Icon = link.icon;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${isRtl ? "justify-end" : ""} ${isActive(link.href)
                                            ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                                            : "text-gray-500 hover:text-primary hover:bg-primary/5"
                                            }`}
                                    >
                                        <Icon size={18} />
                                        <span>{link.label}</span>
                                        {link.label === "Chat" && totalChatUnread > 0 && (
                                            <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-[#18181b]">
                                                {totalChatUnread > 9 ? '9+' : totalChatUnread}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}

                            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-8 mb-2">{t('nav.settings')}</p>
                            <Link
                                href="/dashboard/doctor/profile"
                                onClick={() => setIsMenuOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${isActive("/dashboard/doctor/profile")
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-gray-500 hover:text-primary hover:bg-primary/5"
                                    }`}
                            >
                                <UserIconAnimated size={18} />
                                <span>{t('nav.profile')}</span>
                            </Link>
                        </nav>

                        {/* Drawer Footer */}
                        <div className="p-6 border-t border-black/5 dark:border-white/5 space-y-3">
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
