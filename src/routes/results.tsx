import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Trophy, Coins, Flame, Target, Sparkles } from "lucide-react";

const resultsSearchSchema = z.object({
  entries: fallback(z.number(), 0).default(0),
  coins: fallback(z.number(), 0).default(0),
  xp: fallback(z.number(), 0).default(0),
  streak: fallback(z.number(), 0).default(0),
  weekTotal: fallback(z.number(), 0).default(0),
  weekCap: fallback(z.number(), 50).default(50),
});

export const Route = createFileRoute("/results")({
  component: ResultsPage,
  validateSearch: zodValidator(resultsSearchSchema),
  head: () => ({
    meta: [{ title: "Session Results — WinamGames" }],
  }),
});

function ResultsPage() {
  const { entries, coins, xp, streak, weekTotal, weekCap } = Route.useSearch();

  const stats = [
    { icon: Trophy, label: "Entries earned", value: `+${entries}`, color: "text-primary" },
    { icon: Coins, label: "Coins earned", value: `+${coins}`, color: "text-coin" },
    { icon: Sparkles, label: "XP gained", value: `+${xp}`, color: "text-xp" },
    { icon: Flame, label: "Streak day", value: `Day ${streak}`, color: "text-streak" },
    { icon: Target, label: "Weekly total", value: `${weekTotal} / ${weekCap}`, color: "text-primary" },
  ];

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background flex flex-col items-center justify-center px-6">
      <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
        <Trophy className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold mb-6">Session Complete!</h1>

      <div className="w-full space-y-3">
        {stats.map((item, i) => (
          <div key={i} className="rounded-xl bg-surface-1 border border-glass-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <item.icon className={`h-5 w-5 ${item.color}`} />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
            <span className={`text-lg font-bold tabular-nums ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>

      <Link
        to="/"
        className="mt-8 w-full h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center hover:bg-primary/90 transition-all shadow-glow"
      >
        Back to Home
      </Link>
    </div>
  );
}
