import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav } from "@/components/layout/BottomNav";
import { Timer, Flame, Trophy, ChevronRight, Swords, BookOpen } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background">
      <div className="px-4 pt-6 pb-24 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="text-xl font-bold text-foreground">WinamGames</h1>
          </div>
          <Link
            to="/profile"
            className="h-10 w-10 rounded-full bg-surface-2 flex items-center justify-center border border-glass-border"
          >
            <span className="text-sm font-bold text-primary">W</span>
          </Link>
        </div>

        {/* Draw Countdown */}
        <div className="rounded-2xl bg-glass border border-glass-border p-4 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Weekly Draw</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold tabular-nums text-foreground">4d 12h 30m</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Your entries</p>
              <p className="text-lg font-bold tabular-nums text-primary">12 / 50</p>
            </div>
            <Link
              to="/entries"
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Streak */}
        <div className="rounded-2xl bg-surface-1 border border-glass-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-streak/15 flex items-center justify-center">
              <Flame className="h-5 w-5 text-streak" />
            </div>
            <div>
              <p className="text-sm font-semibold">5 Day Streak</p>
              <p className="text-xs text-muted-foreground">+1 bonus entry</p>
            </div>
          </div>
          <span className="text-2xl">🔥</span>
        </div>

        {/* Games */}
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

        {/* Missions */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Daily Missions</h2>
          <div className="space-y-2">
            {[
              { title: "Solve 5 puzzles", reward: "10 coins", progress: "3/5" },
              { title: "Play both games", reward: "+1 entry", progress: "1/2" },
              { title: "No hints session", reward: "25 coins", progress: "0/1" },
            ].map((mission, i) => (
              <div key={i} className="rounded-xl bg-surface-1 border border-glass-border p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{mission.title}</p>
                  <p className="text-xs text-muted-foreground">{mission.reward}</p>
                </div>
                <span className="text-xs font-medium tabular-nums text-primary">{mission.progress}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard teaser */}
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
            {[
              { rank: 1, name: "ChessKing", entries: 48 },
              { rank: 2, name: "ProverbMaster", entries: 42 },
              { rank: 3, name: "NaijaWiz", entries: 38 },
            ].map((player) => (
              <div key={player.rank} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold tabular-nums text-muted-foreground w-4">{player.rank}</span>
                  <span className="text-sm font-medium">{player.name}</span>
                </div>
                <span className="text-xs font-medium tabular-nums text-primary">{player.entries} entries</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
