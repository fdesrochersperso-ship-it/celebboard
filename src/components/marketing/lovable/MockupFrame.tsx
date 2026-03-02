import type { ReactNode } from "react";

interface MockupFrameProps {
  children: ReactNode;
  className?: string;
  variant?: "monitor" | "browser";
}

export function MockupFrame({
  children,
  className = "",
  variant = "browser",
}: MockupFrameProps) {
  return (
    <div
      className={`rounded-xl border border-border overflow-hidden shadow-elevated ${className}`}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-secondary/80 border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[hsl(0,84%,60%)]" />
          <div className="w-3 h-3 rounded-full bg-[hsl(45,100%,60%)]" />
          <div className="w-3 h-3 rounded-full bg-[hsl(142,76%,45%)]" />
        </div>
        {variant === "browser" && (
          <div className="flex-1 mx-4">
            <div className="h-6 rounded-md bg-muted flex items-center px-3">
              <span className="text-[10px] text-muted-foreground">
                app.celebboard.com
              </span>
            </div>
          </div>
        )}
      </div>
      {/* Content */}
      <div className="bg-background">{children}</div>
    </div>
  );
}
