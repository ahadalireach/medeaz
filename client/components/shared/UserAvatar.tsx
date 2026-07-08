"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  initials?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  xs: { container: "w-6 h-6 text-[10px]", img: 24 },
  sm: { container: "w-8 h-8 text-[11px]", img: 32 },
  md: { container: "w-10 h-10 text-[13px]", img: 40 },
  lg: { container: "w-14 h-14 text-[17px]", img: 56 },
  xl: { container: "w-20 h-20 text-[22px]", img: 80 },
};

/** Generate 2-letter initials from a name or email */
function extractInitials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Pick a deterministic pastel background color from the initials */
const BG_COLORS = [
  "bg-[#e8f5f2] text-[#00b495]",
  "bg-[#eff6ff] text-[#3b82f6]",
  "bg-[#fef3c7] text-[#d97706]",
  "bg-[#fce7f3] text-[#db2777]",
  "bg-[#f0fdf4] text-[#16a34a]",
  "bg-[#f3e8ff] text-[#9333ea]",
];

function pickColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return BG_COLORS[Math.abs(hash) % BG_COLORS.length];
}

export function UserAvatar({ src, initials, name, size = "md", className }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const { container, img: imgSize } = SIZE_MAP[size];

  const letters = initials || extractInitials(name);
  const colorClass = pickColor(letters);

  const showImage = src && !imgError;

  return (
    <div
      className={cn(
        "relative flex-shrink-0 rounded-full overflow-hidden",
        container,
        !showImage && colorClass,
        className
      )}
    >
      {showImage ? (
        <Image
          src={src}
          alt={name || "Avatar"}
          width={imgSize}
          height={imgSize}
          className="object-cover w-full h-full"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          unoptimized // Google photo URLs don't need Next.js optimization
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-semibold leading-none select-none">
          {letters}
        </span>
      )}
    </div>
  );
}
