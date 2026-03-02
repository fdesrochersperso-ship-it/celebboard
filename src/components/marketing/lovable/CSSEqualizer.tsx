interface CSSEqualizerProps {
  className?: string;
}

export function CSSEqualizer({ className = "" }: CSSEqualizerProps) {
  return (
    <div className={`flex items-end gap-0.5 h-4 ${className}`}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-1 bg-[hsl(142,76%,45%)] rounded-full"
          style={{
            animation: `equalizer-bar 1.2s ease-in-out ${i * 0.15}s infinite`,
            height: "100%",
          }}
        />
      ))}
    </div>
  );
}
