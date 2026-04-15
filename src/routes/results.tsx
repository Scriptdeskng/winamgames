import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, Coins, Flame, Target } from "lucide-react";

export const Route = createFileRoute("/results")({
  component: ResultsPage,
  head: () => ({
    meta: [{ title: "Session Results — WinamGames" }],
  }),
});

function ResultsPage() {
  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background flex flex-col items-center justify-center px-6">
      <h1 className="text-2xl font-bold mb-6">Session Complete!</h1>
      <div className="w-full space-y-3">
        {[
          { icon: Trophy, label: "Entries earned", value: "+3", color: "text-primary" },
          { icon: Coins, label: "Coins earned", value: "+50", color: "text-coin" },
          { icon: Flame, label: "Streak day", value: "Day 5", color: "text-streak" },
          { icon: Target, label: "Weekly total", value: "15 / 50", color: "text-primary" },
        ].map((item, i) => (
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
