"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  Coins,
  Flame,
  LogOut,
  Sparkles,
  Swords,
  Ticket,
  Trophy,
  User,
  X,
} from "lucide-react";
import { clearSession, getSession } from "@/lib/session";
import { getActiveBanners, getActiveMissions, getDashboard, getSubscriptionStatus, getWinnerStatus } from "@/lib/api";
import type { WinamSession } from "@/lib/session";

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

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

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
    const redirectUrl = subscription?.client_action?.redirection_url || "/subscribe";
    return (
      <main className="min-h-[100dvh] bg-background text-foreground">
        <div className="mx-auto min-h-[100dvh] max-w-[430px] px-4 py-6 flex flex-col justify-center gap-4">
          <div className="rounded-2xl bg-surface-1 border border-border p-6 shadow-card text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold">Subscription required</h1>
            <p className="text-sm text-muted-foreground">
              Intelli says your subscription is inactive. Tap below to continue to your subscription page.
            </p>
            <button
              onClick={() => window.location.href = redirectUrl}
              className="mt-2 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Continue to Intelli
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
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push("/profile")}
            className="h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
            aria-label="Profile"
          >
            <span className="text-sm font-bold text-primary">{(session.nickname ?? "W")[0].toUpperCase()}</span>
          </button>
          <img src="/winam-logo.png" alt="WinamGames" className="h-7 w-auto" />
          <button
            onClick={handleLogout}
            className="h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4 text-foreground" />
          </button>
        </div>

        <div className="px-4 pb-6 space-y-5">
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

          <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">My activity</h2>
          <div className="space-y-2">
            <Link href="/entries" className="flex items-center justify-between rounded-2xl bg-surface-1 border border-border p-4 shadow-card">
              <div>
                <p className="text-sm font-semibold">My tickets</p>
                <p className="text-xs text-muted-foreground mt-1">See your weekly entries</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link href="/winners" className="flex items-center justify-between rounded-2xl bg-surface-1 border border-border p-4 shadow-card">
              <div>
                <p className="text-sm font-semibold">Recent winners</p>
                <p className="text-xs text-muted-foreground mt-1">Past weekly draw results</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link href="/leaderboard" className="flex items-center justify-between rounded-2xl bg-surface-1 border border-border p-4 shadow-card">
              <div>
                <p className="text-sm font-semibold">Leaderboard</p>
                <p className="text-xs text-muted-foreground mt-1">Weekly and daily solvers</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            {winnerStatus?.won && !winnerStatus?.kyc?.paymentProcessed && (
              <Link href="/kyc" className="flex items-center justify-between rounded-2xl bg-surface-1 border border-gold/30 p-4 shadow-card">
                <div>
                  <p className="text-sm font-semibold">Claim prize</p>
                  <p className="text-xs text-muted-foreground mt-1">Complete verification and payout details</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            )}
          </div>
        </div>

          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your snapshot</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Ticket} label="Weekly tickets" value={String(weekTotal)} tone="primary" />
              <StatCard icon={Coins} label="Coins" value={String(player.coinBalance ?? 0)} tone="coin" />
              <StatCard icon={Flame} label="Streak" value={`${streak} days`} tone="streak" />
              <StatCard icon={Sparkles} label="Rank" value={String(tier)} tone="emerald" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string;
  tone: "primary" | "coin" | "streak" | "emerald";
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary/15 text-primary"
      : tone === "coin"
        ? "bg-coin/15 text-coin"
        : tone === "streak"
          ? "bg-streak/15 text-streak"
          : "bg-emerald/15 text-emerald";

  return (
    <div className="rounded-2xl bg-surface-1 border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${toneClass}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function WinnerBanner({ winnerStatus, claimComplete }: { winnerStatus: any; claimComplete: boolean }) {
  const [dismiss, setDismiss] = useState(false);
  const kyc = winnerStatus?.kyc;

  useEffect(() => {
    if (!winnerStatus?.won) {
      setDismiss(false);
      return;
    }
    if (winnerStatus.prizeType === "airtime") {
      setDismiss(localStorage.getItem(`winner-airtime-dismissed-${winnerStatus.winnerId}`) === "1");
      return;
    }
    if (claimComplete) {
      setDismiss(localStorage.getItem(`winner-claim-dismissed-${winnerStatus.winnerId}`) === "1");
      return;
    }
    setDismiss(false);
  }, [claimComplete, winnerStatus]);

  if (!winnerStatus?.won || dismiss) return null;

  if (winnerStatus.prizeType === "airtime") {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-success/30 bg-success/10 p-4 shadow-card">
        <button
          onClick={() => {
            localStorage.setItem(`winner-airtime-dismissed-${winnerStatus.winnerId}`, "1");
            setDismiss(true);
          }}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          aria-label="Dismiss airtime winner notice"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="pr-8">
          <p className="text-base font-bold text-success">🎉 You won ₦{winnerStatus.prizeAmount?.toLocaleString("en-NG")} airtime!</p>
          <p className="mt-1 text-sm text-muted-foreground">It will be sent to your number within 24 hours.</p>
        </div>
      </div>
    );
  }

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
      <div className="relative flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/20">
          <Trophy className="h-5 w-5 text-gold" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
      </div>
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
  return (
    <div className="rounded-2xl bg-surface-1 border border-border p-4 shadow-card">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Weekly draw</p>
          <p className="text-sm font-semibold">{drawWeekStatus ? drawWeekStatus.toUpperCase() : "OPEN"}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Current tickets</p>
          <p className="text-lg font-bold tabular-nums text-primary">{weekTotal}/{weekCap}</p>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (weekTotal / weekCap) * 100)}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate">{drawWeekId ? `Draw week ${drawWeekId.slice(0, 8)}` : "Draw week not loaded"}</span>
        <span>{drawExecutesAt ? new Date(drawExecutesAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Sunday"}</span>
      </div>
    </div>
  );
}

function StreakRankStrip({ streak, tier }: { streak: number; tier: string }) {
  const displayTier = String(tier).charAt(0).toUpperCase() + String(tier).slice(1);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-surface-1 border border-border p-4 shadow-card">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="h-4 w-4 text-streak" />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Streak</span>
        </div>
        <p className="text-2xl font-bold tabular-nums">{streak}d</p>
        <p className="text-xs text-muted-foreground mt-1">Keep the chain alive</p>
      </div>

      <div className="rounded-2xl bg-surface-1 border border-border p-4 shadow-card">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-emerald" />
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Rank</span>
        </div>
        <p className="text-2xl font-bold tabular-nums">{displayTier}</p>
        <p className="text-xs text-muted-foreground mt-1">Current tier</p>
      </div>
    </div>
  );
}

function BannerStack({ banners }: { banners: any[] }) {
  if (!banners.length) {
    return (
      <div className="rounded-2xl bg-surface-1 border border-border p-4 shadow-card">
        <p className="text-sm font-semibold mb-1">Announcements</p>
        <p className="text-sm text-muted-foreground">No active banners right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {banners.map((banner) => (
        <div key={banner.id} className="rounded-2xl bg-surface-1 border border-border p-4 shadow-card">
          <p className="text-sm font-semibold">{banner.title}</p>
          {banner.subtitle && <p className="text-sm text-muted-foreground mt-1">{banner.subtitle}</p>}
        </div>
      ))}
    </div>
  );
}

function MissionsSection({ missions }: { missions: any[] }) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Missions</h2>
      <div className="space-y-2">
        {missions.length ? (
          missions.map((mission) => (
            <div key={mission.id} className="rounded-2xl bg-surface-1 border border-border p-4 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{mission.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {mission.progressCurrent}/{mission.conditionValue}
                    {" · "}
                    reward {mission.rewardAmount} {mission.rewardType === "coins" ? "coins" : "tickets"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                      mission.rewardType === "coins"
                        ? "bg-coin/15 text-coin"
                        : "bg-primary/15 text-primary"
                    }`}
                  >
                    {mission.rewardType === "coins" ? (
                      <Coins className="h-3 w-3" />
                    ) : (
                      <Ticket className="h-3 w-3" />
                    )}
                    {mission.rewardType === "coins" ? "Coins" : "Tickets"}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-surface-1 border border-border p-4 shadow-card text-sm text-muted-foreground">No active missions yet.</div>
        )}
      </div>
    </div>
  );
}
