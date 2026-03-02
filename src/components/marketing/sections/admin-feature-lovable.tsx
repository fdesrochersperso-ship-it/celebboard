"use client";

import {
  GradientText,
  FeatureSection,
  AnimatedOnScroll,
} from "@/components/marketing/lovable";
import { EmployeeAvatar } from "@/components/marketing/EmployeeAvatar";
import { Settings, Volume2, Users, History } from "lucide-react";

const themes = [
  {
    name: "Dark",
    bg: "hsl(220,26%,14%)",
    primary: "hsl(195,100%,50%)",
    accent: "hsl(38,95%,55%)",
  },
  {
    name: "Light",
    bg: "hsl(40,33%,97%)",
    primary: "hsl(270,91%,65%)",
    accent: "hsl(48,96%,53%)",
  },
  {
    name: "Vibrant",
    bg: "hsl(260,30%,12%)",
    primary: "hsl(330,100%,60%)",
    accent: "hsl(45,100%,55%)",
  },
  {
    name: "helloDarwin",
    bg: "hsl(40,30%,96%)",
    primary: "hsl(300,60%,45%)",
    accent: "hsl(52,100%,50%)",
  },
];

const avatarStack = [
  { initials: "JD", gradient: "from-[hsl(195,80%,50%)] to-[hsl(210,90%,60%)]" },
  { initials: "SM", gradient: "from-[hsl(330,70%,55%)] to-[hsl(350,80%,60%)]" },
  { initials: "AK", gradient: "from-[hsl(142,70%,45%)] to-[hsl(160,80%,50%)]" },
  { initials: "LR", gradient: "from-[hsl(270,70%,55%)] to-[hsl(290,80%,60%)]" },
  { initials: "MP", gradient: "from-[hsl(38,80%,50%)] to-[hsl(45,90%,55%)]" },
];

const celebrationHistory = [
  { company: "Acme Corp", amount: "$15K", time: "2 min ago" },
  { company: "TechStart", amount: "$8.5K", time: "15 min ago" },
  { company: "DataFlow", amount: "$22K", time: "1 hr ago" },
  { company: "CloudBase", amount: "$11K", time: "3 hr ago" },
];

export function AdminFeaturePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-20 right-1/4 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <AnimatedOnScroll>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Settings className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Admin & Customization</span>
            </div>
          </AnimatedOnScroll>
          <AnimatedOnScroll delay={100}>
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
              Make it <GradientText>yours</GradientText>
            </h1>
          </AnimatedOnScroll>
          <AnimatedOnScroll delay={200}>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              4 themes, configurable sounds per event type, employee management, and full
              celebration history.
            </p>
          </AnimatedOnScroll>
        </div>
      </section>

      {/* Theme showcase with flip preview */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedOnScroll className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-4">
              4 stunning themes
            </h2>
            <p className="text-lg text-muted-foreground">Switch instantly. Every component adapts.</p>
          </AnimatedOnScroll>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {themes.map((theme, i) => (
              <AnimatedOnScroll key={theme.name} delay={i * 100}>
                <div className="group [perspective:600px]">
                  <div className="relative transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                    {/* Front */}
                    <div className="rounded-xl border border-border overflow-hidden [backface-visibility:hidden]">
                      <div
                        className="aspect-[4/3] p-4 flex flex-col justify-between"
                        style={{ backgroundColor: theme.bg }}
                      >
                        <div className="flex gap-2">
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: theme.primary }}
                          />
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: theme.accent }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div
                            className="h-2 w-3/4 rounded"
                            style={{ backgroundColor: theme.primary, opacity: 0.3 }}
                          />
                          <div
                            className="h-2 w-1/2 rounded"
                            style={{ backgroundColor: theme.accent, opacity: 0.3 }}
                          />
                        </div>
                      </div>
                      <div className="p-3 bg-card text-center">
                        <span className="text-sm font-semibold text-foreground">{theme.name}</span>
                      </div>
                    </div>
                    {/* Back */}
                    <div className="absolute inset-0 rounded-xl border border-border overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <div
                        className="aspect-[4/3] p-3 flex flex-col gap-2"
                        style={{ backgroundColor: theme.bg }}
                      >
                        <div className="grid grid-cols-2 gap-1.5 flex-1">
                          {[1, 2, 3, 4].map((n) => (
                            <div
                              key={n}
                              className="rounded p-1.5"
                              style={{ backgroundColor: `${theme.primary}22` }}
                            >
                              <div
                                className="h-1.5 w-1/2 rounded mb-1"
                                style={{ backgroundColor: theme.primary, opacity: 0.5 }}
                              />
                              <div
                                className="text-[8px] font-bold"
                                style={{ color: theme.primary }}
                              >
                                {["42", "$12K", "89", "1.2K"][n - 1]}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 bg-card text-center">
                        <span className="text-xs text-muted-foreground">Dashboard Preview</span>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Sound Config */}
      <FeatureSection
        badge="Audio"
        title="Custom sounds for every event"
        description="Configure unique ringtones per celebration type. Standard deals play the goal horn. High-value deals above a configurable threshold get a premium sound. Each event type can be enabled/disabled independently."
        visual={
          <div className="space-y-3 max-w-sm mx-auto">
            {[
              { event: "Deal Accepted", sound: "Goal Horn", enabled: true },
              { event: "New Subscriber", sound: "Cash Register", enabled: true },
              { event: "Churn Alert", sound: "Warning Siren", enabled: true },
              { event: "Plat du Jour", sound: "Dinner Bell", enabled: false },
            ].map((item, i) => (
              <div
                key={item.event}
                className="rounded-lg border border-border bg-card/50 backdrop-blur-sm p-4 flex items-center gap-4 opacity-0"
                style={{
                  animation: `slide-in-from-left 0.5s ease-out ${i * 0.15}s forwards`,
                }}
              >
                <Volume2
                  className={`w-5 h-5 ${item.enabled ? "text-primary" : "text-muted-foreground/40"}`}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{item.event}</div>
                  <div className="text-xs text-muted-foreground">{item.sound}</div>
                </div>
                <div
                  className={`w-9 h-5 rounded-full ${item.enabled ? "bg-primary" : "bg-muted"} relative transition-colors`}
                >
                  <div
                    className="w-4 h-4 rounded-full bg-foreground absolute top-0.5 transition-all duration-500"
                    style={{
                      left: item.enabled ? "18px" : "2px",
                      animation: `slide-up-card 0.6s ease-out ${0.8 + i * 0.15}s both`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        }
      />

      {/* Employee Management + History */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <AnimatedOnScroll>
              <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-8 h-full space-y-4">
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center">
                  <Users className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Employee Management</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Add team members manually or sync from HubSpot. Upload photos, map HubSpot owner IDs, and bulk-sync employee photos via an edge function.
                </p>
                <div className="flex -space-x-3 mt-4">
                  {avatarStack.map((a, i) => (
                    <div
                      key={a.initials}
                      className="opacity-0"
                      style={{
                        animation: `slide-in-from-left 0.4s ease-out ${i * 0.1}s forwards`,
                      }}
                    >
                      <EmployeeAvatar initials={a.initials} size="md" />
                    </div>
                  ))}
                  <div
                    className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground opacity-0"
                    style={{ animation: "slide-in-from-left 0.4s ease-out 0.5s forwards" }}
                  >
                    +12
                  </div>
                </div>
              </div>
            </AnimatedOnScroll>
            <AnimatedOnScroll delay={150}>
              <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-8 h-full space-y-4">
                <div className="w-14 h-14 rounded-xl gradient-celebration flex items-center justify-center">
                  <History className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Celebration History</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every celebration is logged. Browse the history, replay past celebrations, or mark
                  false positives. Full audit trail with timestamps and deal details.
                </p>
                <div className="space-y-2 mt-4">
                  {celebrationHistory.map((item, i) => (
                    <div
                      key={item.company}
                      className="text-xs text-muted-foreground flex items-center gap-2 opacity-0"
                      style={{
                        animation: `slide-in-from-left 0.4s ease-out ${i * 0.2}s forwards`,
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-success" />
                      {item.company} — {item.amount} — {item.time}
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
