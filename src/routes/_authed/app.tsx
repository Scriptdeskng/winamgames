import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import {
  ChevronRight, Swords, BookOpen, Check, Flame,
  Sparkles, Shuffle, Ticket, Calendar, Trophy, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getPlayerData, getActiveMissions, getActiveBanners, getMyWinnerStatus } from "@/utils/mission.functions";
import { getSession } from "@/lib/session";
import { RANK_CONFIG, type RankTier } from "@/components/profile/RankBadge";
import { BannerStack, type Banner } from "@/components/home/BannerStack";
import { useAllowScroll } from "@/hooks/useAllowScroll";
import { getDrawState, getNextEntriesLockWAT, type DrawState } from "@/lib/draw-state";
import React from "react";

export const Route = createFileRoute("/_authed/app")({
  component: HomePage,
});

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
      <span className="font-mono text-4xl font-bold tabular-nums leading-none text-foreground light:text-accent-foreground">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] text-muted-foreground light:text-accent-foreground/80 lowercase mt-0.5 leading-none">
        {label}
      </span>
    </div>
  );
}

function CountdownColon() {
  return (
    <span className="font-mono text-4xl font-bold leading-none text-foreground light:text-accent-foreground pb-[14px]">
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
    winnerStatus: any;
  } | null>(null);

  React.useEffect(() => {
    if (!session) return;
    Promise.all([
      getPlayerData({ data: { playerId: session.playerId } }),
      getActiveMissions({ data: { playerId: session.playerId } }),
      getActiveBanners(),
      getMyWinnerStatus({ data: { playerId: session.playerId } }),
    ]).then(([playerResult, missionsResult, bannersResult, winnerStatus]) => {
      setData({ playerResult, missionsResult, bannersResult, winnerStatus });
    });
  }, []);

  const player = data?.playerResult?.success ? data.playerResult.player : null;
  const weekTotal = data?.playerResult?.success ? data.playerResult.weekTotal : 0;
  const weekCap = data?.playerResult?.success ? data.playerResult.weekCap : 50;
  const drawWeek = data?.playerResult?.success ? data.playerResult.drawWeek : null;
  const missions = data?.missionsResult?.success ? data.missionsResult.missions : [];
  const banners: Banner[] = data?.bannersResult?.success ? data.bannersResult.banners : [];
  const winnerStatus = data?.winnerStatus;
  const streak = player?.currentStreak ?? 0;
  const tier: RankTier = player?.rankTier ?? "starter";

  if (!data) {
    return (
      <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background">
      <TopBar />
      <div className="px-4 pb-6 space-y-5">
        <DrawHeroCard
          drawExecutesAt={drawWeek?.drawExecutesAt}
          weekTotal={weekTotal}
          weekCap={weekCap}
        />

        <WinnerBanner winnerStatus={winnerStatus} />

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

      </div>
    </div>
  );
}


function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function WinnerBanner({ winnerStatus }: { winnerStatus: any }) {
  const [dismissed, setDismissed] = React.useState(false);
  const kyc = winnerStatus?.kyc;
  const claimComplete = !!(kyc?.identitySubmitted && kyc?.bankSubmitted && !kyc?.paymentProcessed);

  React.useEffect(() => {
    if (!winnerStatus?.won) {
      setDismissed(false);
      return;
    }
    if (winnerStatus.prizeType === "airtime") {
      const key = `winner-airtime-dismissed-${winnerStatus.winnerId}`;
      setDismissed(localStorage.getItem(key) === "1");
      return;
    }
    if (claimComplete) {
      const key = `winner-claim-dismissed-${winnerStatus.winnerId}`;
      setDismissed(localStorage.getItem(key) === "1");
      return;
    }
    setDismissed(false);
  }, [winnerStatus?.won, winnerStatus?.prizeType, winnerStatus?.winnerId, claimComplete]);

  if (!winnerStatus?.won) return null;
  if (kyc?.paymentProcessed) return null;

  if (winnerStatus.prizeType === "airtime") {
    if (dismissed) return null;
    const key = `winner-airtime-dismissed-${winnerStatus.winnerId}`;
    return (
      <div className="relative overflow-hidden rounded-2xl border border-success/30 bg-success/10 p-4 shadow-card">
        <button
          onClick={() => {
            localStorage.setItem(key, "1");
            setDismissed(true);
          }}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          aria-label="Dismiss airtime winner notice"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="pr-8">
          <p className="text-base font-bold text-success">🎉 You won {formatNaira(winnerStatus.prizeAmount)} airtime!</p>
          <p className="mt-1 text-sm text-muted-foreground">It will be sent to your number within 24 hours.</p>
        </div>
      </div>
    );
  }

  if (claimComplete && dismissed) return null;

  let title = `🏆 You won ${formatNaira(winnerStatus.prizeAmount)}!`;
  let body = "Complete verification to claim your prize.";
  let action: { label: string; step?: 1 | 2 } | null = { label: "Claim my prize" };

  if (kyc?.identitySubmitted && !kyc?.bankSubmitted) {
    title = "🏆 One more step!";
    body = "Add your bank details to complete your claim.";
    action = { label: "Add bank details", step: 2 };
  } else if (kyc?.identitySubmitted && kyc?.bankSubmitted && !kyc?.paymentProcessed) {
    title = "🏆 Prize claim complete.";
    body = "Your payment will be processed within 3 business days.";
    action = null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/20 via-surface-1 to-surface-1 p-4 shadow-card">
      {claimComplete && (
        <button
          onClick={() => {
            localStorage.setItem(`winner-claim-dismissed-${winnerStatus.winnerId}`, "1");
            setDismissed(true);
          }}
          className="absolute right-3 top-3 z-10 rounded-full p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          aria-label="Dismiss completed prize claim notice"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gold/20 blur-2xl" />
      <div className="relative flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/20">
          <Trophy className="h-5 w-5 text-gold" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          {action && (
            <Link
              to="/kyc"
              search={{ winnerId: winnerStatus.winnerId, ...(action.step ? { step: action.step } : {}) }}
              className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-gold px-4 text-sm font-bold text-background"
            >
              {action.label} <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
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
  // 60s boundary check — recomputes draw state, triggers re-render across phase changes.
  const [drawState, setDrawState] = React.useState<DrawState>(() => getDrawState(new Date()));
  React.useEffect(() => {
    const id = setInterval(() => {
      setDrawState(getDrawState(new Date()));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // Countdown target = next Sunday 19:00 WAT (entries lock).
  // Recomputed whenever drawState transitions (e.g. new_week → open).
  const targetDate = React.useMemo(() => {
    if (drawExecutesAt) {
      const d = new Date(drawExecutesAt);
      // drawExecutesAt is the 20:00 WAT execution time; lock is 1h earlier.
      const lock = new Date(d.getTime() - 60 * 60 * 1000);
      if (lock.getTime() > Date.now()) return lock;
    }
    return getNextEntriesLockWAT();
  }, [drawExecutesAt, drawState]);

  // 1s ticker for countdown digits.
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = targetDate.getTime() - now;
  const { days, hours, minutes, seconds } = getCountdownParts(remaining);
  const pct = Math.min(100, Math.round((weekTotal / weekCap) * 100));

  const cardChrome =
    "rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-5 shadow-card";

  // ─── State: drawn ── winners selected, awaiting new week
  if (drawState === "drawn") {
    return (
      <div className={cardChrome}>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Weekly Draw
        </p>
        <h3 className="text-2xl font-bold text-foreground">Draw complete</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This week's winners have been selected
        </p>
        <Link
          to="/winners"
          className="mt-4 inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-glow"
        >
          See winners
          <ChevronRight className="h-4 w-4" />
        </Link>
        <p className="text-[11px] text-muted-foreground/80 mt-3">
          New draw week opens in a moment
        </p>
      </div>
    );
  }

  // ─── State: locked ── tickets frozen, draw imminent
  if (drawState === "locked") {
    return (
      <div className={cardChrome}>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Weekly Draw
        </p>
        <h3 className="text-2xl font-bold text-foreground">Draw closing soon</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Tickets locked — draw executes at 20:00 WAT
        </p>
        <p className="text-sm text-muted-foreground mt-4 tabular-nums">
          <span className="font-bold">{weekTotal}</span>
          <span> / {weekCap} tickets this week</span>
        </p>
        <div className="mt-2 h-2 rounded-full bg-background/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-muted-foreground/40 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-end">
          <Link to="/entries" className="text-xs text-primary flex items-center gap-1 hover:underline">
            View my tickets <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  // ─── State: open / new_week ── default countdown UI
  return (
    <div className={cardChrome}>
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
        <span className="text-muted-foreground"> / {weekCap} tickets this week</span>
      </p>
      <div className="mt-2 h-2 rounded-full bg-background/40 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">Draw every Sunday at 20:00 WAT</p>
        <Link to="/entries" className="text-xs text-primary flex items-center gap-1 hover:underline">
          View my tickets <ChevronRight className="h-3 w-3" />
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

function pluralizeTickets(n: number) {
  return `${n} ${n === 1 ? "ticket" : "tickets"}`;
}

function MissionsSection({
  playerId,
  initialMissions,
}: {
  playerId: string;
  initialMissions: Mission[];
}) {
  const [missions, setMissions] = React.useState<Mission[]>(initialMissions);

  // Keep state in sync if parent reloads. Completed missions stay visible in
  // today's slate until the next WAT day instead of being instantly replaced.
  React.useEffect(() => {
    setMissions(initialMissions);
  }, [initialMissions]);

  const visibleMissions = missions.slice(0, 3);
  const completedCount = visibleMissions.filter((m) => m.status === "completed").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Missions
          {completedCount > 0 && (
            <span className="ml-2 text-muted-foreground/70 normal-case font-normal tracking-normal">
              · {completedCount} of {visibleMissions.length} done
            </span>
          )}
        </h2>
      </div>

      {visibleMissions.length === 0 ? (
        <div className="rounded-2xl bg-surface-1 border border-border p-4 flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">New missions coming soon</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleMissions.map((m) => (
            <MissionRow key={m.id} mission={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MissionRow({ mission }: { mission: Mission }) {
  const meta = MISSION_META[mission.conditionType] ?? MISSION_META.puzzles_solved;
  const Icon = meta.icon;
  const isCompleted = mission.status === "completed";
  const progress = isCompleted
    ? mission.conditionValue
    : Math.min(mission.progressCurrent, mission.conditionValue);
  const progressPct = Math.min(100, Math.round((progress / mission.conditionValue) * 100));

  return (
    <div
      className={`rounded-xl border p-3 flex items-center gap-3 transition-colors ${
        isCompleted
          ? "bg-surface-1/45 border-success/25 opacity-75"
          : "bg-surface-1 border-border"
      }`}
    >
      <div
        className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
          isCompleted ? "bg-success/10 text-success" : meta.tint
        }`}
      >
        {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={`text-sm font-medium line-clamp-1 ${
              isCompleted ? "text-muted-foreground line-through decoration-success/70" : "text-foreground"
            }`}
          >
            {mission.title}
          </p>
          {isCompleted && <Check className="h-3.5 w-3.5 text-success shrink-0" />}
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted/60">
          <div
            className={`h-full rounded-full ${isCompleted ? "bg-success" : "bg-primary"}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {isCompleted ? (
          <p className="text-xs text-success flex items-center gap-1 mt-1">
            <Check className="h-3 w-3" /> Reward claimed
          </p>
        ) : (
          <p className="text-xs text-muted-foreground tabular-nums mt-1">
            {progress}/{mission.conditionValue}
          </p>
        )}
      </div>
      <div
        className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
          isCompleted ? "bg-muted/50 text-muted-foreground" : "bg-coin/10 text-coin"
        }`}
      >
        <Ticket className="h-3 w-3" />
        {pluralizeTickets(mission.rewardAmount)}
      </div>
    </div>
  );
}

