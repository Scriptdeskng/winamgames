import { X } from "lucide-react";
import { GameTimer } from "./GameTimer";
import { LivesDisplay } from "./LivesDisplay";

interface GameHeaderProps {
  title: string;
  lives: number;
  startTime: number;
  running: boolean;
  puzzleIndex: number;
  totalPuzzles: number;
  onExit: () => void;
}

export function GameHeader({ title, lives, startTime, running, puzzleIndex, totalPuzzles, onExit }: GameHeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="h-9 w-9 rounded-lg bg-surface-1 flex items-center justify-center border border-border"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {puzzleIndex + 1} / {totalPuzzles}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <GameTimer startTime={startTime} running={running} />
          <LivesDisplay lives={lives} />
        </div>
      </div>
    </div>
  );
}
