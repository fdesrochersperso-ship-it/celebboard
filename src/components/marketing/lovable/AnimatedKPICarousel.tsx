const cards = [
  { label: "Acceptations", value: "42", gradient: "gradient-primary", icon: "📊" },
  { label: "Revenue", value: "$128K", gradient: "gradient-celebration", icon: "💰" },
  {
    label: "Active Users",
    value: "1,247",
    gradient: "gradient-success",
    icon: "👥",
    live: true,
  },
  { label: "Subscribers", value: "89", gradient: "gradient-primary", icon: "📈" },
  { label: "MRR", value: "$4.2K", gradient: "gradient-celebration", icon: "🔄" },
  { label: "Churn", value: "2.1%", gradient: "gradient-success", icon: "📉" },
];

const allCards = [...cards, ...cards];

export function AnimatedKPICarousel() {
  return (
    <div className="rounded-xl border border-border overflow-hidden shadow-elevated">
      <div className="bg-background p-6 overflow-hidden">
        <div
          className="flex gap-4"
          style={{
            animation: "slide-left-loop 20s linear infinite",
            width: `${allCards.length * 180}px`,
          }}
        >
          {allCards.map((card, i) => (
            <div
              key={`${card.label}-${i}`}
              className="flex-shrink-0 w-40 rounded-lg border border-border bg-card p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-8 h-8 rounded-md ${card.gradient} flex items-center justify-center text-sm`}
                >
                  {card.icon}
                </div>
                {card.live && (
                  <span className="flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(0,84%,60%)] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(0,84%,60%)]" />
                    </span>
                    <span className="text-[9px] font-bold text-[hsl(0,84%,60%)]">
                      LIVE
                    </span>
                  </span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground">{card.label}</div>
              <div className="text-xl font-bold text-foreground">{card.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
