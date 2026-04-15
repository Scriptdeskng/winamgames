import { Crown, Shield, Castle, Crosshair, Sword, CircleUser } from "lucide-react";
import type { ComponentType } from "react";

export type RankTier = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";

interface RankConfig {
  label: string;
  icon: ComponentType<{ className?: string }>;
  minXp: number;
  color: string;
  bgColor: string;
}

export const RANK_CONFIG: Record<RankTier, RankConfig> = {
  pawn: { label: "Pawn", icon: CircleUser, minXp: 0, color: "text-muted-foreground", bgColor: "bg-muted/15" },
  knight: { label: "Knight", icon: Sword, minXp: 100, color: "text-blue-400", bgColor: "bg-blue-400/15" },
  bishop: { label: "Bishop", icon: Crosshair, minXp: 400, color: "text-purple-400", bgColor: "bg-purple-400/15" },
  rook: { label: "Rook", icon: Castle, minXp: 1000, color: "text-coin", bgColor: "bg-coin/15" },
  queen: { label: "Queen", icon: Shield, minXp: 2500, color: "text-streak", bgColor: "bg-streak/15" },
  king: { label: "King", icon: Crown, minXp: 5000, color: "text-xp", bgColor: "bg-xp/15" },
};

const RANK_ORDER: RankTier[] = ["pawn", "knight", "bishop", "rook", "queen", "king"];

function getNextRank(tier: RankTier): { tier: RankTier; minXp: number } | null {
  const idx = RANK_ORDER.indexOf(tier);
  if (idx >= RANK_ORDER.length - 1) return null;
  const next = RANK_ORDER[idx + 1];
  return { tier: next, minXp: RANK_CONFIG[next].minXp };
}

export function RankBadge({ tier }: { tier: RankTier }) {
  const config = RANK_CONFIG[tier] ?? RANK_CONFIG.pawn;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <div className={`h-8 w-8 rounded-lg ${config.bgColor} flex items-center justify-center`}>
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>
      <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
    </div>
  );
}

export function XpProgressBar({ xp, tier }: { xp: number; tier: RankTier }) {
  const config = RANK_CONFIG[tier] ?? RANK_CONFIG.pawn;
  const next = getNextRank(tier);

  const currentMin = config.minXp;
  const nextMin = next ? next.minXp : config.minXp;
  const isMax = !next;

  const progress = isMax
    ? 100
    : Math.min(100, ((xp - currentMin) / (nextMin - currentMin)) * 100);

  return (
    <div className="rounded-2xl bg-surface-1 border border-glass-border p-4">
      <div className="flex items-center justify-between mb-2">
        <RankBadge tier={tier} />
        <span className="text-xs text-muted-foreground tabular-nums">
          {isMax ? `${xp} XP (MAX)` : `${xp} / ${nextMin} XP`}
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isMax ? "bg-xp" : "bg-primary"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {next && (
        <p className="text-xs text-muted-foreground mt-1.5">
          {nextMin - xp} XP to {RANK_CONFIG[next.tier].label}
        </p>
      )}
    </div>
  );
}
