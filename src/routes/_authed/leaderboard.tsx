import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Crown, Ticket, Trophy, Info } from "lucide-react";
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
  weekStartWat: string | null;
  weekEndWat: string | null;
  drawExecutesAt: string | null;
  currentPlayer: (LeaderboardPlayer & { rank: number }) | null;
}

function formatWeekRange(startWat: string | null, endWat: string | null): string {
  if (!startWat || !endWat) return "Current week";
  const start = new Date(`${startWat}T00:00:00`);
  const end = new Date(`${endWat}T00:00:00`);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function asTier(tier: string): RankTier {
  return (tier in RANK_CONFIG ? tier : "starter") as RankTier;
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
          weekStartWat: res.weekStartWat,
          weekEndWat: res.weekEndWat,
          drawExecutesAt: res.drawExecutesAt,
          currentPlayer: res.currentPlayer,
        });
      } else {
        setData({
          players: [],
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

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background">
      <TopBar backTo="/app" title="Leaderboard" />
      <div className="px-4 pb-8 space-y-5">
        <HeroStrip
          startWat={data.weekStartWat}
          endWat={data.weekEndWat}
        />

        {data.players.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4 animate-in fade-in-0 duration-300">
            {showPodium && <Podium top3={top3} meId={meId} />}

            {(showPodium ? rest : data.players).length > 0 && (
              <div className="space-y-2">
                {(showPodium ? rest : data.players).map((p, i) => {
                  const rank = (showPodium ? 4 : 1) + i;
                  return (
                    <PlayerRow
                      key={p.id}
                      rank={rank}
                      player={p}
                      isMe={p.id === meId}
                    />
                  );
                })}
              </div>
            )}

            {data.currentPlayer && (
              <div className="pt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  Your Position
                </p>
                <PlayerRow
                  rank={data.currentPlayer.rank}
                  player={data.currentPlayer}
                  isMe
                />
              </div>
            )}
          </div>
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

function HeroStrip({ startWat, endWat }: { startWat: string | null; endWat: string | null }) {
  return (
    <div className="rounded-2xl bg-surface-1 border border-border shadow-card p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center shrink-0">
        <Trophy className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">This Week</p>
        <p className="text-xs text-muted-foreground truncate">
          {formatWeekRange(startWat, endWat)} · ends Sun 8pm WAT
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-surface-1 border border-border shadow-card p-6 text-center space-y-3">
      <div className="h-12 w-12 rounded-2xl bg-primary/10 ring-1 ring-primary/20 mx-auto flex items-center justify-center">
        <Trophy className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">No tickets earned yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Be the first on the board this week.
        </p>
      </div>
      <Link
        to="/app"
        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Play now
      </Link>
    </div>
  );
}

function Podium({
  top3,
  meId,
}: {
  top3: LeaderboardPlayer[];
  meId: string | undefined;
}) {
  const [first, second, third] = top3;
  return (
    <div className="grid grid-cols-3 gap-2 items-end">
      <PodiumPillar player={second} place={2} meId={meId} />
      <PodiumPillar player={first} place={1} meId={meId} />
      <PodiumPillar player={third} place={3} meId={meId} />
    </div>
  );
}

const PODIUM_STYLES: Record<
  1 | 2 | 3,
  { ring: string; bg: string; label: string; height: string; avatar: string; glow: boolean }
> = {
  1: {
    ring: "ring-2 ring-coin/40",
    bg: "bg-coin/10",
    label: "text-coin",
    height: "pt-4 pb-5",
    avatar: "h-16 w-16",
    glow: true,
  },
  2: {
    ring: "ring-1 ring-[oklch(0.75_0.01_250)]/40",
    bg: "bg-[oklch(0.75_0.01_250)]/10",
    label: "text-[oklch(0.85_0.01_250)]",
    height: "pt-3 pb-4",
    avatar: "h-12 w-12",
    glow: false,
  },
  3: {
    ring: "ring-1 ring-[oklch(0.55_0.08_55)]/50",
    bg: "bg-[oklch(0.55_0.08_55)]/10",
    label: "text-[oklch(0.75_0.10_55)]",
    height: "pt-3 pb-4",
    avatar: "h-12 w-12",
    glow: false,
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

  return (
    <div
      className={`relative rounded-2xl ${style.bg} ${style.ring} ${style.height} px-2 flex flex-col items-center text-center ${
        style.glow ? "shadow-glow" : "shadow-card"
      } ${isMe ? "outline outline-2 outline-primary/60 outline-offset-2" : ""}`}
    >
      {place === 1 && (
        <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 h-5 w-5 text-coin drop-shadow-md" />
      )}
      <div
        className={`${style.avatar} rounded-full ${tierConfig.bgColor} flex items-center justify-center mb-2`}
      >
        <Icon className={`h-6 w-6 ${tierConfig.color}`} />
      </div>
      <p className="text-xs font-semibold text-foreground truncate max-w-full px-1">
        {isMe ? "You" : player.name}
      </p>
      <div className={`mt-1.5 inline-flex items-center gap-1 text-xs font-bold tabular-nums ${style.label}`}>
        <Ticket className="h-3 w-3" />
        {player.entries}
      </div>
      <span className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${style.label}`}>
        {place === 1 ? "1st" : place === 2 ? "2nd" : "3rd"}
      </span>
    </div>
  );
}

function PlayerRow({
  rank,
  player,
  isMe,
}: {
  rank: number;
  player: LeaderboardPlayer;
  isMe: boolean;
}) {
  const tier = asTier(player.rankTier);
  const tierConfig = RANK_CONFIG[tier];
  const Icon = tierConfig.icon;

  return (
    <div
      className={`rounded-xl border p-3 flex items-center gap-3 transition-colors ${
        isMe
          ? "bg-primary/5 border-primary/40 shadow-glow"
          : "bg-surface-1 border-border shadow-card"
      }`}
    >
      <span
        className={`text-sm font-bold tabular-nums w-7 text-center ${
          isMe ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {rank}
      </span>
      <div
        className={`h-9 w-9 rounded-lg ${tierConfig.bgColor} flex items-center justify-center shrink-0`}
      >
        <Icon className={`h-4 w-4 ${tierConfig.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {isMe ? "You" : player.name}
        </p>
        <p className={`text-[11px] ${tierConfig.color} font-medium`}>
          {tierConfig.label}
        </p>
      </div>
      {isMe && (
        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary">
          You
        </span>
      )}
      <div className="inline-flex items-center gap-1 text-sm font-bold tabular-nums text-primary">
        <Ticket className="h-3.5 w-3.5" />
        {player.entries}
      </div>
    </div>
  );
}
