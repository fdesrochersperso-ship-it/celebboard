"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  PartyPopper,
  BarChart3,
  MessageSquare,
  Settings,
  ArrowRight,
} from "lucide-react";
import {
  AnimatedOnScroll,
  FeatureCard,
} from "@/components/marketing/lovable";

export function FeaturesHubPage() {
  const t = useTranslations("features.hero");
  const tCta = useTranslations("features.cta");

  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <AnimatedOnScroll>
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
              {t("title")}
            </h1>
          </AnimatedOnScroll>
          <AnimatedOnScroll delay={100}>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t("subtitle")}
            </p>
          </AnimatedOnScroll>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-20 lg:py-28 bg-secondary/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={PartyPopper}
              title="Real-time Celebrations"
              description="Full-screen confetti, sound effects, and employee photos every time a deal closes."
              href="/celebrations"
              delay={0}
              gradient="celebration"
            />
            <FeatureCard
              icon={BarChart3}
              title="Live KPI Dashboard"
              description="Auto-refreshing metrics from HubSpot and Google Analytics on your office TV."
              href="/dashboard"
              delay={100}
              gradient="primary"
            />
            <FeatureCard
              icon={MessageSquare}
              title="Team Engagement"
              description="Slack feed, Spotify integration, quotes, and a QR submission system."
              href="/engagement"
              delay={200}
              gradient="success"
            />
            <FeatureCard
              icon={Settings}
              title="Admin & Themes"
              description="4 themes, custom sounds, employee management, and full celebration control."
              href="/admin"
              delay={300}
              gradient="primary"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <AnimatedOnScroll>
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
              {tCta("title")}
            </h2>
            <p className="text-lg text-muted-foreground mb-10">{tCta("subtitle")}</p>
            <Button size="lg" className="text-base px-8 h-12" asChild>
              <Link href="/signup">
                {tCta("cta")} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </AnimatedOnScroll>
        </div>
      </section>
    </>
  );
}
