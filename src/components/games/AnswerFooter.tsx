import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AutoAdvanceRing } from "./AutoAdvanceRing";

interface AnswerFooterProps {
  feedback: "correct" | "incorrect" | null;
  isLastPuzzle: boolean;
  isGameOver: boolean;
  autoAdvanceMs: number;
  onAdvance: () => void;
  disabled?: boolean;
}

/**
 * Persistent footer shown after the player answers a puzzle.
 * - Correct: shows countdown ring + Next/See Results, auto-advances on timer.
 * - Incorrect: no ring, manual Continue/See Results — player chooses when to move on.
 */
export function AnswerFooter({
  feedback,
  isLastPuzzle,
  isGameOver,
  autoAdvanceMs,
  onAdvance,
  disabled,
}: AnswerFooterProps) {
  if (!feedback) return null;

  const isCorrect = feedback === "correct";
  const showRing = isCorrect && !isGameOver;
  const label = isLastPuzzle || isGameOver ? "See Results" : isCorrect ? "Next" : "Continue";

  return (
    <button
      onClick={onAdvance}
      disabled={disabled}
      className={cn(
        "group relative h-14 w-full rounded-xl font-semibold text-base transition-all overflow-hidden",
        "flex items-center justify-center gap-3",
        "disabled:opacity-50 disabled:pointer-events-none",
        isCorrect
          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow"
          : "bg-surface-1 border border-border text-foreground hover:border-primary/40"
      )}
    >
      {isCorrect && (
        <span className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
      )}
      <span className="relative inline-flex items-center justify-center gap-2.5">
        {showRing && (
          <span className={isCorrect ? "text-primary-foreground" : "text-success"}>
            <AutoAdvanceRing durationMs={autoAdvanceMs} />
          </span>
        )}
        {label}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}
