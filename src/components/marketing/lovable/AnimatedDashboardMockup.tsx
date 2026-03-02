import { MockupFrame } from "./MockupFrame";

const avatars = [
  {
    initials: "JD",
    gradient: "from-[hsl(195,80%,50%)] to-[hsl(210,90%,60%)]",
    name: "John D.",
  },
  {
    initials: "SM",
    gradient: "from-[hsl(330,70%,55%)] to-[hsl(350,80%,60%)]",
    name: "Sarah M.",
  },
  {
    initials: "AK",
    gradient: "from-[hsl(142,70%,45%)] to-[hsl(160,80%,50%)]",
    name: "Alex K.",
  },
];

const kpis = [
  { label: "Deals Closed", value: "42", gradient: "gradient-primary" },
  { label: "Revenue", value: "$128K", gradient: "gradient-celebration" },
  { label: "Active Users", value: "1,247", gradient: "gradient-primary" },
  { label: "Subscribers", value: "89", gradient: "gradient-success" },
];

export function AnimatedDashboardMockup() {
  return (
    <MockupFrame>
      <div className="aspect-video bg-gradient-to-br from-background via-card to-background p-6 lg:p-10 relative overflow-hidden">
        {/* KPI Cards slide in */}
        <div className="grid grid-cols-4 gap-3 w-full">
          {kpis.map((kpi, i) => (
            <div
              key={kpi.label}
              className="rounded-lg border border-border bg-card p-3 space-y-1.5 opacity-0"
              style={{
                animation: `slide-up-card 0.6s ease-out ${i * 0.2}s forwards, fade-card-loop 8s ease-in-out ${i * 0.2}s infinite`,
              }}
            >
              <div className={`w-7 h-7 rounded-md ${kpi.gradient}`} />
              <div className="text-[9px] text-muted-foreground">{kpi.label}</div>
              <div className="text-base font-bold text-foreground">{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Celebration popup that appears after delay */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0"
          style={{ animation: "celebration-mockup-cycle 8s ease-in-out 1.5s infinite" }}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div className="relative z-10 text-center space-y-3">
            {/* Confetti particles */}
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  left: `${15 + Math.random() * 70}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: [
                    "hsl(195,100%,50%)",
                    "hsl(38,95%,55%)",
                    "hsl(142,76%,45%)",
                    "hsl(340,82%,52%)",
                    "hsl(45,100%,60%)",
                  ][i % 5],
                  animation: `confetti-enhanced 3s ease-in-out ${Math.random() * 2}s infinite`,
                }}
              />
            ))}

            {/* Person avatar */}
            <div className="flex justify-center gap-3">
              {avatars.slice(0, 2).map((a, i) => (
                <div
                  key={a.initials}
                  className="text-center opacity-0"
                  style={{
                    animation: `photo-bounce 0.7s ease-out ${2 + i * 0.3}s forwards`,
                  }}
                >
                  <div
                    className={`w-14 h-14 rounded-full bg-gradient-to-br ${a.gradient} flex items-center justify-center border-2 border-background animate-pulse-glow`}
                  >
                    <span className="text-xs font-bold text-white">{a.initials}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-1 block">
                    {a.name}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-lg font-black text-foreground">New Deal Closed! 🎉</div>
            <div className="text-base font-bold text-[hsl(142,76%,45%)]">$25,000 CAD</div>
          </div>
        </div>
      </div>
    </MockupFrame>
  );
}
