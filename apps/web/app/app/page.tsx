"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  Coins,
  Check,
  Calendar,
  Flame,
  Crown,
  Gem,
  Shuffle,
  ShieldHalf,
  Sparkles,
  Sprout,
  Swords,
  Ticket,
  Trophy,
  X,
  type LucideIcon,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { getActiveBanners, getActiveMissions, getDashboard, getSubscriptionStatus, getWinnerStatus } from "@/lib/api";
import { PlayerTopBar } from "@/components/player-top-bar";
import type { WinamSession } from "@/lib/session";
import { useReducer } from "react";

type RankTier = "starter" | "recruit" | "sergeant" | "veteran" | "champion" | "icon" | "legend" | "immortal";

const APP_RANK_CONFIG: Record<RankTier, { label: string; icon: LucideIcon; color: string }> = {
  starter: { label: "Starter", icon: Sprout, color: "text-muted-foreground" },
  recruit: { label: "Recruit", icon: Swords, color: "text-blue-400" },
  sergeant: { label: "Sergeant", icon: ShieldHalf, color: "text-cyan-400" },
  veteran: { label: "Veteran", icon: Flame, color: "text-orange-400" },
  champion: { label: "Champion", icon: Trophy, color: "text-coin" },
  icon: { label: "Icon", icon: Gem, color: "text-purple-400" },
  legend: { label: "Legend", icon: Sparkles, color: "text-streak" },
  immortal: { label: "Immortal", icon: Crown, color: "text-xp" },
};

type DashboardState = {
  player?: any;
  weekTotal?: number;
  weekCap?: number;
  drawWeek?: any;
  publishedWeekId?: string | null;
};

export default function AppPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<WinamSession | null>(null);
  const [data, setData] = useState<{
    dashboard: DashboardState | null;
    missions: any[];
    banners: any[];
    winnerStatus: any;
  } | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    setSession(getSession());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && !session) {
      router.replace("/");
    }
  }, [ready, session, router]);

  useEffect(() => {
    if (!session) return;
    getSubscriptionStatus(session.playerId)
      .then((subscriptionStatus) => {
        const subscriptionData = subscriptionStatus?.data ?? subscriptionStatus;
        setSubscription(subscriptionData);
        if (!subscriptionData?.has_active_subscription) {
          setData({
            dashboard: null,
            missions: [],
            banners: [],
            winnerStatus: null,
          });
          return null;
        }
        return Promise.all([
          getDashboard(session.playerId),
          getActiveMissions(session.playerId),
          getActiveBanners(),
          getWinnerStatus(session.playerId),
        ]).then(([dashboard, missions, banners, winnerStatus]) => {
          setData({
            dashboard,
            missions: missions.missions ?? [],
            banners: banners.banners ?? [],
            winnerStatus,
          });
        });
      })
      .catch(() => {
        setData({
          dashboard: null,
          missions: [],
          banners: [],
          winnerStatus: null,
        });
      });
  }, [session]);

  if (!ready) {
    return (
      <main className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-[100dvh] bg-background text-foreground">
        <div className="mx-auto min-h-[100dvh] max-w-[430px] px-4 py-6 flex flex-col justify-center gap-4">
          <div className="rounded-2xl bg-surface-1 border border-border p-6 shadow-card text-center space-y-3 animate-pulse">
            <div className="h-12 w-12 rounded-xl bg-primary/15 mx-auto" />
            <div className="space-y-2">
              <div className="mx-auto h-4 w-40 rounded-full bg-surface-2" />
              <div className="mx-auto h-3 w-56 rounded-full bg-surface-2" />
            </div>
            <div className="mx-auto h-10 w-40 rounded-xl bg-surface-2" />
            <p className="text-xs text-muted-foreground">Loading your dashboard and subscription status.</p>
          </div>
        </div>
      </main>
    );
  }

  if (subscription && !subscription.has_active_subscription) {
    return (
      <main className="min-h-[100dvh] bg-background text-foreground">
        <div className="mx-auto min-h-[100dvh] max-w-[430px] px-4 py-6 flex flex-col justify-center gap-4">
          <div className="rounded-2xl bg-surface-1 border border-border p-6 shadow-card text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold">Subscription required</h1>
            <p className="text-sm text-muted-foreground">
              Intelli says your subscription is inactive. Tap below to choose a plan and continue.
            </p>
            <button
              onClick={() => router.push("/renew")}
              className="mt-2 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Choose a plan
            </button>
          </div>
        </div>
      </main>
    );
  }

  const player = data.dashboard?.player ?? {};
  const weekTotal = data.dashboard?.weekTotal ?? 0;
  const weekCap = data.dashboard?.weekCap ?? 50;
  const streak = player.currentStreak ?? 0;
  const tier = player.rankTier ?? "starter";
  const winnerStatus = data.winnerStatus;
  const kyc = winnerStatus?.kyc;
  const claimComplete = !!(kyc?.identitySubmitted && kyc?.bankSubmitted && !kyc?.paymentProcessed);

  return (
    <main className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background">
        <PlayerTopBar />

        <div className="px-4 pb-6 space-y-4">
          <DrawHeroCard
            drawWeekId={data.dashboard?.drawWeek?.id}
            drawWeekStatus={data.dashboard?.drawWeek?.status}
            drawExecutesAt={data.dashboard?.drawWeek?.drawExecutesAt}
            weekTotal={weekTotal}
            weekCap={weekCap}
          />

          <WinnerBanner winnerStatus={winnerStatus} claimComplete={claimComplete} />
          <StreakRankStrip streak={streak} tier={tier} />

          <BannerStack banners={data.banners} />
          <MissionsSection missions={data.missions} />

          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Play Now</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/checkmate" className="group rounded-2xl bg-surface-1 border border-border p-4 transition-all hover:border-primary/30 hover:shadow-glow">
                <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center mb-3">
                  <Swords className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-sm font-bold">CheckMate</h3>
                <p className="text-xs text-muted-foreground mt-1">Chess puzzles</p>
              </Link>

              <Link href="/wisdomdrop" className="group rounded-2xl bg-surface-1 border border-border p-4 transition-all hover:border-primary/30 hover:shadow-glow">
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
    </main>
  );
}

function WinnerBanner({ winnerStatus, claimComplete }: { winnerStatus: any; claimComplete: boolean }) {
  const [dismiss, setDismiss] = useState(false);
  const kyc = winnerStatus?.kyc;
  const claimHref =
    winnerStatus?.won && winnerStatus?.prizeType === "cash" && !claimComplete
      ? `/kyc?winnerId=${encodeURIComponent(String(winnerStatus.winnerId ?? ""))}${kyc?.identitySubmitted ? "&step=2" : "&step=1"}`
      : null;

  useEffect(() => {
    if (!winnerStatus?.won || winnerStatus?.prizeType !== "cash" || claimComplete) {
      setDismiss(localStorage.getItem(`winner-claim-dismissed-${winnerStatus.winnerId}`) === "1");
      return;
    }
    setDismiss(false);
  }, [claimComplete, winnerStatus]);

  if (!winnerStatus?.won || winnerStatus?.prizeType !== "cash" || dismiss || claimComplete) return null;

  let title = `🏆 You won ₦${winnerStatus.prizeAmount?.toLocaleString("en-NG")}!`;
  let body = "Complete verification to claim your prize.";

  if (kyc?.identitySubmitted && !kyc?.bankSubmitted) {
    title = "🏆 One more step!";
    body = "Add your bank details to complete your claim.";
  } else if (kyc?.identitySubmitted && kyc?.bankSubmitted && !kyc?.paymentProcessed) {
    title = "🏆 Prize claim complete.";
    body = "Your payment will be processed within 3 business days.";
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/20 via-surface-1 to-surface-1 p-4 shadow-card">
      {claimComplete && (
        <button
          onClick={() => {
            localStorage.setItem(`winner-claim-dismissed-${winnerStatus.winnerId}`, "1");
            setDismiss(true);
          }}
          className="absolute right-3 top-3 z-10 rounded-full p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          aria-label="Dismiss completed prize claim notice"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gold/20 blur-2xl" />
      {claimHref ? (
        <Link href={claimHref} className="relative flex gap-3 pr-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/20">
            <Trophy className="h-5 w-5 text-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-foreground">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            <p className="mt-2 text-xs font-semibold text-primary">Tap to verify and claim</p>
          </div>
        </Link>
      ) : (
        <div className="relative flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/20">
            <Trophy className="h-5 w-5 text-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-foreground">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DrawHeroCard({
  drawWeekId,
  drawWeekStatus,
  drawExecutesAt,
  weekTotal,
  weekCap,
}: {
  drawWeekId?: string;
  drawWeekStatus?: string;
  drawExecutesAt?: string;
  weekTotal: number;
  weekCap: number;
}) {
  const targetMs = drawExecutesAt ? new Date(drawExecutesAt).getTime() : getNextSundayWAT().getTime();
  const [, force] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    const id = window.setInterval(() => force(), 1000);
    return () => window.clearInterval(id);
  }, []);

  const { days, hours, minutes, seconds } = getCountdownParts(targetMs);
  const pct = Math.min(100, Math.round((weekTotal / weekCap) * 100));

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-5 shadow-card">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Weekly Draw
      </p>

      <div className="mt-3 flex items-end gap-1.5">
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

      <p className="mt-3 text-sm text-foreground tabular-nums">
        <span className="font-bold text-primary">{weekTotal}</span>
        <span className="text-muted-foreground"> / {weekCap} tickets this week</span>
      </p>

      <div className="mt-2 h-2 rounded-full bg-black/10 overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">Draw every Sunday at 20:00 WAT</p>
        <Link href="/entries" className="text-xs text-primary flex items-center gap-1 hover:underline">
          View my tickets <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
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
  return <span className="font-mono text-4xl font-bold leading-none text-foreground pb-[14px]">:</span>;
}

function getNextSundayWAT(): Date {
  const now = new Date();
  const target = new Date(now);
  const dayUTC = now.getUTCDay();
  let daysUntil = (7 - dayUTC) % 7;
  target.setUTCHours(19, 0, 0, 0);
  if (daysUntil === 0 && now.getTime() >= target.getTime()) {
    daysUntil = 7;
  }
  target.setUTCDate(now.getUTCDate() + daysUntil);
  target.setUTCHours(19, 0, 0, 0);
  return target;
}

function getCountdownParts(targetMs: number) {
  const diff = Math.max(0, targetMs - Date.now());
  const total = Math.floor(diff / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function StreakRankStrip({ streak, tier }: { streak: number; tier: RankTier }) {
  const config = APP_RANK_CONFIG[tier] ?? APP_RANK_CONFIG.starter;
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

type Banner = {
  id: string;
  title: string;
  subtitle?: string | null;
  iconUrl?: string | null;
  displayOrder?: number;
};

const BANNER_ICON_MAP: Record<string, { icon: LucideIcon; bg: string; fg: string }> = {
  trophy: { icon: Trophy, bg: "bg-coin/15", fg: "text-coin" },
  flame: { icon: Flame, bg: "bg-streak/15", fg: "text-streak" },
  book: { icon: BookOpen, bg: "bg-xp/15", fg: "text-xp" },
  swords: { icon: Swords, bg: "bg-primary/15", fg: "text-primary" },
  sparkle: { icon: Sparkles, bg: "bg-primary/15", fg: "text-primary" },
};

function pickBannerIcon(banner: Banner, index: number) {
  const title = `${banner.title} ${banner.subtitle ?? ""}`.toLowerCase();
  const iconKey =
    (banner.iconUrl ?? "").toLowerCase() ||
    (title.includes("win") || title.includes("draw") ? "trophy" : "") ||
    (title.includes("checkmate") ? "swords" : "") ||
    (title.includes("wisdom") || title.includes("proverb") ? "book" : "") ||
    (index === 0 ? "trophy" : index === 1 ? "swords" : "book");
  return BANNER_ICON_MAP[iconKey] ?? BANNER_ICON_MAP.sparkle;
}

function BannerStack({ banners }: { banners: Banner[] }) {
  const visible = banners.slice(0, 3);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (visible.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % visible.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [visible.length]);

  if (!visible.length) {
    return (
      <div className="rounded-2xl bg-surface-1 border border-border p-4 shadow-card">
        <p className="text-sm font-semibold mb-1">Announcements</p>
        <p className="text-sm text-muted-foreground">No active banners right now.</p>
      </div>
    );
  }

  return (
    <div className="relative h-[112px] pb-4 select-none">
      {visible.map((banner, index) => {
        const slot = (index - activeIndex + visible.length) % visible.length;
        const meta = pickBannerIcon(banner, index);
        const Icon = meta.icon;

        return (
          <div
            key={banner.id}
            className="absolute inset-x-0 top-0 transition-all duration-500 ease-out will-change-transform"
            style={{
              zIndex: visible.length - slot,
              transform: `translateY(${slot * 10}px) scale(${1 - slot * 0.04})`,
              opacity: slot < 3 ? 1 : 0,
            }}
          >
            <div className="relative h-[92px] overflow-hidden rounded-2xl bg-surface-1 border border-border p-4 shadow-card flex items-start gap-3">
              <div className={`h-12 w-12 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-6 w-6 ${meta.fg}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-foreground leading-tight">{banner.title}</p>
                {banner.subtitle && <p className="text-xs text-muted-foreground mt-1 leading-snug">{banner.subtitle}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type Mission = {
  id: string;
  title: string;
  conditionType: string;
  conditionValue: number;
  progressCurrent: number;
  rewardAmount: number;
  rewardType: "coins" | "entries" | string;
  status: string;
  assignedDateWat?: string | null;
  completedAt?: string | null;
};

const MISSION_META: Record<string, { icon: LucideIcon; tint: string }> = {
  puzzles_solved: { icon: Swords, tint: "bg-primary/15 text-primary" },
  no_hints: { icon: Sparkles, tint: "bg-xp/15 text-xp" },
  streak_day: { icon: Flame, tint: "bg-streak/15 text-streak" },
  game_type_mix: { icon: Shuffle, tint: "bg-primary/15 text-primary" },
};

function pluralizeRewards(amount: number, rewardType: string) {
  if (rewardType === "coins") {
    return `${amount} ${amount === 1 ? "coin" : "coins"}`;
  }
  return `${amount} ${amount === 1 ? "ticket" : "tickets"}`;
}

function getWatDateKey(value: Date | string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof value === "string" ? new Date(value) : value);
}

function MissionsSection({ missions }: { missions: Mission[] }) {
  const visibleMissions = missions.slice(0, 3);
  const completedCount = visibleMissions.filter((mission) => mission.status === "completed").length;

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
        <div className="rounded-2xl bg-surface-1 border border-border p-4 flex items-center gap-3 shadow-card">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No mission for today</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleMissions.map((mission) => (
            <MissionRow key={mission.id} mission={mission} />
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
  const progress = isCompleted ? mission.conditionValue : Math.min(mission.progressCurrent, mission.conditionValue);
  const progressPct = Math.min(100, Math.round((progress / mission.conditionValue) * 100));
  const carriedOver = !!mission.assignedDateWat && getWatDateKey(mission.assignedDateWat) !== getWatDateKey(new Date());

  return (
    <div
      className={`rounded-xl border p-3 flex items-center gap-3 transition-colors ${
        isCompleted ? "bg-surface-1/45 border-success/25 opacity-80" : "bg-surface-1 border-border"
      }`}
    >
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isCompleted ? "bg-success/10 text-success" : meta.tint}`}>
        {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium line-clamp-1 ${isCompleted ? "text-muted-foreground line-through decoration-success/70" : "text-foreground"}`}>
            {mission.title}
          </p>
          {isCompleted && <Check className="h-3.5 w-3.5 text-success shrink-0" />}
        </div>

        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted/60">
          <div
            className={`h-full rounded-full ${isCompleted ? "bg-success" : "bg-primary"} transition-all`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {isCompleted ? (
          <p className="text-xs text-success flex items-center gap-1 mt-1">
            <Check className="h-3 w-3" /> Reward claimed
          </p>
        ) : (
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground tabular-nums">
              {progress}/{mission.conditionValue}
              {carriedOver && <span className="ml-2 text-muted-foreground/70">carried over</span>}
            </p>
          </div>
        )}
      </div>
      <div
        className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
          mission.rewardType === "coins" ? "bg-coin/10 text-coin" : isCompleted ? "bg-muted/50 text-muted-foreground" : "bg-primary/10 text-primary"
        }`}
      >
        {mission.rewardType === "coins" ? <Coins className="h-3 w-3" /> : <Ticket className="h-3 w-3" />}
        {pluralizeRewards(mission.rewardAmount, mission.rewardType)}
      </div>
    </div>
  );
}
