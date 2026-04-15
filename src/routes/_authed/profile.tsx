import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { TopBar } from "@/components/layout/TopBar";
import { User, Coins, Flame, Trophy, ChevronRight, Ticket, Award, LogOut } from "lucide-react";
import { XpProgressBar, RankBadge } from "@/components/profile/RankBadge";
import { getPlayerData } from "@/utils/mission.functions";
import { getSession, clearSession } from "@/lib/session";
import type { RankTier } from "@/components/profile/RankBadge";
import React from "react";

export const Route = createFileRoute("/_authed/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [{ title: "Profile — WinamGames" }],
  }),
  loader: async () => null,
});

function ProfilePage() {
  const navigate = useNavigate();
  const session = getSession();
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    if (!session) return;
    getPlayerData({ data: { playerId: session.playerId } }).then(setData);
  }, []);

  const player = data?.success ? data.player : null;
  const weekTotal = data?.success ? data.weekTotal : 0;

  const handleLogout = () => {
    clearSession();
    navigate({ to: "/login" });
  };

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background">
      <TopBar backTo="/" />
      <div className="px-4 pb-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Profile</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        <div className="rounded-2xl bg-glass border border-glass-border p-5 flex items-center gap-4 shadow-card">
          <div className="h-16 w-16 rounded-2xl bg-surface-2 flex items-center justify-center border border-glass-border">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{player?.nickname ?? session?.nickname ?? "Player"}</h2>
            <p className="text-sm text-muted-foreground">****{player?.msisdnLast4 ?? session?.msisdnLast4 ?? "0000"}</p>
          </div>
        </div>

        <XpProgressBar
          xp={player?.xpTotal ?? 0}
          tier={(player?.rankTier as RankTier) ?? "pawn"}
        />

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Coins, label: "Coins", value: player?.coinBalance?.toLocaleString() ?? "0", color: "text-coin" },
            { icon: Flame, label: "Streak", value: `${player?.currentStreak ?? 0}d`, color: "text-streak" },
            { icon: Trophy, label: "Entries", value: `${weekTotal}`, color: "text-primary" },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl bg-surface-1 border border-glass-border p-3 text-center">
              <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-lg font-bold tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {[
            { to: "/entries" as const, icon: Ticket, label: "My Entries" },
            { to: "/winners" as const, icon: Award, label: "Winners" },
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
    </div>
  );
}
