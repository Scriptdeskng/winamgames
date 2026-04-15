import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav } from "@/components/layout/BottomNav";
import { User, Coins, Flame, Trophy, Star, ChevronRight, Ticket, Award } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "Profile — WinamGames" },
    ],
  }),
});

const RANKS = ["Pawn", "Knight", "Bishop", "Rook", "Queen", "King"];

function ProfilePage() {
  const rank = "Knight";
  const xp = 450;
  const nextRankXp = 1000;
  const xpProgress = (xp / nextRankXp) * 100;

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background">
      <div className="px-4 pt-6 pb-24 space-y-5">
        <h1 className="text-xl font-bold">Profile</h1>

        {/* Avatar & Name */}
        <div className="rounded-2xl bg-glass border border-glass-border p-5 flex items-center gap-4 shadow-card">
          <div className="h-16 w-16 rounded-2xl bg-surface-2 flex items-center justify-center border border-glass-border">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">NaijaChamp</h2>
            <p className="text-sm text-muted-foreground">****5678</p>
          </div>
        </div>

        {/* Rank & XP */}
        <div className="rounded-2xl bg-surface-1 border border-glass-border p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-xp" />
              <span className="text-sm font-semibold">{rank}</span>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">{xp} / {nextRankXp} XP</span>
          </div>
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full rounded-full bg-xp transition-all" style={{ width: `${xpProgress}%` }} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Coins, label: "Coins", value: "1,250", color: "text-coin" },
            { icon: Flame, label: "Streak", value: "5 days", color: "text-streak" },
            { icon: Trophy, label: "Entries", value: "12", color: "text-primary" },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl bg-surface-1 border border-glass-border p-3 text-center">
              <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-lg font-bold tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Links */}
        <div className="space-y-2">
          {[
            { to: "/entries", icon: Ticket, label: "My Entries" },
            { to: "/winners", icon: Award, label: "Winners" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-xl bg-surface-1 border border-glass-border p-3 flex items-center justify-between hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
