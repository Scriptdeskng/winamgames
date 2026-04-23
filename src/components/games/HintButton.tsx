import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const HINT_TIERS = [
  { tier: 1, label: "Eliminate 2", cost: 25 },
  { tier: 2, label: "First letter", cost: 75 },
  { tier: 3, label: "Reveal answer", cost: 150 },
] as const;

interface HintButtonProps {
  currentTier: number; // 0 = no hints used, 1 = tier1 used, etc.
  coinBalance: number;
  onUseHint: (tier: 1 | 2 | 3) => void;
  disabled?: boolean;
}

export function HintButton({ currentTier, coinBalance, onUseHint, disabled }: HintButtonProps) {
  const nextTier = currentTier + 1;
  if (nextTier > 3) return null;

  const hint = HINT_TIERS[nextTier - 1];
  const canAfford = coinBalance >= hint.cost;

  return (
    <button
      disabled={disabled || !canAfford}
      onClick={() => onUseHint(hint.tier as 1 | 2 | 3)}
      className={cn(
        "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all border",
        canAfford && !disabled
          ? "bg-surface-1 border-border text-foreground hover:border-primary/30"
          : "bg-surface-1/50 border-border/50 text-muted-foreground cursor-not-allowed opacity-50"
      )}
    >
      <Lightbulb className="h-4 w-4 text-coin" />
      <span>{hint.label}</span>
      <span className="ml-auto text-xs tabular-nums text-coin">{hint.cost} coins</span>
    </button>
  );
}
