import type { ReactNode } from "react";

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  gradient?: "primary" | "celebration" | "success" | "hero";
}

export function GradientText({
  children,
  className = "",
  gradient = "hero",
}: GradientTextProps) {
  const gradients: Record<string, string> = {
    primary: "from-[hsl(195,100%,50%)] to-[hsl(210,100%,60%)]",
    celebration: "from-[hsl(38,95%,55%)] to-[hsl(45,100%,60%)]",
    success: "from-[hsl(142,76%,45%)] to-[hsl(150,80%,50%)]",
    hero: "from-[hsl(195,100%,50%)] via-[hsl(270,91%,65%)] to-[hsl(38,95%,55%)]",
  };

  return (
    <span
      className={`bg-gradient-to-r ${gradients[gradient]} bg-clip-text text-transparent ${className}`}
    >
      {children}
    </span>
  );
}
