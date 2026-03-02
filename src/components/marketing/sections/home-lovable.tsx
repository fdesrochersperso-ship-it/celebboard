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
  Plug,
  Monitor,
  Sparkles,
} from "lucide-react";
import {
  AnimatedOnScroll,
  GradientText,
  FeatureCard,
  FloatingParticles,
  AnimatedDashboardMockup,
  MarketingAnimatedCounter,
} from "@/components/marketing/lovable";

const teamAvatars = [
  { initials: "JD", gradient: "from-[hsl(195,80%,50%)] to-[hsl(210,90%,60%)]" },
  { initials: "SM", gradient: "from-[hsl(330,70%,55%)] to-[hsl(350,80%,60%)]" },
  { initials: "AK", gradient: "from-[hsl(142,70%,45%)] to-[hsl(160,80%,50%)]" },
  { initials: "LR", gradient: "from-[hsl(270,70%,55%)] to-[hsl(290,80%,60%)]" },
  { initials: "MP", gradient: "from-[hsl(38,80%,50%)] to-[hsl(45,90%,55%)]" },
];

export function HomeLovable() {
  const t = useTranslations("home.hero");
  const tIntegrations = useTranslations("home.integrations");
  const tFeatureGrid = useTranslations("home.featureGrid");
  const tHowItWorks = useTranslations("home.howItWorks");
  const tCta = useTranslations("home.cta");

  const stats = [
    { value: "500+", label: "Celebrations triggered" },
    { value: "4", label: "Themes available" },
    { value: "6", label: "Integrations" },
    { value: "24/7", label: "Live updates" },
  ];

  const howItSteps = [
    {
      icon: Plug,
      step: "01",
      title: tHowItWorks("step1.title"),
      desc: tHowItWorks("step1.desc"),
      showAvatars: false,
    },
    {
      icon: Monitor,
      step: "02",
      title: tHowItWorks("step2.title"),
      desc: tHowItWorks("step2.desc"),
      showAvatars: false,
    },
    {
      icon: PartyPopper,
      step: "03",
      title: tHowItWorks("step3.title"),
      desc: tHowItWorks("step3.desc"),
      showAvatars: true,
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden marketing-animated">
        <FloatingParticles />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-36">
          <div className="text-center max-w-4xl mx-auto">
            <AnimatedOnScroll>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">{t("badge")}</span>
              </div>
            </AnimatedOnScroll>

            <AnimatedOnScroll delay={100}>
              <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
                {t("title")} <GradientText>{t("titleHighlight")}</GradientText>
              </h1>
            </AnimatedOnScroll>

            <AnimatedOnScroll delay={200}>
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                {t("subtitle")}
              </p>
            </AnimatedOnScroll>

            <AnimatedOnScroll delay={300}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" className="text-base px-8 h-12" asChild>
                  <Link href="/celebrations">
                    {t("ctaSeeFeatures")} <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
                  <Link href="/app">{t("ctaSecondary")}</Link>
                </Button>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">{t("noCard")}</p>
            </AnimatedOnScroll>
          </div>

          <AnimatedOnScroll
            delay={400}
            direction="scale"
            className="mt-16 lg:mt-24 max-w-5xl mx-auto"
          >
            <AnimatedDashboardMockup />
          </AnimatedOnScroll>
        </div>
      </section>

      {/* Integration logos */}
      <section className="py-12 border-y border-border bg-secondary/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-6">
            {tIntegrations("title")}
          </p>
          <div className="flex items-center justify-center gap-10 lg:gap-16 flex-wrap">
            {["HubSpot", "Slack", "Google Analytics", "Spotify"].map((name) => (
              <span
                key={name}
                className="text-lg font-semibold text-muted-foreground/60"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedOnScroll className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              {tFeatureGrid("lovableTitle")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {tFeatureGrid("lovableSubtitle")}
            </p>
          </AnimatedOnScroll>
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

      {/* How It Works */}
      <section className="py-20 lg:py-28 bg-secondary/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedOnScroll className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              {tHowItWorks("lovableTitle")}
            </h2>
          </AnimatedOnScroll>
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {howItSteps.map((item, i) => (
              <AnimatedOnScroll key={item.step} delay={i * 150}>
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-2">
                    <item.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-sm font-bold text-primary uppercase tracking-wider">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  {item.showAvatars && (
                    <div className="flex justify-center -space-x-2 pt-2">
                      {teamAvatars.map((a, ai) => (
                        <div
                          key={a.initials}
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${a.gradient} flex items-center justify-center border-2 border-background text-xs font-bold text-white opacity-0`}
                          style={{
                            animation: `slide-in-from-left 0.4s ease-out ${ai * 0.1}s forwards`,
                          }}
                        >
                          {a.initials}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AnimatedOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Stats with animated counters */}
      <section className="py-16 border-y border-border bg-secondary/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <AnimatedOnScroll key={stat.label} delay={i * 100} className="text-center">
                <MarketingAnimatedCounter
                  value={stat.value}
                  className="text-4xl lg:text-5xl font-black text-foreground mb-2"
                />
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
                  {stat.label}
                </div>
              </AnimatedOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <AnimatedOnScroll>
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
              {tCta("lovableTitleBefore")}
              <GradientText gradient="celebration">{tCta("lovableTitleHighlight")}</GradientText>?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              {tCta("lovableSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="text-base px-8 h-12" asChild>
                <Link href="/signup">{tCta("cta")}</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
                <Link href="/app">{tCta("ctaSecondary")}</Link>
              </Button>
            </div>
          </AnimatedOnScroll>
        </div>
      </section>
    </>
  );
}
