import { AnimatedOnScroll } from "./AnimatedOnScroll";

interface Stat {
  value: string;
  label: string;
}

interface StatsBarProps {
  stats: Stat[];
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <section className="py-16 border-y border-border bg-secondary/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <AnimatedOnScroll key={stat.label} delay={i * 100} className="text-center">
              <div className="text-4xl lg:text-5xl font-black text-foreground mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
                {stat.label}
              </div>
            </AnimatedOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
