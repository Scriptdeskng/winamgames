"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function GameHeader({
  title,
  lives,
  startTime,
  running,
  puzzleIndex,
  totalPuzzles,
  onExit,
}: {
  title: string;
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

        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold tabular-nums text-foreground">{puzzleIndex + 1}<span className="text-muted-foreground font-normal"> / {totalPuzzles}</span></span>
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{title}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-full bg-surface-1 border border-border px-2.5 py-1 text-xs font-semibold tabular-nums text-foreground">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          <div className="rounded-full bg-surface-1 border border-border px-2.5 py-1 text-xs font-semibold tabular-nums text-foreground">
            {"♥".repeat(Math.max(0, lives))}
          </div>
        </div>
      </div>
    </div>
  );
}

