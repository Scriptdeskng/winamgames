import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Trophy, Coins, Flame, Target, Sparkles, Check, ArrowUp, Ticket } from "lucide-react";
import { RankBadge } from "@/components/profile/RankBadge";
import type { RankTier } from "@/components/profile/RankBadge";
import { TopBar } from "@/components/layout/TopBar";
import { useAllowScroll } from "@/hooks/useAllowScroll";

const resultsSearchSchema = z.object({
  entries: fallback(z.number(), 0).default(0),
  coins: fallback(z.number(), 0).default(0),
  xp: fallback(z.number(), 0).default(0),
  streak: fallback(z.number(), 0).default(0),
  weekTotal: fallback(z.number(), 0).default(0),
  weekCap: fallback(z.number(), 50).default(50),
  rankTier: fallback(z.string(), "starter").default("starter"),
  previousRank: fallback(z.string(), "starter").default("starter"),
  missions: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/_authed/results")({
  component: ResultsPage,
  validateSearch: zodValidator(resultsSearchSchema),
  head: () => ({
    meta: [{ title: "Session Results — WinamGames" }],
  }),
});

function pluralizeEntries(n: number) {
  return `${n} ${n === 1 ? "entry" : "entries"}`;
}

function ResultsPage() {
  useAllowScroll();
  const { entries, coins, xp, streak, weekTotal, weekCap, rankTier, previousRank, missions } = Route.useSearch();

  const rankedUp = rankTier !== previousRank;

  // Parse missions: "title1|amount1;;title2|amount2" (entries-only)
  const completedMissions = missions
    ? missions.split(";;").filter(Boolean).map((m: string) => {
        const [title, rewardAmount] = m.split("|");
        return { title, rewardAmount: parseInt(rewardAmount) || 0 };
      })
    : [];

  const stats = [
    { icon: Trophy, label: "Entries earned", value: `+${entries}`, color: "text-primary" },
    { icon: Coins, label: "Coins earned", value: `+${coins}`, color: "text-coin" },
    { icon: Sparkles, label: "XP gained", value: `+${xp}`, color: "text-xp" },
    { icon: Flame, label: "Streak day", value: `Day ${streak}`, color: "text-streak" },
    { icon: Target, label: "Weekly total", value: `${weekTotal} / ${weekCap}`, color: "text-primary" },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background flex flex-col">
      <TopBar backTo="/" />
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
      <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
        <Trophy className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold mb-6">Session Complete!</h1>

      {/* Rank up notification */}
      {rankedUp && (
        <div className="w-full mb-4 rounded-xl bg-xp/10 border border-xp/20 p-4 flex items-center gap-3">
          <ArrowUp className="h-5 w-5 text-xp" />
          <div>
            <p className="text-sm font-semibold text-xp">Rank Up!</p>
            <div className="flex items-center gap-2 mt-1">
              <RankBadge tier={previousRank as RankTier} />
              <span className="text-muted-foreground">→</span>
              <RankBadge tier={rankTier as RankTier} />
            </div>
          </div>
        </div>
      )}

      <div className="w-full space-y-3">
        {stats.map((item, i) => (
          <div key={i} className="rounded-xl bg-surface-1 border border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <item.icon className={`h-5 w-5 ${item.color}`} />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
            <span className={`text-lg font-bold tabular-nums ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Completed missions */}
      {completedMissions.length > 0 && (
        <div className="w-full mt-4 space-y-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Missions Completed</h2>
          {completedMissions.map((m, i) => (
            <div key={i} className="rounded-xl bg-success/10 border border-success/20 p-3 flex items-center gap-3">
              <Check className="h-4 w-4 text-success" />
              <div className="flex-1">
                <p className="text-sm font-medium">{m.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Ticket className="h-3 w-3" /> +{pluralizeEntries(m.rewardAmount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        to="/"
        className="mt-8 w-full h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center hover:bg-primary/90 transition-all shadow-glow"
      >
        Back to Home
      </Link>
      </div>
    </div>
  );
}
