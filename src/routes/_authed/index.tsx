import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Lightbulb, ChevronRight, Swords, BookOpen, Check, Flame } from "lucide-react";
import { getPlayerData, getDailyMissions } from "@/utils/mission.functions";
import { getSession } from "@/lib/session";
import { RANK_CONFIG, type RankTier } from "@/components/profile/RankBadge";
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

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const hms = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return days > 0 ? `${days}d ${hms}` : hms;
}

function HomePage() {
  const session = getSession();
  const [data, setData] = React.useState<{
    playerResult: any;
    missionsResult: any;
  } | null>(null);

  React.useEffect(() => {
    if (!session) return;
    Promise.all([
      getPlayerData({ data: { playerId: session.playerId } }),
      getDailyMissions({ data: { playerId: session.playerId } }),
    ]).then(([playerResult, missionsResult]) => {
      setData({ playerResult, missionsResult });
    });
  }, []);

  const player = data?.playerResult?.success ? data.playerResult.player : null;
  const weekTotal = data?.playerResult?.success ? data.playerResult.weekTotal : 0;
  const weekCap = data?.playerResult?.success ? data.playerResult.weekCap : 50;
  const drawWeek = data?.playerResult?.success ? data.playerResult.drawWeek : null;
  const totalSessions = data?.playerResult?.success ? data.playerResult.totalSessions : 0;
  const bestSession = data?.playerResult?.success ? data.playerResult.bestSession : 0;
  const missions = data?.missionsResult?.success ? data.missionsResult.missions : [];

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

        <DailyMissionsSection missions={missions} />

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
  const hms = formatHMS(remaining);
  const pct = Math.min(100, Math.round((weekTotal / weekCap) * 100));

  return (
    <div className="rounded-2xl bg-surface-1 border border-border p-5 shadow-card">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Weekly Draw
      </p>
      <p className="font-mono text-5xl font-bold tabular-nums text-foreground leading-none">
        {hms}
      </p>
      <p className="text-sm text-foreground mt-4 tabular-nums">
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
          View all entries <ChevronRight className="h-3 w-3" />
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

// ── DailyMissionsSection ──────────────────────────────────────────────
function DailyMissionsSection({ missions }: { missions: any[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Daily Missions
      </h2>
      {missions.length === 0 ? (
        <div className="rounded-2xl bg-surface-1 border border-border p-4 text-center">
          <p className="text-sm font-semibold">Missions reset at midnight</p>
          <p className="text-xs text-muted-foreground mt-1">
            Play now to build your streak and earn entries
          </p>
          <Link
            to="/checkmate"
            className="inline-flex items-center justify-center mt-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 hover:shadow-glow transition-all"
          >
            Play now
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {missions.map((mission: { id: string; title: string; rewardAmount: number; rewardType: string; status: string; progress: string }) => (
            <div key={mission.id} className="rounded-xl bg-surface-1 border border-border p-3 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">{mission.title}</p>
                <p className="text-xs text-muted-foreground">
                  {mission.rewardAmount} {mission.rewardType}
                </p>
              </div>
              {mission.status === "completed" ? (
                <div className="flex items-center gap-1 text-success">
                  <Check className="h-4 w-4" />
                  <span className="text-xs font-medium">Done</span>
                </div>
              ) : (
                <span className="text-xs font-medium tabular-nums text-primary">{mission.progress}</span>
              )}
            </div>
          ))}
        </div>
      )}
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
