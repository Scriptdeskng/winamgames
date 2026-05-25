"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Puzzle, Play, Users, Trophy, Sun, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { RANK_CONFIG, type RankTier } from "@/components/profile/RankBadge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getDailyLeaderboard, getWeeklyLeaderboard } from "@/lib/api";
import { sessionStore } from "@/lib/session";

// ── Types ─────────────────────────────────────────────────────────────

interface LeaderRow {
  id: string;
  name: string;
  score: number;
  rankTier: string;
}

interface WeeklyData {
  players: LeaderRow[];
  totalPlayers: number;
  weekStartWat: string | null;
  weekEndWat: string | null;
  currentPlayer: (LeaderRow & { rank: number }) | null;
}

interface DailyData {
  players: LeaderRow[];
  totalPlayers: number;
  todayWat: string | null;
  currentPlayer: (LeaderRow & { rank: number }) | null;
}

// ── Helpers ───────────────────────────────────────────────────────────

function todayWatString(): string {
  const shifted = new Date(Date.now() + 60 * 60 * 1000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatWeekRange(startWat: string | null, endWat: string | null): string {
  if (!startWat || !endWat) return "This week";
  const start = new Date(startWat);
  const end = new Date(endWat);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function asTier(tier: string): RankTier {
  return (tier in RANK_CONFIG ? tier : "starter") as RankTier;
}

// ── Main page ─────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const router = useRouter();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [weekly, setWeekly] = useState<WeeklyData | null>(null);
  const [daily, setDaily] = useState<DailyData | null>(null);

  useEffect(() => {
    const session = sessionStore.get();
    if (!session?.player.id) { router.push("/login"); return; }
    setPlayerId(session.player.id);
  }, [router]);

  useEffect(() => {
    if (!playerId) return;

    async function load() {
      const weeklyResult = await getWeeklyLeaderboard(playerId!, 10);
      setWeekly({
        players: weeklyResult.players.map((p) => ({
          id: p.id,
          name: p.name,
          score: p.puzzles,
          rankTier: p.rankTier,
        })),
        totalPlayers: weeklyResult.totalPlayers,
        weekStartWat: weeklyResult.weekStartWat,
        weekEndWat: weeklyResult.weekEndWat,
        currentPlayer: weeklyResult.currentPlayer
          ? {
              id: weeklyResult.currentPlayer.id,
              name: weeklyResult.currentPlayer.name,
              score: weeklyResult.currentPlayer.puzzles,
              rankTier: weeklyResult.currentPlayer.rankTier,
              rank: weeklyResult.currentPlayer.rank,
            }
          : null,
      });

      const dailyResult = await getDailyLeaderboard(playerId!, 50);
      setDaily({
        players: dailyResult.players.map((p) => ({
          id: p.id,
          name: p.name,
          score: p.puzzles,
          rankTier: p.rankTier,
        })),
        totalPlayers: dailyResult.totalPlayers,
        todayWat: dailyResult.todayWat,
        currentPlayer: dailyResult.currentPlayer
          ? {
              id: dailyResult.currentPlayer.id,
              name: dailyResult.currentPlayer.name,
              score: dailyResult.currentPlayer.puzzles,
              rankTier: dailyResult.currentPlayer.rankTier,
              rank: dailyResult.currentPlayer.rank,
            }
          : null,
      });
    }

    void load();
  }, [playerId]);

  if (!weekly || !daily) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" role="status" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background">
      <div className="flex items-center h-14 px-4 relative border-b border-border">
        <button
          type="button"
          onClick={() => router.push("/app")}
          className="absolute left-4 h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/40 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <p className="w-full text-center text-base font-semibold text-foreground">Leaderboard</p>
      </div>

      <div className="px-4 pb-32 space-y-4 pt-4">
        <Tabs defaultValue="week" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-surface-1 border border-border h-10">
            <TabsTrigger value="week" className="text-xs font-semibold">This week</TabsTrigger>
            <TabsTrigger value="today" className="text-xs font-semibold">Today</TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="space-y-4 mt-3">
            <WeeklyHeaderCard
              weekStartWat={weekly.weekStartWat}
              weekEndWat={weekly.weekEndWat}
              totalPlayers={weekly.totalPlayers}
            />
            <BoardBody data={weekly} meId={playerId ?? undefined} scoreLabel="puzzles this week" />
          </TabsContent>

          <TabsContent value="today" className="space-y-4 mt-3">
            <TodayHeaderCard todayWat={daily.todayWat} totalPlayers={daily.totalPlayers} />
            <BoardBody data={daily} meId={playerId ?? undefined} scoreLabel="puzzles today" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ── Board body ────────────────────────────────────────────────────────

function BoardBody({
  data,
  meId,
  scoreLabel,
}: {
  data: { players: LeaderRow[]; totalPlayers: number; currentPlayer: (LeaderRow & { rank: number }) | null };
  meId: string | undefined;
  scoreLabel: string;
}) {
  if (data.players.length === 0) return <EmptyState />;

  const top3 = data.players.slice(0, 3);
  const rest = data.players.slice(3);
  const showPodium = top3.length === 3;

  const meInTop = meId ? data.players.find((p) => p.id === meId) : undefined;
  const myRank = data.currentPlayer?.rank ?? (meInTop ? data.players.findIndex((p) => p.id === meId) + 1 : null);
  const myScore = data.currentPlayer?.score ?? meInTop?.score ?? null;

  return (
    <>
      {showPodium && <Podium top3={top3} meId={meId} />}
      {(showPodium ? rest : data.players).length > 0 && (
        <ChaseList
          players={showPodium ? rest : data.players}
          startRank={showPodium ? 4 : 1}
          meId={meId}
          top3Lowest={showPodium ? top3[2].score : null}
        />
      )}
      {myRank !== null && myScore !== null && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-full max-w-[430px] px-4 pointer-events-none">
          <div className="pointer-events-auto">
            <YourStandingCard
              rank={myRank}
              score={myScore}
              totalPlayers={data.totalPlayers}
              players={data.players}
              scoreLabel={scoreLabel}
            />
          </div>
        </div>
      )}
    </>
  );
}

// ── Weekly header card ────────────────────────────────────────────────

function WeeklyHeaderCard({
  weekStartWat,
  weekEndWat,
  totalPlayers,
}: {
  weekStartWat: string | null;
  weekEndWat: string | null;
  totalPlayers: number;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  function getNextSundayWAT(): number {
    const watNow = new Date(Date.now() + 60 * 60 * 1000);
    const day = watNow.getUTCDay();
    const daysUntilSunday = day === 0 ? 7 : 7 - day;
    const sunday = new Date(watNow);
    sunday.setUTCDate(watNow.getUTCDate() + daysUntilSunday);
    sunday.setUTCHours(18, 0, 0, 0);
    return sunday.getTime() - 60 * 60 * 1000;
  }

  const remaining = Math.max(0, getNextSundayWAT() - now);
  const total = Math.max(0, Math.floor(remaining / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="rounded-2xl bg-surface-1 border border-border shadow-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          This Week's Draw
        </p>
        <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
          <Users className="h-3 w-3" />
          {totalPlayers} {totalPlayers === 1 ? "solver" : "solvers"}
        </div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="flex items-end gap-2">
          <div className="flex flex-col items-center">
            <span className="font-mono text-2xl font-bold tabular-nums leading-none text-foreground">{pad(days)}</span>
            <span className="text-[9px] text-muted-foreground lowercase mt-1 leading-none">days</span>
          </div>
          <span className="font-mono text-2xl font-bold leading-none text-muted-foreground/40 pb-[14px]">:</span>
          <div className="flex flex-col items-center">
            <span className="font-mono text-2xl font-bold tabular-nums leading-none text-foreground">{pad(hours)}</span>
            <span className="text-[9px] text-muted-foreground lowercase mt-1 leading-none">hrs</span>
          </div>
          <span className="font-mono text-2xl font-bold leading-none text-muted-foreground/40 pb-[14px]">:</span>
          <div className="flex flex-col items-center">
            <span className="font-mono text-2xl font-bold tabular-nums leading-none text-foreground">{pad(minutes)}</span>
            <span className="text-[9px] text-muted-foreground lowercase mt-1 leading-none">min</span>
          </div>
        </div>
        <div className="text-right text-[11px] text-muted-foreground leading-tight shrink-0">
          <p className="whitespace-nowrap">locks Sun 7pm WAT</p>
          <p className="tabular-nums whitespace-nowrap">{formatWeekRange(weekStartWat, weekEndWat)}</p>
        </div>
      </div>
    </div>
  );
}

// ── Today header card ─────────────────────────────────────────────────

function TodayHeaderCard({ todayWat, totalPlayers }: { todayWat: string | null; totalPlayers: number }) {
  const dateLabel = todayWat
    ? new Date(`${todayWat}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
    : "Today";
  return (
    <div className="rounded-2xl bg-surface-1 border border-border shadow-card p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center shrink-0">
        <Sun className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Today&apos;s Solvers</p>
        <p className="text-sm font-semibold text-foreground truncate">{dateLabel}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-base font-bold tabular-nums text-foreground">{totalPlayers}</p>
        <p className="text-[10px] text-muted-foreground">{totalPlayers === 1 ? "solver" : "solvers"}</p>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────

function EmptyState() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push("/app")}
      className="w-full rounded-2xl bg-surface-1 border border-primary/30 p-6 text-center space-y-3 shadow-glow hover:border-primary/60 transition-colors"
    >
      <div className="h-14 w-14 rounded-2xl bg-primary/15 ring-1 ring-primary/30 mx-auto flex items-center justify-center">
        <Trophy className="h-7 w-7 text-primary" />
      </div>
      <div>
        <p className="text-base font-bold text-foreground">Be first on the board</p>
        <p className="text-xs text-muted-foreground mt-1">Solve puzzles to climb the ranks.</p>
      </div>
      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
        <Play className="h-3.5 w-3.5 fill-current" />
        Play now
      </span>
    </button>
  );
}

// ── Podium ────────────────────────────────────────────────────────────

const PODIUM_STYLES = {
  1: { ring: "ring-2 ring-coin/50", bg: "bg-coin/10", label: "text-coin", pad: "pt-5 pb-5 px-3", avatarSize: "h-16 w-16", iconSize: "h-7 w-7", glow: true },
  2: { ring: "ring-1 ring-border", bg: "bg-surface-1", label: "text-muted-foreground", pad: "pt-4 pb-4 px-2", avatarSize: "h-12 w-12", iconSize: "h-5 w-5", glow: false },
  3: { ring: "ring-1 ring-border", bg: "bg-surface-1", label: "text-muted-foreground", pad: "pt-4 pb-4 px-2", avatarSize: "h-12 w-12", iconSize: "h-5 w-5", glow: false },
} as const;

const PLACE_LABELS = { 1: "1st", 2: "2nd", 3: "3rd" } as const;

function Podium({ top3, meId }: { top3: LeaderRow[]; meId: string | undefined }) {
  const [first, second, third] = top3;
  return (
    <div className="relative pt-6">
      <div className="grid grid-cols-3 gap-2 items-end">
        <div style={{ transform: "rotate(-2deg)" }}>
          <PodiumPillar player={second} place={2} meId={meId} />
        </div>
        <div className="-mt-4">
          <PodiumPillar player={first} place={1} meId={meId} />
        </div>
        <div style={{ transform: "rotate(2deg)" }}>
          <PodiumPillar player={third} place={3} meId={meId} />
        </div>
      </div>
    </div>
  );
}

function PodiumPillar({ player, place, meId }: { player: LeaderRow | undefined; place: 1 | 2 | 3; meId: string | undefined }) {
  if (!player) return <div />;
  const style = PODIUM_STYLES[place];
  const tier = asTier(player.rankTier);
  const tierConfig = RANK_CONFIG[tier];
  const Icon = tierConfig.icon;
  const isMe = player.id === meId;

  return (
    <div className={cn(
      "relative rounded-2xl border border-border flex flex-col items-center text-center",
      style.bg, style.ring, style.pad,
      style.glow && "shadow-glow",
      isMe && "outline outline-2 outline-primary/60 outline-offset-2"
    )}>
      {place === 1 && (
        <Crown className="absolute -top-5 left-1/2 -translate-x-1/2 h-7 w-7 text-coin" />
      )}
      <div className={cn("rounded-full bg-surface-2 flex items-center justify-center mb-2", style.avatarSize)}>
        <Icon className={cn(style.iconSize, tierConfig.color)} />
      </div>
      <p className={cn("font-semibold text-foreground truncate max-w-full", place === 1 ? "text-sm" : "text-xs")}>
        {isMe ? "You" : player.name}
      </p>
      <div className={cn("mt-1.5 inline-flex items-center gap-1 font-bold tabular-nums text-foreground", place === 1 ? "text-base" : "text-sm")}>
        <Puzzle className={place === 1 ? "h-4 w-4" : "h-3 w-3"} />
        {player.score}
      </div>
      <span className={cn("mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", style.label, "bg-black/10")}>
        {PLACE_LABELS[place]}
      </span>
    </div>
  );
}

// ── Chase list ────────────────────────────────────────────────────────

function ChaseList({ players, startRank, meId, top3Lowest }: {
  players: LeaderRow[];
  startRank: number;
  meId: string | undefined;
  top3Lowest: number | null;
}) {
  return (
    <div className="rounded-2xl bg-surface-1 border border-border overflow-hidden divide-y divide-border/40">
      {players.map((p, i) => {
        const rank = startRank + i;
        const isMe = p.id === meId;
        const isFirstBelowPodium = startRank === 4 && i === 0;
        const gapToPodium = top3Lowest !== null ? top3Lowest - p.score + 1 : 0;
        const hint = isFirstBelowPodium && gapToPodium > 0 ? `+${gapToPodium} to podium` : null;
        return (
          <div key={p.id} className={cn(isMe && "border-l-2 border-l-primary bg-primary/[0.04]")}>
            <div className="px-3 py-2.5 flex items-center gap-3">
              <span className={cn("text-sm font-bold tabular-nums w-6 text-center", isMe ? "text-primary" : "text-muted-foreground")}>
                {rank}
              </span>
              <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", RANK_CONFIG[asTier(p.rankTier)].bgColor)}>
                {(() => { const Icon = RANK_CONFIG[asTier(p.rankTier)].icon; return <Icon className={cn("h-4 w-4", RANK_CONFIG[asTier(p.rankTier)].color)} />; })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                  {isMe ? "You" : p.name}
                  {isMe && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-px rounded bg-primary/15 text-primary">You</span>}
                </p>
                {hint && <p className="text-[10px] text-coin font-medium leading-tight mt-0.5">{hint}</p>}
              </div>
              <div className="inline-flex items-center gap-1 text-sm font-bold tabular-nums text-foreground">
                <Puzzle className="h-3.5 w-3.5 text-muted-foreground" />
                {p.score}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Your standing card ────────────────────────────────────────────────

function YourStandingCard({ rank, score, totalPlayers, players, scoreLabel }: {
  rank: number;
  score: number;
  totalPlayers: number;
  players: LeaderRow[];
  scoreLabel: string;
}) {
  const above = players[rank - 2];
  const gapUp = rank > 1 && above ? { score: Math.max(0, above.score - score + 1), targetRank: rank - 1 } : null;
  const inTop10 = rank <= 10;
  const safetyMsg = inTop10 ? { text: "Safe in top 10", tone: "safe" as const } : { text: `${rank - 10} ranks below top 10`, tone: "push" as const };
  const aboveScore = rank > 1 && players[rank - 2] ? players[rank - 2].score : score;
  const pct = aboveScore > 0 ? Math.min(100, (score / aboveScore) * 100) : 100;

  return (
    <div className="rounded-2xl bg-surface-1/95 backdrop-blur-md border border-primary/40 shadow-glow p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">Your standing</p>
          <p className="text-2xl font-bold tabular-nums text-foreground mt-1">
            #{rank}
            <span className="text-sm font-medium text-muted-foreground ml-1">of {totalPlayers}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1 text-lg font-bold tabular-nums text-primary">
            <Puzzle className="h-4 w-4" />
            {score}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">{scoreLabel}</p>
        </div>
      </div>
      {gapUp && gapUp.score > 0 && (
        <>
          <div className="h-1.5 w-full rounded-full bg-border/60 overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            <span className="text-foreground font-semibold">+{gapUp.score}</span> to reach rank #{gapUp.targetRank}
            {" · "}
            <span className={safetyMsg.tone === "safe" ? "text-primary" : "text-coin"}>{safetyMsg.text}</span>
          </p>
        </>
      )}
      {(!gapUp || gapUp.score === 0) && (
        <p className="text-[11px] text-primary font-semibold">
          {rank === 1 ? "👑 You're #1 — defend the throne." : safetyMsg.text}
        </p>
      )}
    </div>
  );
}
