"use client";

import {
  GradientText,
  FeatureSection,
  AnimatedOnScroll,
  AnimatedKPICarousel,
} from "@/components/marketing/lovable";
import { EmployeeAvatar } from "@/components/marketing/EmployeeAvatar";
import { IntegrationLogo } from "@/components/marketing/IntegrationLogo";
import {
  BarChart3,
  Activity,
  TrendingUp,
  Trophy,
  ClipboardList,
} from "lucide-react";

const leaderboardPeople = [
  {
    initials: "JD",
    gradient: "from-[hsl(195,80%,50%)] to-[hsl(210,90%,60%)]",
    name: "John D.",
    value: "$45K",
    rank: "🥇",
  },
  {
    initials: "SM",
    gradient: "from-[hsl(330,70%,55%)] to-[hsl(350,80%,60%)]",
    name: "Sarah M.",
    value: "$38K",
    rank: "🥈",
  },
  {
    initials: "AK",
    gradient: "from-[hsl(142,70%,45%)] to-[hsl(160,80%,50%)]",
    name: "Alex K.",
    value: "$31K",
    rank: "🥉",
  },
];

const kpiCards = [
  {
    icon: TrendingUp,
    title: "Standard KPI",
    color: "gradient-primary",
    desc: "Big number, trend indicator, icon. Shows the metric at a glance with green/red trend badges.",
  },
  {
    icon: Trophy,
    title: "Leaderboard KPI",
    color: "gradient-celebration",
    desc: "Same as standard, plus a podium section showing top 3 reps with avatars, rank emojis, and values.",
    showLeaderboard: true,
  },
  {
    icon: ClipboardList,
    title: "Pace KPI",
    color: "gradient-success",
    desc: "Count vs. goal with a progress bar. Shows whether the team is ahead or behind pace with an arrow indicator.",
    showProgress: true,
  },
  {
    icon: Activity,
    title: "Live KPI",
    color: "gradient-primary",
    desc: "Real-time number from Google Analytics with a pulsing red 'Live' dot. Animates on every value change.",
    showLive: true,
  },
];

export function DashboardFeaturePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <AnimatedOnScroll>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Live KPI Dashboard</span>
            </div>
          </AnimatedOnScroll>
          <AnimatedOnScroll delay={100}>
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
              Your metrics, <GradientText gradient="primary">always live</GradientText>
            </h1>
          </AnimatedOnScroll>
          <AnimatedOnScroll delay={200}>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Auto-refreshing KPI cards, leaderboards, charts, and real-time Google Analytics — all on one beautiful screen.
            </p>
          </AnimatedOnScroll>
        </div>
      </section>

      {/* KPI Card Variants */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedOnScroll className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              4 KPI card types
            </h2>
            <p className="text-lg text-muted-foreground">Each designed for a different data story.</p>
          </AnimatedOnScroll>
          <div className="grid md:grid-cols-2 gap-8">
            {kpiCards.map((card, i) => (
              <AnimatedOnScroll key={card.title} delay={i * 100}>
                <div
                  className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-8 flex flex-col gap-4 hover:scale-[1.02] transition-transform duration-300"
                  style={{ perspective: "1000px" }}
                >
                  <div className="flex gap-6 items-start">
                    <div
                      className={`w-14 h-14 rounded-xl ${card.color} flex items-center justify-center shrink-0`}
                    >
                      <card.icon className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{card.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{card.desc}</p>
                    </div>
                  </div>
                  {card.showLeaderboard && (
                    <div className="flex gap-3 mt-2">
                      {leaderboardPeople.map((p, pi) => (
                        <div
                          key={p.initials}
                          className="flex items-center gap-2 opacity-0"
                          style={{
                            animation: `slide-in-from-left 0.4s ease-out ${pi * 0.15}s forwards`,
                          }}
                        >
                          <span className="text-base">{p.rank}</span>
                          <EmployeeAvatar initials={p.initials} size="sm" borderClassName="border border-background" />
                          <div>
                            <div className="text-xs font-medium text-foreground">{p.name}</div>
                            <div className="text-[10px] text-muted-foreground">{p.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {card.showProgress && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>32 / 40 acceptations</span>
                        <span className="text-[hsl(142,76%,45%)]">↑ Ahead of pace</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full gradient-success"
                          style={{
                            width: "80%",
                            animation: "slide-up-card 1.5s ease-out forwards",
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {card.showLive && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(0,84%,60%)] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[hsl(0,84%,60%)]" />
                      </span>
                      <span className="text-xs font-bold text-[hsl(0,84%,60%)]">LIVE</span>
                      <span className="text-lg font-bold text-foreground ml-2">247</span>
                      <span className="text-xs text-muted-foreground">active visitors</span>
                    </div>
                  )}
                </div>
              </AnimatedOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Animated Carousel */}
      <FeatureSection
        badge="Auto-scroll"
        title="Carousel that loops forever"
        description="KPI cards auto-scroll in an infinite loop. Hover to pause. Perfect for an office TV you never touch."
        visual={<AnimatedKPICarousel />}
      />

      {/* Dual mode */}
      <FeatureSection
        reversed
        badge="Dual Mode"
        title="Service team & Dev team dashboards"
        description="Toggle between two dashboard modes. Service mode shows acceptations, revenue, and client metrics. Dev mode tracks subscribers, MRR, signups, and GitHub activity. Different KPIs, same great experience."
        visual={
          <div className="space-y-4">
            {[
              {
                label: "Service Mode",
                dotColor: "bg-primary",
                tags: ["Acceptations", "Revenue", "Churn Rate"],
                tagBg: "bg-primary/10 text-primary",
              },
              {
                label: "Dev Mode",
                dotColor: "bg-success",
                tags: ["Subscribers", "MRR", "Signups"],
                tagBg: "bg-success/10 text-success",
              },
            ].map((mode) => (
              <div
                key={mode.label}
                className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 space-y-3 hover:scale-[1.02] transition-transform duration-300"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${mode.dotColor}`} />
                  <span className="text-sm font-semibold text-foreground">{mode.label}</span>
                </div>
                <div className="flex gap-3">
                  {mode.tags.map((m) => (
                    <span
                      key={m}
                      className={`px-3 py-1 rounded-full text-xs ${mode.tagBg}`}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        }
      />

      {/* Integrations */}
      <section className="py-20 lg:py-28 bg-secondary/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <AnimatedOnScroll>
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              Plug into your stack
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-xl mx-auto">
              HubSpot for CRM data, Google Analytics for real-time visitors. All synced via webhooks
              and edge functions.
            </p>
          </AnimatedOnScroll>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <AnimatedOnScroll>
              <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-8 text-center space-y-3">
                <div className="flex justify-center">
                  <IntegrationLogo name="hubspot" size={80} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Deals, owners, pipeline stages, acceptation metrics
                </p>
              </div>
            </AnimatedOnScroll>
            <AnimatedOnScroll delay={100}>
              <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-8 text-center space-y-3">
                <div className="flex justify-center">
                  <IntegrationLogo name="ga4" size={80} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Real-time active users with live pulsing indicator
                </p>
              </div>
            </AnimatedOnScroll>
          </div>
        </div>
      </section>
    </>
  );
}
