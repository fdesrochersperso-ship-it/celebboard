"use client";

import { useState } from "react";
import { EMPLOYEE_PHOTOS } from "@/lib/marketing-assets";

const AVATAR_GRADIENTS: Record<string, string> = {
  JD: "from-[hsl(195,80%,50%)] to-[hsl(210,90%,60%)]",
  SM: "from-[hsl(330,70%,55%)] to-[hsl(350,80%,60%)]",
  AK: "from-[hsl(142,70%,45%)] to-[hsl(160,80%,50%)]",
  LR: "from-[hsl(270,70%,55%)] to-[hsl(290,80%,60%)]",
  MP: "from-[hsl(38,80%,50%)] to-[hsl(45,90%,55%)]",
};

const SIZE_CLASSES = {
  xs: "w-6 h-6",
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-14 h-14",
  xl: "w-16 h-16 lg:w-20 lg:h-20",
} as const;

type AvatarSize = keyof typeof SIZE_CLASSES;

export type EmployeeInitials = keyof typeof EMPLOYEE_PHOTOS;

interface EmployeeAvatarProps {
  initials: EmployeeInitials;
  size?: AvatarSize;
  className?: string;
  borderClassName?: string;
}

export function EmployeeAvatar({
  initials,
  size = "md",
  className = "",
  borderClassName = "border-2 border-background",
}: EmployeeAvatarProps) {
  const [error, setError] = useState(false);
  const src = EMPLOYEE_PHOTOS[initials];
  const gradient = AVATAR_GRADIENTS[initials];
  const sizeClass = SIZE_CLASSES[size];

  if (error || !src) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center ${borderClassName} shrink-0 ${className}`}
      >
        <span className="text-[9px] font-bold text-white">{initials}</span>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden ${borderClassName} shrink-0 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="w-full h-full object-cover object-center"
        onError={() => setError(true)}
      />
    </div>
  );
}
