"use client";

import { Timer, X } from "lucide-react";
import Link from "next/link";
import GameTimer from "@/components/games/GameTimer";
import LivesDisplay from "@/components/games/LivesDisplay";
import { cn } from "@/lib/utils";

export interface GameHeaderProps {
  puzzleIndex: number;
  totalPuzzles: number;
  elapsedMs: number;
  lives: number;
  maxLives: number;
  onExit?: () => void;
  className?: string;
}

export default function GameHeader({
  puzzleIndex,
  totalPuzzles,
  elapsedMs,
  lives,
  maxLives,
  onExit,
  className,
}: GameHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between border-b border-border px-4 py-3",
        className,
      )}
    >
      {onExit ? (
        <button
          type="button"
          onClick={onExit}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-1"
          aria-label="Exit game"
        >
          <X className="size-5 text-foreground" />
        </button>
      ) : (
        <Link
          href="/app"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-1"
          aria-label="Exit game"
        >
          <X className="size-5 text-foreground" />
        </Link>
      )}

      <p className="text-sm font-semibold tabular-nums text-foreground">
        {puzzleIndex + 1} / {totalPuzzles}
      </p>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <GameTimer elapsedMs={elapsedMs} />
        </div>
        <LivesDisplay lives={lives} maxLives={maxLives} />
      </div>
    </header>
  );
}
