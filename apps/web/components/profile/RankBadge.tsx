"use client";

import type { ComponentType } from "react";
import {
  Crown,
  Flame,
  Gem,
  ShieldHalf,
  Sparkles,
  Sprout,
  Swords,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type RankTier =
  | "starter"
  | "recruit"
  | "sergeant"
  | "veteran"
  | "champion"
  | "icon"
  | "legend"
  | "immortal";

interface RankConfig {
  label: string;
  icon: ComponentType<{ className?: string }>;
  minXp: number;
  color: string;
  bgColor: string;
  glow?: boolean;
}

export const RANK_CONFIG: Record<RankTier, RankConfig> = {
  starter: {
    label: "Starter",
    icon: Sprout,
    minXp: 0,
    color: "text-muted-foreground",
    bgColor: "bg-muted/15",
  },
  recruit: {
    label: "Recruit",
    icon: Swords,
    minXp: 150,
    color: "text-blue-400",
    bgColor: "bg-blue-400/15",
  },
  sergeant: {
    label: "Sergeant",
    icon: ShieldHalf,
    minXp: 500,
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/15",
  },
  veteran: {
    label: "Veteran",
    icon: Flame,
    minXp: 1200,
    color: "text-orange-400",
    bgColor: "bg-orange-400/15",
  },
  champion: {
    label: "Champion",
    icon: Trophy,
    minXp: 2500,
    color: "text-coin",
    bgColor: "bg-coin/15",
  },
  icon: {
    label: "Icon",
    icon: Gem,
    minXp: 4500,
    color: "text-purple-400",
    bgColor: "bg-purple-400/15",
  },
  legend: {
    label: "Legend",
    icon: Sparkles,
    minXp: 7000,
    color: "text-streak",
    bgColor: "bg-streak/15",
  },
  immortal: {
    label: "Immortal",
    icon: Crown,
    minXp: 10000,
    color: "text-xp",
    bgColor: "bg-xp/15",
    glow: true,
  },
};

const RANK_ORDER: RankTier[] = [
  "starter",
  "recruit",
  "sergeant",
  "veteran",
  "champion",
  "icon",
  "legend",
  "immortal",
];

export function getRankTierFromXp(xp: number): RankTier {
  let tier: RankTier = "starter";
  for (const rank of RANK_ORDER) {
    if (xp >= RANK_CONFIG[rank].minXp) {
      tier = rank;
    }
  }
  return tier;
}

export interface RankBadgeProps {
  tier: RankTier;
  className?: string;
}

export function RankBadge({ tier, className }: RankBadgeProps) {
  const config = RANK_CONFIG[tier];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        config.bgColor,
        config.color,
        config.glow && "shadow-glow",
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {config.label}
    </span>
  );
}

export interface XpProgressBarProps {
  xp: number;
  className?: string;
}

export function XpProgressBar({ xp, className }: XpProgressBarProps) {
  const tier = getRankTierFromXp(xp);
  const tierIndex = RANK_ORDER.indexOf(tier);
  const nextTier = RANK_ORDER[tierIndex + 1];
  const currentMin = RANK_CONFIG[tier].minXp;
  const nextMin = nextTier ? RANK_CONFIG[nextTier].minXp : currentMin;
  const progress = nextTier
    ? Math.min(100, Math.max(0, ((xp - currentMin) / (nextMin - currentMin)) * 100))
    : 100;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{RANK_CONFIG[tier].label}</span>
        {nextTier ? (
          <span className="text-muted-foreground">
            {xp.toLocaleString()} / {nextMin.toLocaleString()} XP
          </span>
        ) : (
          <span className="text-muted-foreground">{xp.toLocaleString()} XP</span>
        )}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
