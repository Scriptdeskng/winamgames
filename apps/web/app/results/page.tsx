"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUp, Coins, Flame, Ticket, Trophy } from "lucide-react";
import { getSession } from "@/lib/session";

type StoredResult = {
  gameType: "checkmate" | "wisdomdrop";
  entries: number;
  baseEntries: number;
  streakBonus: number;
  missionEntries: number;
  missionCoins?: number;
  coins: number;
  xp: number;
  streak: number;
  weekTotal: number;
  weekCap: number;
  rankTier: string;
  previousRank: string;
  completedMissions: Array<{ title: string; entriesAdded?: number; coinsAwarded?: number }>;
  puzzlesSolved: number;
  completedAt: string;
  success?: boolean;
};

const RESULT_KEY = "winam.last-result";

function rankLabel(rank: string) {
  return String(rank).charAt(0).toUpperCase() + String(rank).slice(1);
}

export default function ResultsPage() {
  const router = useRouter();
  const session = getSession();
  const [ready, setReady] = useState(false);
  const [result, setResult] = useState<StoredResult | null>(null);

  useEffect(() => {
    if (!session) {
      router.replace("/login");
      return;
    }

    try {
      const raw = window.localStorage.getItem(RESULT_KEY);
      if (raw) setResult(JSON.parse(raw) as StoredResult);
    } catch {
      setResult(null);
    } finally {
      setReady(true);
    }
  }, [router, session]);

  if (!ready) {
    return (
      <main className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }

  if (!result) {
    return (
      <main className="min-h-[100dvh] bg-background text-foreground">
        <div className="mx-auto min-h-[100dvh] max-w-[430px] px-4 py-6 flex flex-col justify-center gap-4">
          <div className="rounded-2xl bg-surface-1 border border-border p-6 shadow-card text-center space-y-3">
            <Trophy className="h-10 w-10 text-primary mx-auto" />
            <h1 className="text-xl font-bold">No recent results</h1>
            <p className="text-sm text-muted-foreground">Finish a round to see your ticket breakdown here.</p>
            <Link href="/app" className="mt-2 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-glow">
              Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const rankedUp = result.rankTier !== result.previousRank;
  const streakPill =
    result.streak >= 14
      ? `Day ${result.streak} streak — +3 bonus tickets per round`
      : result.streak >= 7
        ? `Day ${result.streak} streak — +2 bonus tickets per round`
        : result.streak >= 3
          ? `Day ${result.streak} streak — +1 bonus ticket per round`
          : result.streak >= 1
            ? `Day ${result.streak} streak — reach day 3 for +1 bonus ticket per round`
            : null;
  const missions = result.completedMissions ?? [];
  const missionTicketBonus = missions.reduce((sum, mission) => sum + (mission.entriesAdded ?? 0), 0);
  const missionCoinBonus = missions.reduce((sum, mission) => sum + (mission.coinsAwarded ?? 0), 0);

  return (
    <main className="mx-auto min-h-[100dvh] max-w-[430px] bg-background text-foreground flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/app" className="h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center">
          <span className="sr-only">Back</span>
          <ArrowUp className="h-4 w-4 rotate-[-90deg]" />
        </Link>
        <img src="/winam-logo.png" alt="WinamGames" className="h-7 w-auto" />
        <div className="h-10 w-10" />
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 pb-8 pt-8">
        {rankedUp && (
          <div className="w-full mb-6 rounded-xl bg-xp/10 border border-xp/20 p-3 flex items-center gap-3">
            <ArrowUp className="h-4 w-4 text-xp shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-xp">Rank Up!</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase">{rankLabel(result.previousRank)}</span>
                <span className="text-muted-foreground text-xs">→</span>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase">{rankLabel(result.rankTier)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col items-center text-center">
          <Trophy className="mb-5 h-12 w-12 text-primary" />
          <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-muted-foreground">Round Complete</p>
          <p className="mt-3 text-4xl font-bold leading-tight text-foreground">
            {result.puzzlesSolved} puzzle{result.puzzlesSolved === 1 ? "" : "s"} solved
          </p>

          {result.entries > 0 && (
            <>
              <p className="mt-3 text-2xl font-bold tabular-nums text-primary">
                +{result.entries}
                <span className="ml-2 text-lg font-semibold align-baseline">{result.entries === 1 ? "ticket" : "tickets"} earned</span>
              </p>
              <p className="mt-3 text-xs text-muted-foreground/70">
                Solved {result.puzzlesSolved} puzzles +{result.baseEntries}
                {result.streakBonus > 0 ? `  ·  Day ${result.streak} streak +${result.streakBonus}` : ""}
                {missionTicketBonus > 0 ? `  ·  Mission tickets +${missionTicketBonus}` : ""}
                {missionCoinBonus > 0 ? `  ·  Mission coins +${missionCoinBonus}` : ""}
              </p>
            </>
          )}
        </div>

        {result.entries > 0 && <div className="mt-8 h-px w-full bg-border/40" />}

        <div className="my-6 rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-baseline justify-center">
            <p className="text-lg font-semibold text-foreground">
              <span className="text-2xl font-bold tabular-nums text-primary">{result.weekTotal}</span>
              <span className="text-muted-foreground"> of {result.weekCap} tickets this week</span>
            </p>
          </div>
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (result.weekTotal / result.weekCap) * 100)}%` }} />
          </div>
          {missions.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {missions.map((mission) => (
                <span
                  key={`${mission.title}-${mission.entriesAdded ?? 0}-${mission.coinsAwarded ?? 0}`}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] ${
                    mission.entriesAdded
                      ? "bg-primary/10 text-primary"
                      : "bg-coin/10 text-coin"
                  }`}
                >
                  {mission.entriesAdded ? (
                    <Ticket className="h-3 w-3" />
                  ) : (
                    <Coins className="h-3 w-3" />
                  )}
                  <span className="font-semibold">
                    {mission.entriesAdded ? `+${mission.entriesAdded} tickets` : `+${mission.coinsAwarded ?? 0} coins`}
                  </span>
                  <span className="text-muted-foreground/90">{mission.title}</span>
                </span>
              ))}
            </div>
          )}
          {streakPill && (
            <div className="flex justify-center">
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-streak/10 border border-streak/20 px-3 py-1.5">
                <Flame className="h-3.5 w-3.5 text-streak" />
                <span className="text-xs font-medium text-streak">{streakPill}</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-3">
          <Link
            href={result.gameType === "checkmate" ? "/checkmate" : "/wisdomdrop"}
            className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center hover:bg-primary/90 transition-all shadow-glow"
          >
            Play again
          </Link>
          <Link
            href="/app"
            className="w-full h-10 text-muted-foreground font-semibold text-sm flex items-center justify-center hover:text-foreground transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
