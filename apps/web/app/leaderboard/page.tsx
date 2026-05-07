"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Crown, Gamepad2, Puzzle, Trophy, Users } from "lucide-react";
import { getDailyLeaderboard, getLeaderboard } from "@/lib/api";
import { getSession } from "@/lib/session";

type LeaderRow = {
  id: string;
  name: string;
  puzzles: number;
  rankTier: string;
};

function formatWeekRange(startWat: string | null, endWat: string | null): string {
  if (!startWat || !endWat) return "This week";
  const start = new Date(`${startWat}T00:00:00`);
  const end = new Date(`${endWat}T00:00:00`);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function getCountdownParts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
  };
}

function formatCountdown(targetMs: number): string {
  const diff = Math.max(0, targetMs - Date.now());
  const total = Math.floor(diff / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const session = getSession();
  const [tab, setTab] = useState<"week" | "today">("week");
  const [weekly, setWeekly] = useState<any>(null);
  const [daily, setDaily] = useState<any>(null);
  const [error, setError] = useState("");
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!session) {
      router.replace("/login");
      return;
    }

    Promise.all([getLeaderboard(session.playerId, 10), getDailyLeaderboard(session.playerId, 50)])
      .then(([w, d]) => {
        setWeekly(w);
        setDaily(d);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load leaderboard."));
  }, [router, session]);

  useEffect(() => {
    const id = setInterval(() => forceTick((value) => value + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const weeklyRows: LeaderRow[] = weekly?.players ?? [];
  const dailyRows: LeaderRow[] = daily?.players ?? [];
  const current = tab === "week" ? weekly : daily;
  const rows = tab === "week" ? weeklyRows : dailyRows;
  const totalPlayers = current?.totalPlayers ?? 0;
  const currentPlayer = current?.currentPlayer ?? null;
  const currentScore = currentPlayer?.puzzles ?? 0;
  const currentRank = currentPlayer?.rank ?? (session ? rows.findIndex((row) => row.id === session.playerId) + 1 : null);
  const countdownTarget = tab === "week" && current?.drawExecutesAt ? new Date(current.drawExecutesAt).getTime() : null;
  const countdown = countdownTarget ? formatCountdown(countdownTarget) : null;
  const countdownParts = countdownTarget ? getCountdownParts(countdownTarget - Date.now()) : { days: 0, hours: 0, minutes: 0 };

  const podium = useMemo(() => rows.slice(0, 3), [rows]);
  const rest = useMemo(() => rows.slice(3), [rows]);

  if (!session) return null;

  if (!weekly || !daily) {
    return (
      <main className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[100dvh] max-w-[430px] bg-background text-foreground">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/app" className="h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center">
          <span className="sr-only">Back</span>
          <ChevronDown className="h-4 w-4 rotate-90" />
        </Link>
        <img src="/winam-logo.png" alt="WinamGames" className="h-7 w-auto" />
        <div className="h-10 w-10" />
      </div>

      <div className="px-4 pb-6 space-y-4">
        <div className="relative overflow-hidden rounded-2xl bg-surface-1 border border-border p-5 shadow-card text-center space-y-2">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/10 to-transparent" />
          <Crown className="relative h-8 w-8 text-primary mx-auto" />
          <h1 className="relative text-xl font-bold">Solvers at the top</h1>
          <p className="relative text-xs text-muted-foreground">Weekly puzzles and daily streaks feed the board</p>
          <Link href="/app" className="relative inline-flex items-center gap-2 mt-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            <Gamepad2 className="h-4 w-4" />
            Play Now
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface-1 border border-border p-1">
          <button
            onClick={() => setTab("week")}
            className={`h-10 rounded-xl text-sm font-semibold transition-colors ${tab === "week" ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground"}`}
          >
            This week
          </button>
          <button
            onClick={() => setTab("today")}
            className={`h-10 rounded-xl text-sm font-semibold transition-colors ${tab === "today" ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground"}`}
          >
            Today
          </button>
        </div>

        <div className="rounded-2xl bg-surface-1 border border-border p-4 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              {tab === "week" ? "This Week's Draw" : "Today's Solvers"}
            </p>
            <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
              <Users className="h-3 w-3" />
              {totalPlayers} {totalPlayers === 1 ? "solver" : "solvers"}
            </div>
          </div>

          {tab === "week" && countdown && (
            <div className="flex items-end justify-between gap-3">
              <div className="flex items-end gap-2">
                <CountdownBlock value={countdownParts.days} label="days" />
                <Sep />
                <CountdownBlock value={countdownParts.hours} label="hrs" />
                <Sep />
                <CountdownBlock value={countdownParts.minutes} label="min" />
              </div>
              <div className="text-right text-[11px] text-muted-foreground leading-tight">
                <p>locks Sun 7pm WAT</p>
                <p className="tabular-nums">{formatWeekRange(current?.weekStartWat ?? null, current?.weekEndWat ?? null)}</p>
              </div>
            </div>
          )}

          {tab === "week" && current?.weekStartWat && current?.weekEndWat && (
            <p className="text-xs text-muted-foreground">{formatWeekRange(current.weekStartWat, current.weekEndWat)}</p>
          )}

          {tab === "today" && current?.todayWat && (
            <p className="text-xs text-muted-foreground">
              {new Date(`${current.todayWat}T00:00:00`).toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </p>
          )}

          {tab === "week" && (
            <div className="h-1 w-full rounded-full bg-border/60 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{
                  width: current?.weekStartWat && current?.weekEndWat
                    ? `${Math.min(
                        100,
                        Math.max(
                          0,
                          ((Date.now() - new Date(`${current.weekStartWat}T00:00:00`).getTime()) /
                            (new Date(`${current.weekEndWat}T23:59:59`).getTime() - new Date(`${current.weekStartWat}T00:00:00`).getTime())) *
                            100,
                        ),
                      )}%`
                    : "0%",
                }}
              />
            </div>
          )}
        </div>

        {rows.length === 0 ? (
          <Link
            href="/app"
            className="block rounded-2xl bg-surface-1 border border-primary/30 p-6 text-center space-y-3 shadow-glow hover:border-primary/60 transition-colors"
          >
            <div className="h-14 w-14 rounded-2xl bg-primary/15 ring-1 ring-primary/30 mx-auto flex items-center justify-center">
              <Trophy className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-base font-bold text-foreground">Be first on the board</p>
              <p className="text-xs text-muted-foreground mt-1">Solve puzzles to climb the ranks.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
              <Puzzle className="h-3.5 w-3.5" />
              Play now
            </span>
          </Link>
        ) : (
          <div className="space-y-4 pb-28">
            {podium.length === 3 && <Podium top3={podium} meId={session.playerId} />}

            {(podium.length === 3 ? rest : rows).length > 0 && (
              <ChaseList
                players={podium.length === 3 ? rest : rows}
                startRank={podium.length === 3 ? 4 : 1}
                meId={session.playerId}
                top3Lowest={podium.length === 3 ? podium[2].puzzles : null}
              />
            )}
          </div>
        )}

        {currentRank && (
          <div className="fixed bottom-3 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 px-4">
            <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-surface-1/95 to-surface-1/95 backdrop-blur-md border border-primary/40 shadow-glow p-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">Your standing</p>
                  <p className="text-2xl font-bold font-display tabular-nums text-foreground mt-1">
                    #{currentRank}
                    <span className="text-sm font-medium text-muted-foreground ml-1">of {totalPlayers}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 text-lg font-bold tabular-nums font-display text-primary">
                    <Puzzle className="h-4 w-4" />
                    {currentScore}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">puzzles this {tab === "week" ? "week" : "day"}</p>
                </div>
              </div>

              <div className="mt-3 h-1.5 w-full rounded-full bg-black/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                  style={{ width: `${Math.min(100, currentScore > 0 ? 100 : 0)}%` }}
                />
              </div>

              <p className="mt-2 text-[11px] text-muted-foreground tabular-nums">
                {currentRank === 1 ? "👑 You're #1 — defend the throne." : `Keep going to climb higher.`}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-2xl font-bold tabular-nums leading-none text-foreground">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[9px] text-muted-foreground lowercase mt-1 leading-none">{label}</span>
    </div>
  );
}

function Sep() {
  return <span className="font-mono text-2xl font-bold leading-none text-muted-foreground/40 pb-[14px]">:</span>;
}

function Podium({
  top3,
  meId,
}: {
  top3: LeaderRow[];
  meId: string;
}) {
  const [first, second, third] = top3;

  return (
    <div className="relative pt-6">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-48 w-48 rounded-full blur-3xl opacity-50"
        style={{ background: "radial-gradient(circle, oklch(0.82 0.17 85 / 0.55), transparent 70%)" }}
      />
      <div className="relative grid grid-cols-3 gap-2 items-end">
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500" style={{ animationDelay: "0ms", transform: "rotate(-2deg)" }}>
          <PodiumPillar player={second} place={2} meId={meId} />
        </div>
        <div className="animate-in fade-in-0 slide-in-from-bottom-6 duration-700 -mt-4" style={{ animationDelay: "200ms" }}>
          <PodiumPillar player={first} place={1} meId={meId} />
        </div>
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500" style={{ animationDelay: "100ms", transform: "rotate(2deg)" }}>
          <PodiumPillar player={third} place={3} meId={meId} />
        </div>
      </div>
    </div>
  );
}

function PodiumPillar({
  player,
  place,
  meId,
}: {
  player: LeaderRow | undefined;
  place: 1 | 2 | 3;
  meId: string;
}) {
  if (!player) return <div />;

  const isMe = player.id === meId;
  const placeLabel = place === 1 ? "1st" : place === 2 ? "2nd" : "3rd";
  const avatarSize = place === 1 ? "h-16 w-16" : "h-12 w-12";

  return (
    <div
      className={`relative rounded-2xl flex flex-col items-center text-center ${
        place === 1
          ? "pt-5 pb-5 px-3 bg-gradient-to-b from-coin/15 to-coin/5 ring-2 ring-coin/50 shadow-glow"
          : place === 2
            ? "pt-4 pb-4 px-2 bg-gradient-to-b from-[oklch(0.78_0.02_250)]/15 to-[oklch(0.78_0.02_250)]/5 ring-1 ring-[oklch(0.78_0.02_250)]/40"
            : "pt-4 pb-4 px-2 bg-gradient-to-b from-[oklch(0.58_0.09_55)]/15 to-[oklch(0.58_0.09_55)]/5 ring-1 ring-[oklch(0.58_0.09_55)]/50"
      } ${isMe ? "outline outline-2 outline-primary/60 outline-offset-2" : ""}`}
    >
      {place === 1 && (
        <Crown className="absolute -top-5 left-1/2 h-7 w-7 -translate-x-1/2 text-coin drop-shadow-[0_0_8px_oklch(0.82_0.17_85_/_0.6)]" />
      )}

      <div
        className={`${avatarSize} rounded-full flex items-center justify-center mb-2 shadow-lg`}
        style={{
          background:
            place === 1
              ? "linear-gradient(135deg, oklch(0.82 0.17 85 / 0.35), oklch(0.65 0.12 85 / 0.25))"
              : place === 2
                ? "linear-gradient(135deg, oklch(0.78 0.02 250 / 0.35), oklch(0.55 0.02 250 / 0.25))"
                : "linear-gradient(135deg, oklch(0.58 0.09 55 / 0.40), oklch(0.42 0.07 55 / 0.30))",
        }}
      >
        <Users className={`${place === 1 ? "h-7 w-7" : "h-5 w-5"} text-foreground/90`} />
      </div>

      <p className={`${place === 1 ? "text-sm" : "text-xs"} font-semibold text-foreground truncate max-w-full`}>
        {isMe ? "You" : player.name}
      </p>

      <div className={`mt-1.5 inline-flex items-center gap-1 ${place === 1 ? "text-base" : "text-sm"} font-bold tabular-nums font-display text-foreground`}>
        <Puzzle className={place === 1 ? "h-4 w-4" : "h-3 w-3"} />
        {player.puzzles}
      </div>

      <span className="mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary">
        {placeLabel}
      </span>
    </div>
  );
}

function ChaseList({
  players,
  startRank,
  meId,
  top3Lowest,
}: {
  players: LeaderRow[];
  startRank: number;
  meId: string;
  top3Lowest: number | null;
}) {
  return (
    <div className="rounded-2xl bg-surface-1 border border-border overflow-hidden divide-y divide-border/40">
      {players.map((player, index) => {
        const rank = startRank + index;
        const isMe = player.id === meId;
        const isFirstBelowPodium = startRank === 4 && index === 0;
        const gapToPodium = top3Lowest !== null ? top3Lowest - player.puzzles + 1 : 0;
        const hint = isFirstBelowPodium && gapToPodium > 0 ? `+${gapToPodium} to podium` : null;

        return (
          <div key={player.id} className={`animate-in fade-in-0 duration-300 ${isMe ? "border-l-2 border-l-primary bg-primary/[0.04]" : ""}`} style={{ animationDelay: `${Math.min(index * 30, 600)}ms` }}>
            <ChaseRow rank={rank} player={player} isMe={isMe} hint={hint} />
          </div>
        );
      })}
    </div>
  );
}

function ChaseRow({
  rank,
  player,
  isMe,
  hint,
}: {
  rank: number;
  player: LeaderRow;
  isMe: boolean;
  hint: string | null;
}) {
  return (
    <div className="px-3 py-2.5 flex items-center gap-3">
      <span className={`text-sm font-bold tabular-nums w-6 text-center ${isMe ? "text-primary" : "text-muted-foreground"}`}>
        {rank}
      </span>
      <div className="h-8 w-8 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
        <Trophy className="h-4 w-4 text-foreground/80" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
          {isMe ? "You" : player.name}
          {isMe && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-px rounded bg-primary/15 text-primary">
              You
            </span>
          )}
        </p>
        {hint && <p className="text-[10px] text-coin font-medium leading-tight mt-0.5">{hint}</p>}
      </div>
      <div className="inline-flex items-center gap-1 text-sm font-bold tabular-nums text-foreground">
        <Puzzle className="h-3.5 w-3.5 text-muted-foreground" />
        {player.puzzles}
      </div>
    </div>
  );
}
