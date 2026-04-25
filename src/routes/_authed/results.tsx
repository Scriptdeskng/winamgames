import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Trophy, ArrowUp, Flame } from "lucide-react";
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

  // Streak pill copy
  let streakPill: string | null = null;
  if (streak >= 14) streakPill = `Day ${streak} streak — +3 bonus tickets per round`;
  else if (streak >= 7) streakPill = `Day ${streak} streak — +2 bonus tickets per round`;
  else if (streak >= 3) streakPill = `Day ${streak} streak — +1 bonus ticket per round`;
  else if (streak >= 1) streakPill = `Day ${streak} streak — reach day 3 for +1 bonus ticket per round`;

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
  if (baseEntries > 0) breakdownParts.push(`Solved ${puzzlesSolved} puzzles +${baseEntries}`);
  if (streakBonusEntries > 0) breakdownParts.push(`Day ${streak} streak +${streakBonusEntries}`);
  if (missionEntries > 0) breakdownParts.push(`Mission bonus +${missionEntries}`);

  const puzzlesSolvedLabel =
    puzzlesSolved === 0
      ? "No puzzles solved"
      : `${puzzlesSolved} puzzle${puzzlesSolved === 1 ? "" : "s"} solved`;

  // Next round nudge
  let nudge = "";
  const remainder = puzzlesSolved % 5;
  if (remainder > 0) {
    const need = 5 - remainder;
    nudge = `${need} more puzzle${need === 1 ? "" : "s"} this round would have earned another ticket`;
  }

  const weekPct = weekCap > 0 ? Math.min(100, (weekTotal / weekCap) * 100) : 0;

  const handlePlayAgain = () => {
    navigate({ to: gameType === "checkmate" ? "/checkmate" : "/wisdomdrop" });
  };

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background flex flex-col">
      <TopBar backTo="/app" title="Results" />
      <div className="flex-1 flex flex-col justify-center px-6 pb-8 pt-8">
        {/* Rank up notification — discrete event, kept as bordered chip above hero */}
        {rankedUp && (
          <div className="w-full mb-6 rounded-xl bg-xp/10 border border-xp/20 p-3 flex items-center gap-3">
            <ArrowUp className="h-4 w-4 text-xp shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-xp">Rank Up!</p>
              <div className="flex items-center gap-2 mt-1">
                <RankBadge tier={previousRank as RankTier} />
                <span className="text-muted-foreground text-xs">→</span>
                <RankBadge tier={rankTier as RankTier} />
              </div>
            </div>
          </div>
        )}

        {/* Hero block */}
        <div className="flex flex-col items-center text-center">
          <Trophy className="mb-5 h-12 w-12 text-primary" />

          <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-muted-foreground">
            Round Complete
          </p>

          <p className="mt-3 text-4xl font-bold leading-tight text-foreground">{puzzlesSolvedLabel}</p>

          {entries > 0 ? (
            <>
              <p className="mt-3 text-2xl font-bold tabular-nums text-primary">
                +{entries}
                <span className="ml-2 text-lg font-semibold align-baseline">
                  {entries === 1 ? "ticket" : "tickets"} earned
                </span>
              </p>
              {breakdownParts.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground/70">
                  {breakdownParts.join("  ·  ")}
                </p>
              )}
            </>
          ) : null}
        </div>

        {/* Hairline divider */}
        <div className="mt-8 h-px w-full bg-border/40" />

        {/* Weekly progress */}
        <div className="my-6 rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-baseline justify-center">
            <p className="text-lg font-semibold text-foreground">
              <span className="text-2xl font-bold tabular-nums text-primary">{weekTotal}</span>
              <span className="text-muted-foreground"> of {weekCap} tickets this week</span>
            </p>
          </div>
          <Progress value={weekPct} />
          {nudge && <p className="mt-3 text-xs text-muted-foreground text-center">{nudge}</p>}

          {streakPill && (
            <div className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full bg-streak/10 border border-streak/20 px-3 py-1.5">
              <Flame className="h-3.5 w-3.5 text-streak" />
              <span className="text-xs font-medium text-streak">{streakPill}</span>
            </div>
          )}
        </div>

        {/* CTAs anchored to bottom */}
        <div className="mt-8">
          <button
            onClick={handlePlayAgain}
            className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center hover:bg-primary/90 transition-all shadow-glow"
          >
            Play again
          </button>
          <Link
            to="/app"
            className="mt-4 w-full h-10 text-muted-foreground font-semibold text-sm flex items-center justify-center hover:text-foreground transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
