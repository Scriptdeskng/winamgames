import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Crown, Ticket, Info, Play, Users, Trophy } from "lucide-react";
import { useAllowScroll } from "@/hooks/useAllowScroll";
import { getSession } from "@/lib/session";
import { getLeaderboard } from "@/utils/mission.functions";
import { RANK_CONFIG, type RankTier } from "@/components/profile/RankBadge";
import React from "react";

export const Route = createFileRoute("/_authed/leaderboard")({
  component: LeaderboardPage,
  head: () => ({
    meta: [
      { title: "Leaderboard — WinamGames" },
      { name: "description", content: "See the top players competing this week on WinamGames." },
    ],
  }),
});

interface LeaderboardPlayer {
  id: string;
  name: string;
  entries: number;
  rankTier: string;
}

interface LeaderboardData {
  players: LeaderboardPlayer[];
  totalPlayers: number;
  weekStartWat: string | null;
  weekEndWat: string | null;
  drawExecutesAt: string | null;
  currentPlayer: (LeaderboardPlayer & { rank: number }) | null;
}

function asTier(tier: string): RankTier {
  return (tier in RANK_CONFIG ? tier : "starter") as RankTier;
}

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

function LeaderboardPage() {
  useAllowScroll();
  const session = getSession();
  const [data, setData] = React.useState<LeaderboardData | null>(null);

  React.useEffect(() => {
    getLeaderboard({
      data: { limit: 10, playerId: session?.playerId },
    }).then((res) => {
      if (res.success) {
        setData({
          players: res.players,
          totalPlayers: res.totalPlayers,
          weekStartWat: res.weekStartWat,
          weekEndWat: res.weekEndWat,
          drawExecutesAt: res.drawExecutesAt,
          currentPlayer: res.currentPlayer,
        });
      } else {
        setData({
          players: [],
          totalPlayers: 0,
          weekStartWat: null,
          weekEndWat: null,
          drawExecutesAt: null,
          currentPlayer: null,
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) {
    return (
      <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const meId = session?.playerId;
  const top3 = data.players.slice(0, 3);
  const rest = data.players.slice(3);
  const showPodium = top3.length === 3;

  // Resolve current player standing: prefer server `currentPlayer`, else find in top list.
  const meInTop = meId ? data.players.find((p) => p.id === meId) : undefined;
  const myRank = data.currentPlayer?.rank
    ?? (meInTop ? data.players.findIndex((p) => p.id === meId) + 1 : null);
  const myEntries = data.currentPlayer?.entries ?? meInTop?.entries ?? null;

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background">
      <style>{`
        @keyframes crown-float {
          0%, 100% { transform: translate(-50%, 0) rotate(-4deg); }
          50% { transform: translate(-50%, -4px) rotate(4deg); }
        }
        .crown-float { animation: crown-float 3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .crown-float { animation: none; }
        }
      `}</style>
      <TopBar backTo="/app" title="Leaderboard" />
      <div className="px-4 pb-8 space-y-5">
        <DrawCountdownCard
          drawExecutesAt={data.drawExecutesAt}
          weekStartWat={data.weekStartWat}
          weekEndWat={data.weekEndWat}
          totalPlayers={data.totalPlayers}
        />

        {data.players.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {showPodium && <Podium top3={top3} meId={meId} />}

            {(showPodium ? rest : data.players).length > 0 && (
              <ChaseList
                players={showPodium ? rest : data.players}
                startRank={showPodium ? 4 : 1}
                meId={meId}
                top3Lowest={showPodium ? top3[2].entries : null}
              />
            )}

            {myRank !== null && myEntries !== null && (
              <YourStandingCard
                rank={myRank}
                entries={myEntries}
                totalPlayers={data.totalPlayers}
                players={data.players}
              />
            )}
          </>
        )}

        <Link
          to="/entries"
          className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          <Info className="h-3 w-3" />
          How tickets work
        </Link>
      </div>
    </div>
  );
}

// ── Live draw countdown card ──────────────────────────────────────────
function DrawCountdownCard({
  drawExecutesAt,
  weekStartWat,
  weekEndWat,
  totalPlayers,
}: {
  drawExecutesAt: string | null;
  weekStartWat: string | null;
  weekEndWat: string | null;
  totalPlayers: number;
}) {
  const target = drawExecutesAt ? new Date(drawExecutesAt).getTime() : null;
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const remaining = target ? Math.max(0, target - now) : 0;
  const { days, hours, minutes } = getCountdownParts(remaining);

  // Week elapsed progress
  let pct = 0;
  if (weekStartWat && weekEndWat) {
    const start = new Date(`${weekStartWat}T00:00:00`).getTime();
    const end = new Date(`${weekEndWat}T23:59:59`).getTime();
    if (end > start) pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  }

  return (
    <div className="rounded-2xl bg-surface-1 border border-border shadow-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          This Week's Draw
        </p>
        <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
          <Users className="h-3 w-3" />
          {totalPlayers} {totalPlayers === 1 ? "player" : "players"}
        </div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="flex items-end gap-2">
          <CountdownBlock value={days} label="days" />
          <Sep />
          <CountdownBlock value={hours} label="hrs" />
          <Sep />
          <CountdownBlock value={minutes} label="min" />
        </div>
        <div className="text-right text-[11px] text-muted-foreground leading-tight">
          <p>ends Sun 8pm</p>
          <p className="tabular-nums">{formatWeekRange(weekStartWat, weekEndWat)}</p>
        </div>
      </div>

      <div className="h-1 w-full rounded-full bg-border/60 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-2xl font-bold tabular-nums leading-none text-foreground">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[9px] text-muted-foreground lowercase mt-1 leading-none">
        {label}
      </span>
    </div>
  );
}

function Sep() {
  return <span className="font-mono text-2xl font-bold leading-none text-muted-foreground/40 pb-[14px]">:</span>;
}

// ── Empty state ───────────────────────────────────────────────────────
function EmptyState() {
  return (
    <Link
      to="/app"
      className="block rounded-2xl bg-surface-1 border border-primary/30 p-6 text-center space-y-3 shadow-glow hover:border-primary/60 transition-colors"
    >
      <div className="h-14 w-14 rounded-2xl bg-primary/15 ring-1 ring-primary/30 mx-auto flex items-center justify-center">
        <Trophy className="h-7 w-7 text-primary" />
      </div>
      <div>
        <p className="text-base font-bold text-foreground">Be first on the board</p>
        <p className="text-xs text-muted-foreground mt-1">
          Earn a ticket to claim rank #1 this week.
        </p>
      </div>
      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
        <Play className="h-3.5 w-3.5 fill-current" />
        Play now
      </span>
    </Link>
  );
}

// ── Podium ────────────────────────────────────────────────────────────
function Podium({
  top3,
  meId,
}: {
  top3: LeaderboardPlayer[];
  meId: string | undefined;
}) {
  const [first, second, third] = top3;
  return (
    <div className="relative pt-6">
      {/* Radial gold glow behind 1st */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-48 w-48 rounded-full blur-3xl opacity-50"
        style={{ background: "radial-gradient(circle, oklch(0.82 0.17 85 / 0.55), transparent 70%)" }}
      />
      <div className="relative grid grid-cols-3 gap-2 items-end">
        <div
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: "0ms", transform: "rotate(-2deg)" }}
        >
          <PodiumPillar player={second} place={2} meId={meId} />
        </div>
        <div
          className="animate-in fade-in-0 slide-in-from-bottom-6 duration-700 -mt-4"
          style={{ animationDelay: "200ms" }}
        >
          <PodiumPillar player={first} place={1} meId={meId} />
        </div>
        <div
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
          style={{ animationDelay: "100ms", transform: "rotate(2deg)" }}
        >
          <PodiumPillar player={third} place={3} meId={meId} />
        </div>
      </div>
    </div>
  );
}

const PODIUM_STYLES: Record<
  1 | 2 | 3,
  { ring: string; bg: string; label: string; pad: string; avatar: string; glow: boolean; medalBg: string; medalText: string }
> = {
  1: {
    ring: "ring-2 ring-coin/50",
    bg: "bg-gradient-to-b from-coin/15 to-coin/5",
    label: "text-coin",
    pad: "pt-5 pb-5 px-3",
    avatar: "h-16 w-16",
    glow: true,
    medalBg: "bg-coin/25",
    medalText: "text-coin",
  },
  2: {
    ring: "ring-1 ring-[oklch(0.78_0.02_250)]/40",
    bg: "bg-gradient-to-b from-[oklch(0.78_0.02_250)]/15 to-[oklch(0.78_0.02_250)]/5",
    label: "text-[oklch(0.88_0.02_250)]",
    pad: "pt-4 pb-4 px-2",
    avatar: "h-12 w-12",
    glow: false,
    medalBg: "bg-[oklch(0.78_0.02_250)]/20",
    medalText: "text-[oklch(0.88_0.02_250)]",
  },
  3: {
    ring: "ring-1 ring-[oklch(0.58_0.09_55)]/50",
    bg: "bg-gradient-to-b from-[oklch(0.58_0.09_55)]/15 to-[oklch(0.58_0.09_55)]/5",
    label: "text-[oklch(0.78_0.10_55)]",
    pad: "pt-4 pb-4 px-2",
    avatar: "h-12 w-12",
    glow: false,
    medalBg: "bg-[oklch(0.58_0.09_55)]/20",
    medalText: "text-[oklch(0.78_0.10_55)]",
  },
};

function PodiumPillar({
  player,
  place,
  meId,
}: {
  player: LeaderboardPlayer | undefined;
  place: 1 | 2 | 3;
  meId: string | undefined;
}) {
  if (!player) return <div />;
  const style = PODIUM_STYLES[place];
  const tier = asTier(player.rankTier);
  const tierConfig = RANK_CONFIG[tier];
  const Icon = tierConfig.icon;
  const isMe = player.id === meId;
  const placeLabel = place === 1 ? "1st" : place === 2 ? "2nd" : "3rd";

  return (
    <div
      className={`relative rounded-2xl ${style.bg} ${style.ring} ${style.pad} flex flex-col items-center text-center ${
        style.glow ? "shadow-glow" : ""
      } ${isMe ? "outline outline-2 outline-primary/60 outline-offset-2" : ""}`}
    >
      {place === 1 && (
        <Crown className="crown-float absolute -top-5 left-1/2 h-7 w-7 text-coin drop-shadow-[0_0_8px_oklch(0.82_0.17_85_/_0.6)]" />
      )}

      {/* Tier-colored gradient orb avatar */}
      <div
        className={`${style.avatar} rounded-full flex items-center justify-center mb-2 shadow-lg`}
        style={{
          background: `radial-gradient(circle at 30% 30%, color-mix(in oklab, currentColor 30%, transparent), transparent 70%), ${
            place === 1
              ? "linear-gradient(135deg, oklch(0.82 0.17 85 / 0.35), oklch(0.65 0.12 85 / 0.25))"
              : place === 2
                ? "linear-gradient(135deg, oklch(0.78 0.02 250 / 0.35), oklch(0.55 0.02 250 / 0.25))"
                : "linear-gradient(135deg, oklch(0.58 0.09 55 / 0.40), oklch(0.42 0.07 55 / 0.30))"
          }`,
        }}
      >
        <Icon className={`${place === 1 ? "h-7 w-7" : "h-5 w-5"} ${tierConfig.color}`} />
      </div>

      <p className={`${place === 1 ? "text-sm" : "text-xs"} font-semibold text-foreground truncate max-w-full`}>
        {isMe ? "You" : player.name}
      </p>

      <div className={`mt-1.5 inline-flex items-center gap-1 ${place === 1 ? "text-base" : "text-sm"} font-bold tabular-nums font-display ${style.label}`}>
        <Ticket className={place === 1 ? "h-4 w-4" : "h-3 w-3"} />
        {player.entries}
      </div>

      <span className={`mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.medalBg} ${style.medalText}`}>
        {placeLabel}
      </span>
    </div>
  );
}

// ── The Chase (ranks 4–10) ────────────────────────────────────────────
function ChaseList({
  players,
  startRank,
  meId,
  top3Lowest,
}: {
  players: LeaderboardPlayer[];
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
        const gapToPodium = top3Lowest !== null ? top3Lowest - p.entries + 1 : 0;
        const hint = isFirstBelowPodium && gapToPodium > 0
          ? `+${gapToPodium} to podium`
          : null;

        return (
          <div
            key={p.id}
            className={`animate-in fade-in-0 duration-300 ${isMe ? "border-l-2 border-l-primary bg-primary/[0.04]" : ""}`}
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <ChaseRow rank={rank} player={p} isMe={isMe} hint={hint} />
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
  player: LeaderboardPlayer;
  isMe: boolean;
  hint: string | null;
}) {
  const tier = asTier(player.rankTier);
  const tierConfig = RANK_CONFIG[tier];
  const Icon = tierConfig.icon;

  return (
    <div className="px-3 py-2.5 flex items-center gap-3">
      <span
        className={`text-sm font-bold tabular-nums w-6 text-center ${
          isMe ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {rank}
      </span>
      <div
        className={`h-8 w-8 rounded-full ${tierConfig.bgColor} flex items-center justify-center shrink-0`}
      >
        <Icon className={`h-4 w-4 ${tierConfig.color}`} />
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
        {hint && (
          <p className="text-[10px] text-coin font-medium leading-tight mt-0.5">
            {hint}
          </p>
        )}
      </div>
      <div className="inline-flex items-center gap-1 text-sm font-bold tabular-nums text-foreground">
        <Ticket className="h-3.5 w-3.5 text-muted-foreground" />
        {player.entries}
      </div>
    </div>
  );
}

// ── Your standing card ────────────────────────────────────────────────
function YourStandingCard({
  rank,
  entries,
  totalPlayers,
  players,
}: {
  rank: number;
  entries: number;
  totalPlayers: number;
  players: LeaderboardPlayer[];
}) {
  // Gap to next rank up (the player one position above me)
  let gapUp: { entries: number; targetRank: number } | null = null;
  if (rank > 1) {
    const above = players[rank - 2]; // 0-indexed: rank-1 is me, rank-2 is above
    if (above) {
      gapUp = { entries: Math.max(0, above.entries - entries + 1), targetRank: rank - 1 };
    } else if (players.length > 0) {
      // I'm outside the top list — target the lowest visible rank
      const lowest = players[players.length - 1];
      gapUp = { entries: Math.max(0, lowest.entries - entries + 1), targetRank: players.length };
    }
  }

  // Top-10 safety
  const inTop10 = rank <= 10;
  let safetyMsg: { text: string; tone: "safe" | "push" } = inTop10
    ? { text: "Safe in top 10", tone: "safe" }
    : { text: `${rank - 10} ranks below top 10`, tone: "push" };

  if (inTop10 && rank === 10 && players[9]) {
    safetyMsg = { text: "Hold rank 10 to lock top 10", tone: "push" };
  }

  // Progress to next rank up — visualised as fraction of "above's entries"
  const aboveEntries = rank > 1 && players[rank - 2] ? players[rank - 2].entries : entries;
  const pct = aboveEntries > 0 ? Math.min(100, (entries / aboveEntries) * 100) : 100;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-surface-1 to-surface-1 border border-primary/30 shadow-glow p-4 space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">Your standing</p>
          <p className="text-2xl font-bold font-display tabular-nums text-foreground mt-1">
            #{rank}
            <span className="text-sm font-medium text-muted-foreground ml-1">
              of {totalPlayers}
            </span>
          </p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1 text-lg font-bold tabular-nums font-display text-primary">
            <Ticket className="h-4 w-4" />
            {entries}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">tickets</p>
        </div>
      </div>

      {gapUp && gapUp.entries > 0 && (
        <>
          <div className="h-1.5 w-full rounded-full bg-border/60 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            <span className="text-foreground font-semibold">+{gapUp.entries}</span> to reach rank #{gapUp.targetRank}
            {" · "}
            <span className={safetyMsg.tone === "safe" ? "text-primary" : "text-coin"}>
              {safetyMsg.text}
            </span>
          </p>
        </>
      )}

      {(!gapUp || gapUp.entries === 0) && (
        <p className="text-[11px] text-primary font-semibold">
          {rank === 1 ? "👑 You're #1 — defend the throne." : safetyMsg.text}
        </p>
      )}
    </div>
  );
}
