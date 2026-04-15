import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav } from "@/components/layout/BottomNav";
import { Timer, Flame, Trophy, ChevronRight, Swords, BookOpen, Check } from "lucide-react";
import { getPlayerData, getDailyMissions, getLeaderboard } from "@/utils/mission.functions";
import { getSession } from "@/lib/session";
import { RankBadge } from "@/components/profile/RankBadge";
import type { RankTier } from "@/components/profile/RankBadge";
import React from "react";

export const Route = createFileRoute("/_authed/")({
  component: HomePage,
});

function formatCountdown(targetDateStr: string | undefined): string {
  if (!targetDateStr) return "—";
  const now = Date.now();
  const target = new Date(targetDateStr).getTime();
  const diff = target - now;
  if (diff <= 0) return "Drawing soon...";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${days}d ${hours}h ${mins}m`;
}

function HomePage() {
  const session = getSession();
  const [data, setData] = React.useState<{
    playerResult: any;
    missionsResult: any;
    leaderboardResult: any;
  } | null>(null);

  React.useEffect(() => {
    if (!session) return;
    Promise.all([
      getPlayerData({ data: { playerId: session.playerId } }),
      getDailyMissions({ data: { playerId: session.playerId } }),
      getLeaderboard({ data: { limit: 5 } }),
    ]).then(([playerResult, missionsResult, leaderboardResult]) => {
      setData({ playerResult, missionsResult, leaderboardResult });
    });
  }, []);

  const player = data?.playerResult?.success ? data.playerResult.player : null;
  const weekTotal = data?.playerResult?.success ? data.playerResult.weekTotal : 0;
  const weekCap = data?.playerResult?.success ? data.playerResult.weekCap : 50;
  const drawWeek = data?.playerResult?.success ? data.playerResult.drawWeek : null;
  const missions = data?.missionsResult?.success ? data.missionsResult.missions : [];
  const leaderboard = data?.leaderboardResult?.success ? data.leaderboardResult.players : [];

  if (!data) {
    return (
      <div className="mx-auto min-h-screen max-w-[430px] bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background">
      <div className="px-4 pt-6 pb-24 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="text-xl font-bold text-foreground">WinamGames</h1>
          </div>
          <Link
            to="/profile"
            className="h-10 w-10 rounded-full bg-surface-2 flex items-center justify-center border border-glass-border"
          >
            <span className="text-sm font-bold text-primary">
              {player?.nickname?.[0]?.toUpperCase() ?? session?.nickname?.[0]?.toUpperCase() ?? "W"}
            </span>
          </Link>
        </div>

        <div className="rounded-2xl bg-glass border border-glass-border p-4 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Weekly Draw</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tabular-nums text-foreground">
              {formatCountdown(drawWeek?.drawExecutesAt)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Your entries</p>
              <p className="text-lg font-bold tabular-nums text-primary">{weekTotal} / {weekCap}</p>
            </div>
            <Link to="/entries" className="text-xs text-primary flex items-center gap-1 hover:underline">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-1 border border-glass-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-streak/15 flex items-center justify-center">
              <Flame className="h-5 w-5 text-streak" />
            </div>
            <div>
              <p className="text-sm font-semibold">{player?.currentStreak ?? 0} Day Streak</p>
              <p className="text-xs text-muted-foreground">
                {(player?.currentStreak ?? 0) >= 3 ? "+1 bonus entry" : "Play daily to build streak"}
              </p>
            </div>
          </div>
          <RankBadge tier={(player?.rankTier as RankTier) ?? "pawn"} />
        </div>

        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Play Now</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/checkmate"
              className="group rounded-2xl bg-surface-1 border border-glass-border p-4 transition-all hover:border-primary/30 hover:shadow-glow"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center mb-3">
                <Swords className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-sm font-bold">CheckMate</h3>
              <p className="text-xs text-muted-foreground mt-1">Chess puzzles</p>
            </Link>

            <Link
              to="/wisdomdrop"
              className="group rounded-2xl bg-surface-1 border border-glass-border p-4 transition-all hover:border-primary/30 hover:shadow-glow"
            >
              <div className="h-12 w-12 rounded-xl bg-xp/15 flex items-center justify-center mb-3">
                <BookOpen className="h-6 w-6 text-xp" />
              </div>
              <h3 className="text-sm font-bold">WisdomDrop</h3>
              <p className="text-xs text-muted-foreground mt-1">African proverbs</p>
            </Link>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Daily Missions</h2>
          <div className="space-y-2">
            {missions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">No missions available today</p>
            )}
            {missions.map((mission: { id: string; title: string; rewardAmount: number; rewardType: string; status: string; progress: string }) => (
              <div key={mission.id} className="rounded-xl bg-surface-1 border border-glass-border p-3 flex items-center justify-between">
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
        </div>

        <div className="rounded-2xl bg-surface-1 border border-glass-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-gold" />
              <h2 className="text-sm font-semibold">Leaderboard</h2>
            </div>
            <Link to="/leaderboard" className="text-xs text-primary flex items-center gap-1">
              See all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {leaderboard.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No entries yet this week</p>
            )}
            {leaderboard.map((p: { id: string; name: string; entries: number }, i: number) => (
              <div key={p.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold tabular-nums text-muted-foreground w-4">{i + 1}</span>
                  <span className="text-sm font-medium">{p.name}</span>
                </div>
                <span className="text-xs font-medium tabular-nums text-primary">{p.entries} entries</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
