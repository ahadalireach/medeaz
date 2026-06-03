import React from "react";

interface BadgeProps {
    children: React.ReactNode;
    variant?: "teal" | "blue" | "yellow" | "red" | "purple" | "slate" | "primary" | "secondary" | "danger" | "success" | "warning";
    className?: string;
}

export const Badge = ({ children, variant = "slate", className = "" }: BadgeProps) => {
    const variants: Record<string, string> = {
        teal: "bg-primary/10 text-primary   border-primary/20",
        blue: "bg-primary/10 text-primary   border-primary/20",
        yellow: "bg-[#B45309]/10 text-[#B45309]   border-[#B45309]/20",
        red: "bg-red-500/10 text-red-600   border-red-500/20",
        purple: "bg-primary/10 text-primary   border-primary/20",
        slate: "bg-surface-lavender/10 text-text-secondary   border-border/20",
        primary: "bg-primary/10 text-primary   border-primary/20",
        secondary: "bg-surface text-text-secondary   border-border-light ",
        danger: "bg-red-500 text-white border-red-600",
        success: "bg-[#0F4C5C] text-white border-[#0F4C5C]",
        warning: "bg-[#B45309]/10 text-[#B45309] border-[#B45309]/20",
    };

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};
