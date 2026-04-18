import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Trophy, ArrowUp } from "lucide-react";
import { RankBadge } from "@/components/profile/RankBadge";
import type { RankTier } from "@/components/profile/RankBadge";
import { TopBar } from "@/components/layout/TopBar";
import { Progress } from "@/components/ui/progress";
import { useAllowScroll } from "@/hooks/useAllowScroll";

const resultsSearchSchema = z.object({
  entries: fallback(z.number(), 0).default(0),
  baseEntries: fallback(z.number(), 0).default(0),
  coins: fallback(z.number(), 0).default(0),
  xp: fallback(z.number(), 0).default(0),
  streak: fallback(z.number(), 0).default(0),
  weekTotal: fallback(z.number(), 0).default(0),
  weekCap: fallback(z.number(), 50).default(50),
  rankTier: fallback(z.string(), "starter").default("starter"),
  previousRank: fallback(z.string(), "starter").default("starter"),
  missions: fallback(z.string(), "").default(""),
  puzzlesSolved: fallback(z.number(), 0).default(0),
  gameType: fallback(z.enum(["checkmate", "wisdomdrop"]), "checkmate").default("checkmate"),
});

export const Route = createFileRoute("/_authed/results")({
  component: ResultsPage,
  validateSearch: zodValidator(resultsSearchSchema),
  head: () => ({
    meta: [{ title: "Session Results — WinamGames" }],
  }),
});

function streakBonusFor(streak: number): number {
  if (streak >= 14) return 3;
  if (streak >= 7) return 2;
  if (streak >= 3) return 1;
  return 0;
}

function ResultsPage() {
  useAllowScroll();
  const navigate = useNavigate();
  const {
    entries,
    baseEntries,
    streak,
    weekTotal,
    weekCap,
    rankTier,
    previousRank,
    missions,
    puzzlesSolved,
    gameType,
  } = Route.useSearch();

  const rankedUp = rankTier !== previousRank;

  // Parse missions: "title1|amount1;;title2|amount2"
  const completedMissions = missions
    ? missions.split(";;").filter(Boolean).map((m: string) => {
        const [title, rewardAmount] = m.split("|");
        return { title, rewardAmount: parseInt(rewardAmount) || 0 };
      })
    : [];

  const missionEntries = completedMissions.reduce((sum: number, m: { rewardAmount: number }) => sum + m.rewardAmount, 0);
  const streakBonusEntries = Math.max(0, entries - baseEntries - missionEntries);

  // Build breakdown chips
  const breakdownParts: string[] = [];
  if (baseEntries > 0) breakdownParts.push(`Base ${baseEntries}`);
  if (streakBonusEntries > 0) breakdownParts.push(`Streak bonus +${streakBonusEntries}`);
  if (missionEntries > 0) breakdownParts.push(`Mission +${missionEntries}`);

  // Next session nudge
  let nudge = "";
  const remainder = puzzlesSolved % 5;
  if (puzzlesSolved === 0) {
    nudge = "Solve 5 puzzles next session for an entry";
  } else if (remainder === 0) {
    nudge = "Great session — play again to keep earning";
  } else {
    const need = 5 - remainder;
    nudge = `Solve ${need} more puzzle${need === 1 ? "" : "s"} next session for another entry`;
  }

  const weekPct = weekCap > 0 ? Math.min(100, (weekTotal / weekCap) * 100) : 0;

  const handlePlayAgain = () => {
    navigate({ to: gameType === "checkmate" ? "/checkmate" : "/wisdomdrop" });
  };

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background flex flex-col">
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

        {/* Unified session card */}
        <div className="w-full rounded-2xl bg-surface-1 border border-border p-6">
          {/* Hero */}
          <div className="text-center">
            {entries > 0 ? (
              <>
                <p className="text-4xl font-bold tabular-nums text-primary">
                  +{entries} {entries === 1 ? "entry" : "entries"}
                </p>
                {breakdownParts.length > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {breakdownParts.join("  ·  ")}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-xl font-semibold">No entries this session</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Solve 5 puzzles in a session to earn your first entry
                </p>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="my-5 h-px bg-border/60" />

          {/* Weekly progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Entries this week</span>
              <span className="text-sm font-semibold tabular-nums">
                {weekTotal} / {weekCap}
              </span>
            </div>
            <Progress value={weekPct} />
          </div>

          {/* Nudge */}
          <p className="mt-5 text-center text-xs text-muted-foreground">{nudge}</p>
        </div>

        {/* Buttons */}
        <button
          onClick={handlePlayAgain}
          className="mt-8 w-full h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center hover:bg-primary/90 transition-all shadow-glow"
        >
          Play again
        </button>
        <Link
          to="/"
          className="mt-3 w-full h-14 rounded-xl bg-surface-1 border border-border text-foreground font-semibold text-base flex items-center justify-center hover:bg-surface-2 transition-all"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
