"use client";

import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HintTier {
  tier: number;
  label: string;
  description: string;
  cost: number;
}

export interface AnswerFooterProps {
  coinBalance: number;
  hintTiers: HintTier[];
  hintTierUsed: number;
  feedback: "correct" | "wrong" | null;
  phase: "playing" | "feedback" | "advancing" | "loading" | "ended";
  autoAdvanceProgress: number;
  autoAdvanceMs: number;
  onHint: (tier: number) => void;
  onSkipAdvance: () => void;
  className?: string;
}

export default function AnswerFooter({
  coinBalance,
  hintTiers,
  hintTierUsed,
  feedback,
  phase,
  autoAdvanceProgress: _autoAdvanceProgress,
  autoAdvanceMs: _autoAdvanceMs,
  onHint,
  onSkipAdvance: _onSkipAdvance,
  className,
}: AnswerFooterProps) {
  const showHints = phase === "playing" && !feedback;

  return (
    <div className={cn("mt-4", className)}>
      {showHints ? (
        <div className="space-y-2">
          <div className="mb-2 flex justify-end">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-coin">
              <Coins className="size-3.5" aria-hidden />
              Coins: {coinBalance}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {hintTiers.map((hint) => {
              const used = hint.tier <= hintTierUsed;
              const locked = hint.tier > hintTierUsed + 1;
              const canAfford = coinBalance >= hint.cost;
              const isActive = hint.tier === hintTierUsed + 1 && !used && canAfford;
              const cannotAfford = hint.tier === hintTierUsed + 1 && !used && !canAfford;
              const disabled = used || locked || cannotAfford;
              return (
                <button
                  key={hint.tier}
                  type="button"
                  disabled={disabled}
                  onClick={() => onHint(hint.tier)}
                  className={cn(
                    "rounded-xl border px-2 py-2.5 text-center",
                    isActive && "border-primary/40 bg-primary/10 text-foreground",
                    used && "border-success/30 bg-success/10 text-success",
                    !isActive && !used && "border-border bg-surface-1",
                    locked && "cursor-not-allowed opacity-40",
                    cannotAfford && "cursor-not-allowed opacity-50",
                  )}
                >
                  <p className="text-[11px] font-semibold text-foreground">{hint.label}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{hint.description}</p>
                  <p className="mt-0.5 text-[10px] text-coin">{hint.cost} coins</p>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {phase === "playing" && !feedback ? (
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Tap a piece, then tap its destination
        </p>
      ) : null}
    </div>
  );
}
