"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowUp, Flame, Trophy } from "lucide-react";
import { RankBadge } from "@/components/profile/RankBadge";
import type { RankTier } from "@/components/profile/RankBadge";
import { Progress } from "@/components/ui/progress";
import ProverbReviewModal from "@/components/games/ProverbReviewModal";

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const entries = Number(searchParams.get("entries") ?? 0);
  const baseEntries = Number(searchParams.get("baseEntries") ?? 0);
  const streakBonus = Number(searchParams.get("streakBonus") ?? 0);
  const streak = Number(searchParams.get("streak") ?? 0);
  const weekTotal = Number(searchParams.get("weekTotal") ?? 0);
  const weekCap = Number(searchParams.get("weekCap") ?? 50);
  const rankTier = (searchParams.get("rankTier") ?? "starter") as RankTier;
  const previousRank = (searchParams.get("previousRank") ?? "starter") as RankTier;
  const missions = searchParams.get("missions") ?? "";
  const puzzlesSolved = Number(searchParams.get("puzzlesSolved") ?? 0);
  const gameType = searchParams.get("gameType") ?? "checkmate";

  const rankedUp = rankTier !== previousRank;

  const completedMissions = missions
    ? missions.split(";;").filter(Boolean).map((m: string) => {
        const [title, rewardAmount] = m.split("|");
        return { title, rewardAmount: parseInt(rewardAmount) || 0 };
      })
    : [];

  const missionEntries = completedMissions.reduce((sum: number, m: { rewardAmount: number }) => sum + m.rewardAmount, 0);

  const breakdownParts: string[] = [];
  if (baseEntries > 0) breakdownParts.push(`Puzzles +${baseEntries}`);
  if (streakBonus > 0) breakdownParts.push(`Streak +${streakBonus}`);
  if (missionEntries > 0) breakdownParts.push(`Missions +${missionEntries}`);

  const puzzlesSolvedLabel =
    puzzlesSolved === 0
      ? "No puzzles solved"
      : `${puzzlesSolved} puzzle${puzzlesSolved === 1 ? "" : "s"} solved`;

  let nudge = "";
  const remainder = puzzlesSolved % 5;
  if (remainder > 0) {
    const need = 5 - remainder;
    nudge = `${need} more puzzle${need === 1 ? "" : "s"} this round would have earned another ticket`;
  }

  let streakPill: string | null = null;
  if (streak >= 14) streakPill = `Day ${streak} streak — +3 bonus tickets per round`;
  else if (streak >= 7) streakPill = `Day ${streak} streak — +2 bonus tickets per round`;
  else if (streak >= 3) streakPill = `Day ${streak} streak — +1 bonus ticket per round`;
  else if (streak >= 1) streakPill = `Day ${streak} streak — reach day 3 for +1 bonus ticket per round`;

  const weekPct = weekCap > 0 ? Math.min(100, (weekTotal / weekCap) * 100) : 0;

  const [proverbs, setProverbs] = useState<Array<{
    displayText: string;
    blank: string;
    originalProverb: string;
    region: string;
    explanation: string | null;
  }>>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("winam_proverb_review");
      if (raw) {
        setProverbs(JSON.parse(raw));
        sessionStorage.removeItem("winam_proverb_review");
      }
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  const handlePlayAgain = () => {
    router.push(gameType === "checkmate" ? "/checkmate" : "/wisdomdrop");
  };

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background flex flex-col">
      <div className="flex items-center h-14 px-4 relative">
        <button
          type="button"
          onClick={() => router.push("/app")}
          className="absolute left-4 h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/40 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <p className="w-full text-center text-base font-semibold text-foreground">Results</p>
      </div>
      <div className="flex-1 flex flex-col justify-center px-6 pb-8 pt-8">

        {rankedUp && (
          <div className="w-full mb-6 rounded-xl bg-xp/10 border border-xp/20 p-3 flex items-center gap-3">
            <ArrowUp className="h-4 w-4 text-xp shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-xp">Rank Up!</p>
              <div className="flex items-center gap-2 mt-1">
                <RankBadge tier={previousRank} />
                <span className="text-muted-foreground text-xs">→</span>
                <RankBadge tier={rankTier} />
              </div>
            </div>
          </div>
        )}

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
                <p className="mt-1 text-xs text-muted-foreground/70">
                  ({breakdownParts.join(" · ")})
                </p>
              )}
            </>
          ) : null}
        </div>

        {entries > 0 && <div className="mt-8 h-px w-full bg-border/40" />}

        <div className="my-6 rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-baseline justify-center">
            <p className="text-lg font-semibold text-foreground">
              <span className="text-3xl font-bold tabular-nums text-primary">{weekTotal}</span>
              <span className="text-base text-muted-foreground"> of {weekCap} tickets this week</span>
            </p>
          </div>
          <Progress value={weekPct} className="h-1.5" />
          {nudge && <p className="mt-3 text-xs text-muted-foreground text-center">{nudge}</p>}
          {streakPill && (
            <div className="flex justify-center">
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-streak/10 border border-streak/20 px-3 py-1.5">
                <Flame className="h-3.5 w-3.5 text-streak" />
                <span className="text-xs font-medium text-streak">{streakPill}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8">
          {gameType === "wisdomdrop" && proverbs.length > 0 ? (
            <>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center hover:bg-primary/90 transition-all shadow-glow"
              >
                Review proverbs
              </button>
              <button
                type="button"
                onClick={handlePlayAgain}
                className="mt-3 w-full h-12 rounded-xl border border-border bg-surface-1 text-foreground font-semibold text-base flex items-center justify-center hover:border-primary/40 transition-all"
              >
                Play again
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handlePlayAgain}
              className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center hover:bg-primary/90 transition-all shadow-glow"
            >
              Play again
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push("/app")}
            className="mt-4 w-full h-10 text-muted-foreground font-semibold text-sm flex items-center justify-center hover:text-foreground transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>

      {showModal && (
        <ProverbReviewModal
          proverbs={proverbs}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
