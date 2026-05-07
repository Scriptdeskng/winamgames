"use client";

import { ArrowRight } from "lucide-react";
import { AutoAdvanceRing } from "./auto-advance-ring";

export function AnswerFooter({
  feedback,
  isLastPuzzle,
  isGameOver,
  autoAdvanceMs,
  onAdvance,
  disabled,
  closing,
}: {
  feedback: "correct" | "incorrect" | null;
  isLastPuzzle: boolean;
  isGameOver: boolean;
  autoAdvanceMs: number;
  onAdvance: () => void;
  disabled?: boolean;
  closing?: boolean;
}) {
  if (!feedback) return null;

  const isCorrect = feedback === "correct";
  const showRing = isCorrect && !isGameOver;
  const label = closing ? "Loading..." : isLastPuzzle || isGameOver ? "See Results" : isCorrect ? "Next" : "Continue";

  return (
    <button
      onClick={closing ? undefined : onAdvance}
      disabled={disabled || closing}
      className={`group relative h-14 w-full rounded-xl font-semibold text-base transition-all overflow-hidden flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none ${
        isCorrect ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow" : "bg-surface-1 border border-border text-foreground hover:border-primary/40"
      }`}
    >
      {isCorrect && <span className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />}
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

