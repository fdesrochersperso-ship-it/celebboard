import type { ReactNode } from "react";
import { AnimatedOnScroll } from "./AnimatedOnScroll";

interface FeatureSectionProps {
  title: string;
  description: ReactNode;
  visual: ReactNode;
  reversed?: boolean;
  badge?: ReactNode;
  children?: ReactNode;
}

export function FeatureSection({
  title,
  description,
  visual,
  reversed = false,
  badge,
  children,
}: FeatureSectionProps) {
  return (
    <section className="py-20 lg:py-28">
      <div
        className={`max-w-7xl mx-auto px-6 lg:px-8 flex flex-col ${
          reversed ? "lg:flex-row-reverse" : "lg:flex-row"
        } items-center gap-12 lg:gap-20`}
      >
        <AnimatedOnScroll
          direction={reversed ? "right" : "left"}
          className="flex-1 space-y-6"
        >
          {badge && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              {badge}
            </span>
          )}
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground leading-tight">
            {title}
          </h2>
          <div className="text-lg text-muted-foreground leading-relaxed max-w-xl">
            {description}
          </div>
          {children}
        </AnimatedOnScroll>
        <AnimatedOnScroll
          direction={reversed ? "left" : "right"}
          className="flex-1 w-full"
        >
          {visual}
        </AnimatedOnScroll>
      </div>
    </section>
  );
}
