import { createFileRoute, Link } from "@tanstack/react-router";
import React from "react";
import { GameHeader } from "@/components/games/GameHeader";
import { HintButton } from "@/components/games/HintButton";
import { useGameSession } from "@/components/games/useGameSession";
import { getPlayerData } from "@/utils/mission.functions";
import { getSession } from "@/lib/session";
import { BookOpen, Check, X, ArrowLeft, Heart, ScrollText, Globe, ArrowRight, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/wisdomdrop")({
  component: WisdomDropPage,
  head: () => ({
    meta: [
      { title: "WisdomDrop — WinamGames" },
      { name: "description", content: "Complete African proverbs and earn draw entries." },
    ],
  }),
});

function WisdomDropPage() {
  const sessionData = getSession();
  const playerId = sessionData?.playerId ?? "";
  const [playerData, setPlayerData] = React.useState<any>(null);

  React.useEffect(() => {
    if (!playerId) return;
    getPlayerData({ data: { playerId } }).then(setPlayerData);
  }, [playerId]);

  const coinBalance = playerData?.success ? playerData.player.coinBalance : 0;
  const session = useGameSession("wisdomdrop", playerId);

  if (!session.sessionId) {
    return (
      <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background relative overflow-hidden">
        {/* Ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full bg-emerald/10 blur-3xl z-0"
        />

        <Link
          to="/"
          className="absolute left-4 top-4 z-20 h-10 w-10 rounded-xl bg-surface-1/70 backdrop-blur border border-border flex items-center justify-center hover:border-primary/40 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Link>

        <div className="relative z-10 px-6 pt-24 pb-10 flex flex-col items-center min-h-[100dvh]">
          {/* Medallion */}
          <div className="relative mb-7">
            <div className="absolute inset-0 rounded-full bg-emerald/30 blur-2xl" aria-hidden />
            <div className="relative h-24 w-24 rounded-full border border-emerald/40 bg-gradient-to-br from-surface-2 to-surface-1 shadow-glow flex items-center justify-center">
              <BookOpen className="h-11 w-11 text-emerald" strokeWidth={1.75} />
            </div>
          </div>

          {/* Title + tagline */}
          <h1 className="text-3xl font-bold tracking-tight text-gradient-emerald">
            WisdomDrop
          </h1>
          <p className="mt-3 text-sm italic text-muted-foreground text-center max-w-[280px] leading-relaxed">
            Where ancient wisdom meets modern play.
          </p>

          {/* Stat chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-1 border border-border px-3 py-1.5 text-xs font-medium">
              <Heart className="h-3.5 w-3.5 text-live" />
              <span className="tabular-nums">3 lives</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-1 border border-border px-3 py-1.5 text-xs font-medium">
              <ScrollText className="h-3.5 w-3.5 text-xp" />
              <span className="tabular-nums">10 proverbs</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-1 border border-border px-3 py-1.5 text-xs font-medium">
              <Globe className="h-3.5 w-3.5 text-emerald" />
              <span className="tabular-nums">9 regions</span>
            </span>
          </div>

          {/* Spacer pushes CTA toward lower-middle */}
          <div className="flex-1 min-h-6" />

          {/* Reward preview */}
          <div className="w-full max-w-[320px] rounded-2xl bg-surface-1/70 backdrop-blur border border-border p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-coin/15 border border-coin/20 flex items-center justify-center shrink-0">
                <Coins className="h-5 w-5 text-coin" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Earn up to <span className="text-coin tabular-nums">5 entries</span> per round
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Plus XP, streak bonuses & weekly draws
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => session.start(coinBalance)}
            disabled={session.loading}
            className="group relative mt-4 h-14 w-full max-w-[320px] rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all shadow-glow disabled:opacity-50 overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
            <span className="relative inline-flex items-center justify-center gap-2">
              {session.loading ? "Starting..." : (
                <>
                  Start Game
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    );
  }

  const puzzle = session.currentPuzzle as {
    puzzleId: string;
    displayText: string;
    options: string[];
    region: string;
  } | null;

  const eliminatedOptions = session.hintData?.eliminate
    ? session.hintData.eliminate.split(",")
    : [];

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background">
      <GameHeader
        title="WisdomDrop"
        lives={session.lives}
        startTime={session.startTime}
        running={session.running}
        puzzleIndex={session.currentPuzzleIndex}
        totalPuzzles={session.totalPuzzles}
        onExit={session.exitEarly}
      />

      <div className="px-4 pt-6 pb-8 space-y-6">
        {session.feedback && (
          <div
            className={cn(
              "rounded-2xl border p-4 space-y-3",
              session.feedback === "correct"
                ? "bg-success/10 border-success/30"
                : "bg-live/10 border-live/30"
            )}
          >
            <div
              className={cn(
                "flex items-center gap-2 text-sm font-semibold",
                session.feedback === "correct" ? "text-success" : "text-live"
              )}
            >
              {session.feedback === "correct" ? (
                <><Check className="h-4 w-4" /> Correct!</>
              ) : (
                <><X className="h-4 w-4" /> Wrong answer</>
              )}
            </div>

            {session.lastReveal && (
              <div className="space-y-2 pt-1">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Answer</p>
                  <p className="text-xl font-bold text-primary">
                    {session.lastReveal.blank}
                  </p>
                </div>
                <p className="text-sm italic text-muted-foreground leading-relaxed">
                  "{session.lastReveal.originalProverb}"
                </p>
                <p className="text-xs text-muted-foreground/70">
                  — {session.lastReveal.region}
                </p>
              </div>
            )}
          </div>
        )}

        {puzzle && (
          <div className="rounded-2xl bg-surface-1 border border-border p-6 shadow-card">
            <p className="text-xs text-muted-foreground mb-3">{puzzle.region}</p>
            <p className="text-lg font-medium leading-relaxed text-foreground">
              "{puzzle.displayText}"
            </p>
          </div>
        )}

        {session.hintData && session.hintData.startsWidth && (
          <div className="rounded-xl bg-coin/10 border border-coin/20 p-3">
            <p className="text-xs font-medium text-coin">
              Hint: The word starts with "{session.hintData.startsWidth}"
            </p>
          </div>
        )}

        {puzzle && (
          <div className="grid grid-cols-1 gap-3">
            {puzzle.options.map((option, i) => {
              const isEliminated = eliminatedOptions.includes(option);
              return (
                <button
                  key={i}
                  onClick={() => session.submit(option)}
                  disabled={session.loading || session.gameOver || isEliminated}
                  className={cn(
                    "h-14 rounded-xl text-sm font-semibold transition-all border min-h-[44px]",
                    isEliminated
                      ? "bg-surface-1/30 border-border/30 text-muted-foreground/30 line-through cursor-not-allowed"
                      : "bg-surface-1 border-border text-foreground hover:border-primary/40 hover:shadow-glow active:scale-[0.98]"
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}

        <HintButton
          currentTier={session.currentHintTier}
          coinBalance={session.coinBalance}
          onUseHint={session.requestHint}
          disabled={session.loading || session.gameOver}
        />

        {session.gameOver && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Calculating results...</p>
          </div>
        )}
      </div>
    </div>
  );
}
