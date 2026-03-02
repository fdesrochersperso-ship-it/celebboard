"use client";

import { useEffect, useRef, useState } from "react";

interface MarketingAnimatedCounterProps {
  value: string;
  className?: string;
}

export function MarketingAnimatedCounter({
  value,
  className = "",
}: MarketingAnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(value);
  const [hasAnimated, setHasAnimated] = useState(false);

  const numMatch = value.match(/^(\d+)/);
  const numericValue = numMatch ? parseInt(numMatch[1], 10) : null;
  const suffix = numMatch ? value.slice(numMatch[1].length) : value;

  useEffect(() => {
    if (numericValue === null) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 2000;
          const start = performance.now();

          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(numericValue * eased);
            setDisplay(`${current}${suffix}`);
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [numericValue, suffix, hasAnimated]);

  return (
    <div ref={ref} className={`tabular-nums ${className}`}>
      {display}
    </div>
  );
}
