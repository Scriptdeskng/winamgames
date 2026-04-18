import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAllowScroll } from "@/hooks/useAllowScroll";

export const Route = createFileRoute("/_authed/leaderboard")({
  component: LeaderboardPage,
  head: () => ({
    meta: [
      { title: "Leaderboard — WinamGames" },
      { name: "description", content: "See the top players on WinamGames." },
    ],
  }),
});

const mockLeaderboard = [
  { rank: 1, name: "ChessKing", entries: 48, trend: "up" as const },
  { rank: 2, name: "ProverbMaster", entries: 42, trend: "up" as const },
  { rank: 3, name: "NaijaWiz", entries: 38, trend: "same" as const },
  { rank: 4, name: "PuzzlePro", entries: 35, trend: "down" as const },
  { rank: 5, name: "WisdomSeeker", entries: 32, trend: "up" as const },
  { rank: 6, name: "MoveKing", entries: 30, trend: "same" as const },
  { rank: 7, name: "BrainStorm", entries: 28, trend: "down" as const },
  { rank: 8, name: "QuickSolve", entries: 25, trend: "up" as const },
  { rank: 9, name: "ProverbKing", entries: 22, trend: "same" as const },
  { rank: 10, name: "CheckPro", entries: 20, trend: "up" as const },
];

function TrendIcon({ trend }: { trend: "up" | "down" | "same" }) {
  if (trend === "up") return <TrendingUp className="h-3 w-3 text-success" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3 text-destructive" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

function LeaderboardPage() {
  useAllowScroll();
  return (
    <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background">
      <TopBar backTo="/" title="Leaderboard" />
      <div className="px-4 pb-6 space-y-5">
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Today</button>
          <button className="px-4 py-2 rounded-lg bg-surface-1 text-muted-foreground text-sm font-medium">All Time</button>
        </div>

        <div className="space-y-2">
          {mockLeaderboard.map((player) => (
            <div key={player.rank} className="rounded-xl bg-surface-1 border border-border p-3 flex items-center gap-3">
              <span className={`text-sm font-bold tabular-nums w-6 text-center ${player.rank <= 3 ? "text-gold" : "text-muted-foreground"}`}>
                {player.rank}
              </span>
              <div className="h-8 w-8 rounded-full bg-surface-2 flex items-center justify-center text-xs font-bold text-primary">
                {player.name[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{player.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <TrendIcon trend={player.trend} />
                <span className="text-sm font-bold tabular-nums text-primary">{player.entries}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
