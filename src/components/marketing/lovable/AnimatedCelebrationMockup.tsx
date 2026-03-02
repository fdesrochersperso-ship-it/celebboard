import { MockupFrame } from "./MockupFrame";
import { EmployeeAvatar } from "@/components/marketing/EmployeeAvatar";

const confettiColors = [
  "hsl(195,100%,50%)",
  "hsl(38,95%,55%)",
  "hsl(142,76%,45%)",
  "hsl(340,82%,52%)",
  "hsl(45,100%,60%)",
  "hsl(270,80%,65%)",
];

const avatars = [
  {
    initials: "JD",
    gradient: "from-[hsl(195,80%,50%)] to-[hsl(210,90%,60%)]",
    name: "John D.",
    role: "Deal Owner",
  },
  {
    initials: "SM",
    gradient: "from-[hsl(330,70%,55%)] to-[hsl(350,80%,60%)]",
    name: "Sarah M.",
    role: "Account Manager",
  },
];

export function AnimatedCelebrationMockup() {
  return (
    <MockupFrame>
      <div className="aspect-video bg-gradient-to-b from-[hsl(220,26%,8%)] to-background relative overflow-hidden flex items-center justify-center">
        {/* Confetti rain */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-sm"
            style={{
              width: 6 + Math.random() * 4,
              height: 6 + Math.random() * 4,
              left: `${5 + Math.random() * 90}%`,
              backgroundColor: confettiColors[i % confettiColors.length],
              animation: `confetti-enhanced ${3 + Math.random() * 2}s ease-in-out ${Math.random() * 3}s infinite`,
            }}
          />
        ))}

        {/* Center content */}
        <div
          className="relative z-10 text-center space-y-4"
          style={{ animation: "celebration-mockup-cycle 8s ease-in-out infinite" }}
        >
          {/* Avatars */}
          <div className="flex justify-center gap-4">
            {avatars.map((a, i) => (
              <div
                key={a.initials}
                className="text-center opacity-0"
                style={{
                  animation: `photo-bounce 0.7s ease-out ${0.5 + i * 0.3}s forwards`,
                }}
              >
                <EmployeeAvatar initials={a.initials} size="xl" className="animate-pulse-glow" borderClassName="border-4 border-background" />
                <div className="mt-1">
                  <span className="text-xs font-semibold text-foreground block">
                    {a.name}
                  </span>
                  <span className="text-[9px] text-muted-foreground">{a.role}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-2xl lg:text-3xl font-black text-foreground animate-title-glow">
            New Deal Closed! 🎉
          </div>

          {/* Counting amount */}
          <div
            className="text-xl lg:text-2xl font-bold text-[hsl(142,76%,45%)]"
            style={{ animation: "count-up-glow 2s ease-out forwards" }}
          >
            $25,000 CAD
          </div>

          {/* Bouncing dots */}
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                style={{
                  animation: `bounce-dot 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </MockupFrame>
  );
}
