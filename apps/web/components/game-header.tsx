"use client";

import { useEffect, useState } from "react";
import { Heart, Timer, X } from "lucide-react";

export function GameHeader({
  lives,
  startTime,
  running,
  puzzleIndex,
  totalPuzzles,
  onExit,
}: {
  lives: number;
  startTime: number;
  running: boolean;
  puzzleIndex: number;
  totalPuzzles: number;
  onExit: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [running, startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onExit}
          className="h-9 w-9 rounded-lg bg-surface-1 flex items-center justify-center border border-border"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-2 text-sm font-semibold tabular-nums text-foreground">
          <span>{puzzleIndex + 1}</span>
          <span className="text-muted-foreground font-normal">/ {totalPuzzles}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums text-foreground">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span>{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</span>
          </div>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: Math.max(0, lives) }).map((_, index) => (
              <Heart key={index} className="h-5 w-5 fill-red-500 text-red-500" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
