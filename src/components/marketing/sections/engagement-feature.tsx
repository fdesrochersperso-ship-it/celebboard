"use client";

import { useState, useEffect } from "react";
import {
  GradientText,
  FeatureSection,
  AnimatedOnScroll,
  MockupFrame,
  CSSEqualizer,
} from "@/components/marketing/lovable";
import { MessageSquare, Music, Quote, QrCode, Hash } from "lucide-react";

const slackMessages = [
  {
    text: '"Great team lunch today! 🍕"',
    author: "Sarah",
    channel: "general",
    avatar: "from-[hsl(330,70%,55%)] to-[hsl(350,80%,60%)]",
    initials: "SM",
  },
  {
    text: '"Just closed the Acme deal! 🎉"',
    author: "John",
    channel: "wins",
    avatar: "from-[hsl(195,80%,50%)] to-[hsl(210,90%,60%)]",
    initials: "JD",
  },
  {
    text: '"New office plants looking great 🌱"',
    author: "Alex",
    channel: "random",
    avatar: "from-[hsl(142,70%,45%)] to-[hsl(160,80%,50%)]",
    initials: "AK",
  },
];

const recentWins = [
  { company: "Acme Corp", amount: "$15,000", type: "Grant", avatars: ["JD", "SM"] },
  { company: "TechStart Inc", amount: "$8,500", type: "Signature", avatars: ["AK", "LR"] },
  { company: "DataFlow", amount: "$22,000", type: "Renewal", avatars: ["MP", "JD"] },
  { company: "CloudBase", amount: "$11,200", type: "Grant", avatars: ["SM", "AK"] },
];

const avatarGradients: Record<string, string> = {
  JD: "from-[hsl(195,80%,50%)] to-[hsl(210,90%,60%)]",
  SM: "from-[hsl(330,70%,55%)] to-[hsl(350,80%,60%)]",
  AK: "from-[hsl(142,70%,45%)] to-[hsl(160,80%,50%)]",
  LR: "from-[hsl(270,70%,55%)] to-[hsl(290,80%,60%)]",
  MP: "from-[hsl(38,80%,50%)] to-[hsl(45,90%,55%)]",
};

export function EngagementFeaturePage() {
  const [activeMsg, setActiveMsg] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setActiveMsg((p) => (p + 1) % slackMessages.length),
      3000
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-1/3 w-80 h-80 rounded-full bg-success/5 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <AnimatedOnScroll>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-8">
              <MessageSquare className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-success">Team Engagement</span>
            </div>
          </AnimatedOnScroll>
          <AnimatedOnScroll delay={100}>
            <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight mb-6">
              More than just <GradientText gradient="success">numbers</GradientText>
            </h1>
          </AnimatedOnScroll>
          <AnimatedOnScroll delay={200}>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Slack feed, Spotify integration, daily quotes, QR submissions, and auto-scrolling wins
              keep your dashboard alive and personal.
            </p>
          </AnimatedOnScroll>
        </div>
      </section>

      {/* Slack Feed */}
      <FeatureSection
        badge="Slack Integration"
        title="Live content from your team"
        description="Photos, messages, and reactions posted in designated Slack channels automatically appear in a rotating feed on the dashboard. Images show full-bleed with gradient overlays; text posts get colorful backgrounds."
        visual={
          <MockupFrame>
            <div className="aspect-[4/3] bg-background p-4 space-y-3 relative overflow-hidden">
              {slackMessages.map((msg, i) => (
                <div
                  key={msg.author}
                  className="rounded-lg border border-border bg-gradient-to-br from-primary/10 to-secondary/10 p-5 text-center transition-all duration-500 absolute inset-x-4"
                  style={{
                    top: "1rem",
                    opacity: activeMsg === i ? 1 : 0,
                    transform: activeMsg === i ? "translateY(0)" : "translateY(-10px)",
                  }}
                >
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${msg.avatar} flex items-center justify-center mx-auto mb-3 border-2 border-background`}
                  >
                    <span className="text-xs font-bold text-white">{msg.initials}</span>
                  </div>
                  <p className="text-foreground font-medium">{msg.text}</p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <span className="text-xs text-muted-foreground">
                      {msg.author} • <Hash className="w-3 h-3 inline" />
                      {msg.channel}
                    </span>
                  </div>
                </div>
              ))}
              <div className="rounded-lg border border-border overflow-hidden mt-32">
                <div className="h-24 bg-gradient-to-br from-muted to-secondary flex items-center justify-center text-muted-foreground text-sm">
                  📸 Team photo
                </div>
                <div className="p-3 bg-card flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[hsl(38,80%,50%)] to-[hsl(45,90%,55%)] flex items-center justify-center">
                    <span className="text-[7px] font-bold text-white">MP</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Mike • <Hash className="w-3 h-3 inline" />photos
                  </span>
                </div>
              </div>
            </div>
          </MockupFrame>
        }
      />

      {/* Spotify */}
      <FeatureSection
        reversed
        badge="Spotify"
        title="Now Playing on the office speakers"
        description="Songs shared in a dedicated Slack channel display as a compact 'Now Playing' card with album art, track name, artist, and who shared it. The pulsing green dot adds life to the dashboard."
        visual={
          <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden max-w-sm mx-auto">
            <div className="flex">
              <div className="w-1/2 aspect-square bg-gradient-to-br from-success/20 to-primary/20 flex items-center justify-center">
                <Music className="w-12 h-12 text-success" />
              </div>
              <div className="w-1/2 p-5 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 mb-2">
                  <CSSEqualizer />
                  <span className="text-[10px] uppercase tracking-wider text-success font-semibold ml-1">
                    Now Playing
                  </span>
                </div>
                <div className="text-sm font-bold text-foreground">Bohemian Rhapsody</div>
                <div className="text-xs text-muted-foreground">Queen</div>
                <div className="flex items-center gap-1.5 mt-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[hsl(195,80%,50%)] to-[hsl(210,90%,60%)] flex items-center justify-center">
                    <span className="text-[7px] font-bold text-white">AK</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Shared by Alex</span>
                </div>
              </div>
            </div>
          </div>
        }
      />

      {/* Quote + QR */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <AnimatedOnScroll>
              <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-8 h-full space-y-4">
                <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center">
                  <Quote className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">Quote of the Day</h3>
                <p className="text-muted-foreground leading-relaxed">
                  AI-generated motivational quotes rotate daily. Displayed with beautiful italic
                  typography and author attribution.
                </p>
                <div className="rounded-lg bg-secondary/50 p-4 border border-border">
                  <p className="text-lg italic text-foreground">
                    "The only way to do great work is to love what you do."
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">— Steve Jobs</p>
                </div>
              </div>
            </AnimatedOnScroll>
            <AnimatedOnScroll delay={150}>
              <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-8 h-full space-y-4">
                <div className="w-14 h-14 rounded-xl gradient-success flex items-center justify-center">
                  <QrCode className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">QR Submission System</h3>
                <p className="text-muted-foreground leading-relaxed">
                  A QR code on the dashboard links to a mobile form. Team members can snap a photo or
                  write a message that instantly appears in the feed.
                </p>
                <div className="flex items-center justify-center">
                  <div className="w-24 h-24 rounded-lg bg-foreground flex items-center justify-center animate-pulse-glow">
                    <QrCode className="w-16 h-16 text-background" />
                  </div>
                </div>
              </div>
            </AnimatedOnScroll>
          </div>
        </div>
      </section>

      {/* Recent Wins */}
      <FeatureSection
        badge="Auto-scroll"
        title="Recent Wins ticker"
        description="A continuously scrolling list of the latest closed deals, showing stacked avatars, company names, deal types, and amounts. Uses duplicated content for a seamless loop."
        visual={
          <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-4 max-w-sm mx-auto h-48 overflow-hidden">
            <div style={{ animation: "scroll-up-loop 8s linear infinite" }}>
              {[...recentWins, ...recentWins].map((win, i) => (
                <div
                  key={`${win.company}-${i}`}
                  className="flex items-center gap-3 rounded-lg bg-secondary/50 border border-border p-3 mb-3"
                >
                  <div className="flex -space-x-2">
                    {win.avatars.map((a) => (
                      <div
                        key={a}
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradients[a]} border-2 border-background flex items-center justify-center`}
                      >
                        <span className="text-[7px] font-bold text-white">{a}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {win.company}
                    </div>
                    <div className="text-xs text-muted-foreground">{win.type}</div>
                  </div>
                  <span className="text-sm font-bold text-accent">{win.amount}</span>
                </div>
              ))}
            </div>
          </div>
        }
      />
    </>
  );
}
