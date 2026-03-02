"use client";

import { useTranslations } from "next-intl";
import {
  GradientText,
  FeatureSection,
  AnimatedOnScroll,
  FloatingParticles,
  AnimatedCelebrationMockup,
  AudioWaveform,
} from "@/components/marketing/lovable";
import { EmployeeAvatar } from "@/components/marketing/EmployeeAvatar";
import { PartyPopper, Volume2, Users, AlertTriangle, UtensilsCrossed } from "lucide-react";

const avatars = [
  { initials: "JD", gradient: "from-[hsl(195,80%,50%)] to-[hsl(210,90%,60%)]", name: "John D." },
  { initials: "SM", gradient: "from-[hsl(330,70%,55%)] to-[hsl(350,80%,60%)]", name: "Sarah M." },
  { initials: "AK", gradient: "from-[hsl(142,70%,45%)] to-[hsl(160,80%,50%)]", name: "Alex K." },
];

export function CelebrationsFeaturePage() {
  const t = useTranslations("features.celebrationEngine");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-32 marketing-animated">
        <FloatingParticles />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-1/4 w-72 h-72 rounded-full bg-accent/8 blur-3xl" />
          <div className="absolute bottom-10 left-1/3 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <AnimatedOnScroll>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8">
              <PartyPopper className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">Real-time Celebrations</span>
            </div>
          </AnimatedOnScroll>
          <AnimatedOnScroll delay={100}>
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
              Every deal deserves a{" "}
              <GradientText gradient="celebration">standing ovation</GradientText>
            </h1>
          </AnimatedOnScroll>
          <AnimatedOnScroll delay={200}>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
              {t("subtitle")}
            </p>
          </AnimatedOnScroll>
        </div>
      </section>

      {/* Animated Celebration Demo */}
      <FeatureSection
        badge="Core"
        title="Full-screen celebration popups"
        description={
          <>
            When a deal closes in HubSpot, a webhook fires and the dashboard erupts. Employee photos bounce in, confetti rains down, the goal horn blasts, and an animated counter rolls up to the deal value.
          </>
        }
        visual={<AnimatedCelebrationMockup />}
      >
        <div className="flex flex-wrap gap-3 mt-4">
          {["Confetti", "Sound FX", "Employee Photos", "Animated Counter"].map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-secondary text-foreground border border-border"
            >
              {tag}
            </span>
          ))}
        </div>
      </FeatureSection>

      {/* Epic Mode */}
      <FeatureSection
        reversed
        badge="Epic Mode"
        title="Extra-large celebrations for milestones"
        description="Subscription deals on the dev dashboard trigger Epic Mode: a golden gradient overlay, massive photos with triple-glow rings, a bouncing crown emoji, and screen shake. It's impossible to ignore."
        visual={
          <div className="rounded-xl border-2 border-[hsl(45,100%,50%)] overflow-hidden animate-epic-glow">
            <div className="aspect-video bg-gradient-to-br from-[hsl(45,50%,10%)] via-[hsl(0,0%,5%)] to-[hsl(270,30%,10%)] flex items-center justify-center p-8 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(45,80%,30%)/0.1] to-[hsl(270,60%,30%)/0.1]" />
              <div className="text-center z-10 space-y-4">
                <div className="text-4xl animate-bounce">👑</div>
                <div className="w-32 h-32 rounded-full border-4 border-[hsl(45,100%,50%)] mx-auto bg-gradient-to-br from-[hsl(270,70%,55%)] to-[hsl(290,80%,60%)] flex items-center justify-center animate-pulse-glow">
                  <span className="text-2xl font-bold text-white">TL</span>
                </div>
                <div className="text-xs text-muted-foreground">Thomas L.</div>
                <div className="text-2xl font-black text-[hsl(45,100%,60%)] animate-title-glow">
                  EPIC SUBSCRIPTION!
                </div>
                <div className="text-lg font-bold text-[hsl(142,76%,45%)]">$2,400/yr MRR</div>
              </div>
            </div>
          </div>
        }
      />

      {/* Churn + Plat du Jour */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedOnScroll className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              Not just celebrations
            </h2>
            <p className="text-lg text-muted-foreground">Special modes for every occasion.</p>
          </AnimatedOnScroll>
          <div className="grid md:grid-cols-2 gap-8">
            <AnimatedOnScroll>
              <div className="rounded-xl border border-[hsl(0,84%,40%)/0.3] bg-[hsl(0,30%,8%)] p-8 h-full space-y-4">
                <div className="w-14 h-14 rounded-xl bg-[hsl(0,84%,60%)/0.15] flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-[hsl(0,84%,60%)]" />
                </div>
                <h3 className="text-xl font-bold text-[hsl(0,84%,60%)]">Churn Alerts</h3>
                <p className="text-muted-foreground">
                  When a customer churns, the dashboard displays a red warning overlay with the lost
                  revenue amount. A sobering reminder that fuels the team to retain.
                </p>
              </div>
            </AnimatedOnScroll>
            <AnimatedOnScroll delay={150}>
              <div className="rounded-xl border border-[hsl(30,80%,40%)/0.3] bg-[hsl(30,20%,8%)] p-8 h-full space-y-4">
                <div className="w-14 h-14 rounded-xl bg-[hsl(30,80%,55%)/0.15] flex items-center justify-center">
                  <UtensilsCrossed className="w-7 h-7 text-[hsl(30,80%,55%)]" />
                </div>
                <h3 className="text-xl font-bold text-[hsl(30,80%,55%)]">Plat du Jour</h3>
                <p className="text-muted-foreground">
                  Daily food specials show up as a special celebration card with the meal photo and
                  description. A fun way to engage the office beyond metrics.
                </p>
              </div>
            </AnimatedOnScroll>
          </div>
        </div>
      </section>

      {/* Sound + Photos callout */}
      <section className="py-20 lg:py-28 bg-secondary/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <AnimatedOnScroll>
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center">
                  <Volume2 className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Custom Sound Effects</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Each celebration type gets its own ringtone. Standard deals play the goal horn.
                  High-value deals get a premium sound. All configurable per event type in admin.
                </p>
                <AudioWaveform className="mt-4" />
              </div>
            </AnimatedOnScroll>
            <AnimatedOnScroll delay={150}>
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-xl gradient-success flex items-center justify-center">
                  <Users className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Employee Photo System</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Photos auto-sync from your team database. Each celebration shows the deal owner and
                  account manager with spring-bounce animations and glowing borders.
                </p>
                <div className="flex gap-4 mt-4">
                  {avatars.map((a, i) => (
                    <div
                      key={a.initials}
                      className="text-center opacity-0"
                      style={{ animation: `photo-bounce 0.7s ease-out ${i * 0.2}s forwards` }}
                    >
                      <EmployeeAvatar initials={a.initials} size="lg" className="animate-pulse-glow" />
                      <span className="text-[10px] text-muted-foreground mt-1 block">{a.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedOnScroll>
          </div>
        </div>
      </section>
    </>
  );
}
