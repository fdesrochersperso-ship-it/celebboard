import type { LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AnimatedOnScroll } from "./AnimatedOnScroll";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  delay?: number;
  gradient?: "primary" | "celebration" | "success";
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  href,
  delay = 0,
  gradient = "primary",
}: FeatureCardProps) {
  const gradientClasses: Record<string, string> = {
    primary: "gradient-primary",
    celebration: "gradient-celebration",
    success: "gradient-success",
  };

  return (
    <AnimatedOnScroll delay={delay}>
      <Link href={href} className="group block h-full">
        <div className="h-full rounded-xl border border-border bg-card/50 backdrop-blur-sm p-8 transition-all duration-300 hover:border-primary/50 hover:shadow-elevated hover:-translate-y-1">
          <div
            className={`w-14 h-14 rounded-xl ${gradientClasses[gradient]} flex items-center justify-center mb-6`}
          >
            <Icon className="w-7 h-7 text-primary-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </Link>
    </AnimatedOnScroll>
  );
}
