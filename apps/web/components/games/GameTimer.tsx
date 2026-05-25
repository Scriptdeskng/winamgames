"use client";

import { cn } from "@/lib/utils";

export interface GameTimerProps {
  elapsedMs: number;
  className?: string;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function GameTimer({ elapsedMs, className }: GameTimerProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg bg-surface-1 px-2.5 py-1 font-mono text-sm font-semibold tabular-nums text-foreground",
        className,
      )}
      aria-live="polite"
      aria-label={`Elapsed time ${formatElapsed(elapsedMs)}`}
    >
      {formatElapsed(elapsedMs)}
    </div>
  );
}
