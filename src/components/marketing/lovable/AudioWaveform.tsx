interface AudioWaveformProps {
  className?: string;
}

export function AudioWaveform({ className = "" }: AudioWaveformProps) {
  return (
    <div className={`flex items-center gap-0.5 h-8 ${className}`}>
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-primary/60"
          style={{
            animation: `equalizer-bar 1.5s ease-in-out ${i * 0.1}s infinite`,
            height: "100%",
          }}
        />
      ))}
    </div>
  );
}
