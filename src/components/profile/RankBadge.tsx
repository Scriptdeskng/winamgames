import { Sprout, Swords, ShieldHalf, Flame, Trophy, Gem, Sparkles, Crown } from "lucide-react";
import type { ComponentType } from "react";

export type RankTier = "starter" | "recruit" | "sergeant" | "veteran" | "champion" | "icon" | "legend" | "immortal";

interface RankConfig {
  label: string;
  icon: ComponentType<{ className?: string }>;
  minXp: number;
  color: string;
  bgColor: string;
  glow?: boolean;
}

export const RANK_CONFIG: Record<RankTier, RankConfig> = {
  starter:  { label: "Starter",  icon: Sprout,     minXp: 0,     color: "text-muted-foreground", bgColor: "bg-muted/15" },
  recruit:  { label: "Recruit",  icon: Swords,     minXp: 150,   color: "text-blue-400",         bgColor: "bg-blue-400/15" },
  sergeant: { label: "Sergeant", icon: ShieldHalf, minXp: 500,   color: "text-cyan-400",         bgColor: "bg-cyan-400/15" },
  veteran:  { label: "Veteran",  icon: Flame,      minXp: 1200,  color: "text-orange-400",       bgColor: "bg-orange-400/15" },
  champion: { label: "Champion", icon: Trophy,     minXp: 2500,  color: "text-coin",             bgColor: "bg-coin/15" },
  icon:     { label: "Icon",     icon: Gem,        minXp: 4500,  color: "text-purple-400",       bgColor: "bg-purple-400/15" },
  legend:   { label: "Legend",   icon: Sparkles,   minXp: 7000,  color: "text-streak",           bgColor: "bg-streak/15" },
  immortal: { label: "Immortal", icon: Crown,      minXp: 10000, color: "text-xp",               bgColor: "bg-xp/15", glow: true },
};

const RANK_ORDER: RankTier[] = ["starter", "recruit", "sergeant", "veteran", "champion", "icon", "legend", "immortal"];

function getNextRank(tier: RankTier): { tier: RankTier; minXp: number } | null {
  const idx = RANK_ORDER.indexOf(tier);
  if (idx >= RANK_ORDER.length - 1) return null;
  const next = RANK_ORDER[idx + 1];
  return { tier: next, minXp: RANK_CONFIG[next].minXp };
}

export function RankBadge({ tier }: { tier: RankTier }) {
  const config = RANK_CONFIG[tier] ?? RANK_CONFIG.starter;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-8 w-8 rounded-lg ${config.bgColor} flex items-center justify-center ${
          config.glow ? "shadow-glow ring-1 ring-xp/30" : ""
        }`}
      >
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>
      <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
    </div>
  );
}

export function XpProgressBar({ xp, tier }: { xp: number; tier: RankTier }) {
  const config = RANK_CONFIG[tier] ?? RANK_CONFIG.starter;
  const next = getNextRank(tier);

  const currentMin = config.minXp;
  const nextMin = next ? next.minXp : config.minXp;
  const isMax = !next;

  const progress = isMax
    ? 100
    : Math.min(100, ((xp - currentMin) / (nextMin - currentMin)) * 100);

  return (
    <div className="rounded-2xl bg-surface-1 border border-border p-4">
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
