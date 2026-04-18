import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import {
  Lightbulb, ChevronRight, Swords, BookOpen, Check, Flame,
  Sparkles, Shuffle, Ticket, Calendar,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getPlayerData, getActiveMissions, getActiveBanners } from "@/utils/mission.functions";
import { getSession } from "@/lib/session";
import { RANK_CONFIG, type RankTier } from "@/components/profile/RankBadge";
import { BannerStack, type Banner } from "@/components/home/BannerStack";
import { useAllowScroll } from "@/hooks/useAllowScroll";
import React from "react";

export const Route = createFileRoute("/_authed/")({
  component: HomePage,
});

const RANK_ORDER: RankTier[] = [
  "starter", "recruit", "sergeant", "veteran", "champion", "icon", "legend", "immortal",
];

// Compute next Sunday 20:00 WAT (UTC+1) → 19:00 UTC
function getNextSundayWAT(): Date {
  const now = new Date();
  const target = new Date(now);
  const dayUTC = now.getUTCDay();
  // Days until next Sunday (0). If today is Sunday and before 19:00 UTC, target today.
  let daysUntil = (7 - dayUTC) % 7;
  target.setUTCHours(19, 0, 0, 0);
  if (daysUntil === 0 && now.getTime() >= target.getTime()) {
    daysUntil = 7;
  }
  target.setUTCDate(now.getUTCDate() + daysUntil);
  target.setUTCHours(19, 0, 0, 0);
  return target;
}

function getCountdownParts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-4xl font-bold tabular-nums leading-none text-foreground">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] text-muted-foreground lowercase mt-0.5 leading-none">
        {label}
      </span>
    </div>
  );
}

function CountdownColon() {
  return (
    <span className="font-mono text-4xl font-bold leading-none text-foreground pb-[14px]">
      :
    </span>
  );
}

function HomePage() {
  useAllowScroll();
  const session = getSession();
  const [data, setData] = React.useState<{
    playerResult: any;
    missionsResult: any;
    bannersResult: any;
  } | null>(null);

  React.useEffect(() => {
    if (!session) return;
    Promise.all([
      getPlayerData({ data: { playerId: session.playerId } }),
      getActiveMissions({ data: { playerId: session.playerId } }),
      getActiveBanners(),
    ]).then(([playerResult, missionsResult, bannersResult]) => {
      setData({ playerResult, missionsResult, bannersResult });
    });
  }, []);

  const player = data?.playerResult?.success ? data.playerResult.player : null;
  const weekTotal = data?.playerResult?.success ? data.playerResult.weekTotal : 0;
  const weekCap = data?.playerResult?.success ? data.playerResult.weekCap : 50;
  const drawWeek = data?.playerResult?.success ? data.playerResult.drawWeek : null;
  const totalSessions = data?.playerResult?.success ? data.playerResult.totalSessions : 0;
  const bestSession = data?.playerResult?.success ? data.playerResult.bestSession : 0;
  const missions = data?.missionsResult?.success ? data.missionsResult.missions : [];
  const banners: Banner[] = data?.bannersResult?.success ? data.bannersResult.banners : [];

  if (!data) {
    return (
      <div className="mx-auto min-h-screen max-w-[430px] bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const tier = (player?.rankTier as RankTier) ?? "starter";
  const xpTotal = player?.xpTotal ?? 0;
  const streak = player?.currentStreak ?? 0;

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background">
      <TopBar />
      <div className="px-4 pb-6 space-y-5">
        <DrawHeroCard
          drawExecutesAt={drawWeek?.drawExecutesAt}
          weekTotal={weekTotal}
          weekCap={weekCap}
        />

        <StreakRankStrip streak={streak} tier={tier} />

        <BannerStack banners={banners} />

        <MissionsSection playerId={session?.playerId ?? ""} initialMissions={missions} />

        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Play Now</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/checkmate"
              className="group rounded-2xl bg-surface-1 border border-border p-4 transition-all hover:border-primary/30 hover:shadow-glow"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center mb-3">
                <Swords className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-sm font-bold">CheckMate</h3>
              <p className="text-xs text-muted-foreground mt-1">Chess puzzles</p>
            </Link>

            <Link
              to="/wisdomdrop"
              className="group rounded-2xl bg-surface-1 border border-border p-4 transition-all hover:border-primary/30 hover:shadow-glow"
            >
              <div className="h-12 w-12 rounded-xl bg-xp/15 flex items-center justify-center mb-3">
                <BookOpen className="h-6 w-6 text-xp" />
              </div>
              <h3 className="text-sm font-bold">WisdomDrop</h3>
              <p className="text-xs text-muted-foreground mt-1">African proverbs</p>
            </Link>
          </div>
        </div>

        <DynamicTip
          totalSessions={totalSessions}
          weekTotal={weekTotal}
          weekCap={weekCap}
          tier={tier}
          xpTotal={xpTotal}
          bestSession={bestSession}
        />
      </div>
    </div>
  );
}

// ── DrawHeroCard ──────────────────────────────────────────────────────
function DrawHeroCard({
  drawExecutesAt,
  weekTotal,
  weekCap,
}: {
  drawExecutesAt: string | undefined;
  weekTotal: number;
  weekCap: number;
}) {
  const targetDate = React.useMemo(() => {
    if (drawExecutesAt) {
      const d = new Date(drawExecutesAt);
      if (d.getTime() > Date.now()) return d;
    }
    return getNextSundayWAT();
  }, [drawExecutesAt]);

  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = targetDate.getTime() - now;
  const { days, hours, minutes, seconds } = getCountdownParts(remaining);
  const pct = Math.min(100, Math.round((weekTotal / weekCap) * 100));

  return (
    <div className="rounded-2xl bg-surface-1 border border-border p-5 shadow-card">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Weekly Draw
      </p>
      <div className="flex items-end gap-1.5">
        {days > 0 && (
          <>
            <CountdownUnit value={days} label="day" />
            <CountdownColon />
          </>
        )}
        <CountdownUnit value={hours} label="hr" />
        <CountdownColon />
        <CountdownUnit value={minutes} label="min" />
        <CountdownColon />
        <CountdownUnit value={seconds} label="sec" />
      </div>
      <p className="text-sm text-foreground mt-3 tabular-nums">
        <span className="font-bold text-primary">{weekTotal}</span>
        <span className="text-muted-foreground"> / {weekCap} entries this week</span>
      </p>
      <div className="mt-2 h-2 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">Draw every Sunday at 20:00 WAT</p>
        <Link to="/entries" className="text-xs text-primary flex items-center gap-1 hover:underline">
          View my entries <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

// ── StreakRankStrip ───────────────────────────────────────────────────
function StreakRankStrip({ streak, tier }: { streak: number; tier: RankTier }) {
  const config = RANK_CONFIG[tier] ?? RANK_CONFIG.starter;
  const RankIcon = config.icon;

  return (
    <div className="rounded-xl bg-surface-1/60 px-4 py-2.5 flex items-center">
      <div className="flex items-center gap-2 flex-1">
        <Flame className="h-4 w-4 text-streak" />
        <span className="text-sm font-semibold tabular-nums">{streak}</span>
        <span className="text-xs text-muted-foreground">day streak</span>
      </div>
      <div className="h-5 w-px bg-border mx-3" />
      <div className="flex items-center gap-2">
        <RankIcon className={`h-4 w-4 ${config.color}`} />
        <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
      </div>
    </div>
  );
}

// ── MissionsSection ───────────────────────────────────────────────────
type Mission = {
  id: string;
  title: string;
  conditionType: string;
  conditionValue: number;
  progressCurrent: number;
  rewardAmount: number;
  status: string;
};

const MISSION_META: Record<string, { icon: LucideIcon; tint: string }> = {
  puzzles_solved: { icon: Swords,   tint: "bg-primary/15 text-primary" },
  no_hints:       { icon: Sparkles, tint: "bg-xp/15 text-xp" },
  streak_day:     { icon: Flame,    tint: "bg-streak/15 text-streak" },
  game_type_mix:  { icon: Shuffle,  tint: "bg-primary/15 text-primary" },
};

function pluralizeEntries(n: number) {
  return `${n} ${n === 1 ? "entry" : "entries"}`;
}

function MissionsSection({
  playerId,
  initialMissions,
}: {
  playerId: string;
  initialMissions: Mission[];
}) {
  const [missions, setMissions] = React.useState<Mission[]>(initialMissions);
  const [exitingIds, setExitingIds] = React.useState<Set<string>>(new Set());
  const replacedRef = React.useRef<Set<string>>(new Set());

  // Keep state in sync if parent reloads (e.g. on first mount completion)
  React.useEffect(() => {
    setMissions(initialMissions);
  }, [initialMissions]);

  // After 3s, fade out completed missions and refetch for replacements.
  React.useEffect(() => {
    if (!playerId) return;
    const completedToReplace = missions.filter(
      (m) => m.status === "completed" && !replacedRef.current.has(m.id)
    );
    if (completedToReplace.length === 0) return;

    completedToReplace.forEach((m) => replacedRef.current.add(m.id));

    const holdMs = 3000;
    const exitMs = 350;
    const t1 = setTimeout(() => {
      setExitingIds((prev) => {
        const next = new Set(prev);
        completedToReplace.forEach((m) => next.add(m.id));
        return next;
      });
    }, holdMs);

    const t2 = setTimeout(async () => {
      const res = await getActiveMissions({ data: { playerId } });
      if (res.success) {
        setMissions(res.missions);
        setExitingIds(new Set());
      }
    }, holdMs + exitMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [missions, playerId]);

  const completedCount = missions.filter((m) => m.status === "completed").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Missions
          {completedCount > 0 && (
            <span className="ml-2 text-muted-foreground/70 normal-case font-normal tracking-normal">
              · {completedCount} of {missions.length} done
            </span>
          )}
        </h2>
      </div>

      {missions.length === 0 ? (
        <div className="rounded-2xl bg-surface-1 border border-border p-4 flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">New missions coming soon</p>
        </div>
      ) : (
        <div className="space-y-2">
          {missions.map((m) => (
            <MissionRow key={m.id} mission={m} exiting={exitingIds.has(m.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function MissionRow({ mission, exiting }: { mission: Mission; exiting: boolean }) {
  const meta = MISSION_META[mission.conditionType] ?? MISSION_META.puzzles_solved;
  const Icon = meta.icon;
  const isCompleted = mission.status === "completed";
  const progress = Math.min(mission.progressCurrent, mission.conditionValue);

  return (
    <div
      className={`rounded-xl border p-3 flex items-center gap-3 transition-all duration-300 ${
        isCompleted
          ? "bg-success/5 border-success/30"
          : "bg-surface-1 border-border"
      } ${exiting ? "opacity-0 -translate-y-1" : "opacity-100 translate-y-0"}`}
    >
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${meta.tint}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-1">{mission.title}</p>
        {isCompleted ? (
          <p className="text-xs text-success flex items-center gap-1 mt-0.5">
            <Check className="h-3 w-3" /> Reward claimed
          </p>
        ) : (
          <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
            {progress}/{mission.conditionValue}
          </p>
        )}
      </div>
      <div className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-semibold">
        <Ticket className="h-3 w-3" />
        {pluralizeEntries(mission.rewardAmount)}
      </div>
    </div>
  );
}

// ── DynamicTip ────────────────────────────────────────────────────────
const ONBOARDING_TIPS = [
  "Streaks of 3+ days earn a bonus entry each game",
  "Solving puzzles without hints gives 2x coins",
  "Complete all 3 daily missions for extra entries",
  "Your rank tier upgrades as you earn more XP",
  "Each correct answer earns entries into the weekly draw",
  "Play both CheckMate and WisdomDrop to complete the game mix mission",
];

function DynamicTip({
  totalSessions,
  weekTotal,
  weekCap,
  tier,
  xpTotal,
  bestSession,
}: {
  totalSessions: number;
  weekTotal: number;
  weekCap: number;
  tier: RankTier;
  xpTotal: number;
  bestSession: number;
}) {
  let label = "Did you know?";
  let body: string;

  if (totalSessions === 0) {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    body = ONBOARDING_TIPS[dayOfYear % ONBOARDING_TIPS.length];
  } else if (weekTotal < weekCap) {
    label = "This week";
    body = `${weekCap - weekTotal} more entries to hit your weekly cap`;
  } else {
    const idx = RANK_ORDER.indexOf(tier);
    const nextTier = idx >= 0 && idx < RANK_ORDER.length - 1 ? RANK_ORDER[idx + 1] : null;
    if (nextTier) {
      const nextMin = RANK_CONFIG[nextTier].minXp;
      label = "Next rank";
      body = `${Math.max(0, nextMin - xpTotal)} XP to ${RANK_CONFIG[nextTier].label}`;
    } else {
      label = "Personal best";
      body = `Your best session: ${bestSession} puzzles`;
    }
  }

  return (
    <div className="rounded-2xl bg-surface-1 border border-border p-4 flex items-start gap-3">
      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Lightbulb className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="text-sm text-foreground">{body}</p>
      </div>
    </div>
  );
}
