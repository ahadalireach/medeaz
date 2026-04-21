import React from "react";

interface BadgeProps {
    children: React.ReactNode;
    variant?: "teal" | "blue" | "yellow" | "red" | "purple" | "slate" | "primary" | "secondary" | "danger" | "success" | "warning";
    className?: string;
}

export const Badge = ({ children, variant = "slate", className = "" }: BadgeProps) => {
    const variants: Record<string, string> = {
        teal: "bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 border-teal-500/20",
        blue: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20",
        yellow: "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400 border-yellow-500/20",
        red: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-500/20",
        purple: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-500/20",
        slate: "bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 border-slate-500/20",
        primary: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light border-primary/20",
        secondary: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
        danger: "bg-red-500 text-white border-red-600",
        success: "bg-[#0fbda2] text-white border-[#0fbda2]",
        warning: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    };

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};
