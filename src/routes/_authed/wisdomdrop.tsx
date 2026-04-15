import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { GameHeader } from "@/components/games/GameHeader";
import { HintButton } from "@/components/games/HintButton";
import { useGameSession } from "@/components/games/useGameSession";
import { getPlayerData } from "@/utils/mission.functions";
import { getSession } from "@/lib/session";
import { BookOpen, Check, X } from "lucide-react";
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
      <div className="mx-auto min-h-screen max-w-[430px] bg-background">
        <div className="px-4 pt-6 pb-24 flex flex-col items-center justify-center min-h-screen">
          <div className="h-20 w-20 rounded-2xl bg-xp/15 flex items-center justify-center mb-6">
            <BookOpen className="h-10 w-10 text-xp" />
          </div>
          <h1 className="text-2xl font-bold">WisdomDrop</h1>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-[280px]">
            Complete African proverbs to earn draw entries. Test your wisdom!
          </p>
          <div className="mt-4 space-y-1 text-center">
            <p className="text-xs text-muted-foreground">3 lives per session</p>
            <p className="text-xs text-muted-foreground">10 proverbs per round</p>
          </div>
          <button
            onClick={() => session.start(coinBalance)}
            disabled={session.loading}
            className="mt-8 h-14 w-full max-w-[280px] rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all shadow-glow disabled:opacity-50"
          >
            {session.loading ? "Starting..." : "Start Game"}
          </button>
        </div>
      </div>
    );
  }

  const puzzle = session.currentPuzzle as {
    puzzleId: string;
    proverb: string;
    options: string[];
    origin: string;
  } | null;

  const eliminatedOptions = session.hintData?.eliminate
    ? session.hintData.eliminate.split(",")
    : [];

  return (
    <div className="mx-auto min-h-screen max-w-[430px] bg-background">
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
          <div className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold ${
            session.feedback === "correct"
              ? "bg-success/15 text-success"
              : "bg-live/15 text-live"
          }`}>
            {session.feedback === "correct" ? (
              <><Check className="h-4 w-4" /> Correct!</>
            ) : (
              <><X className="h-4 w-4" /> Wrong answer</>
            )}
          </div>
        )}

        {puzzle && (
          <div className="rounded-2xl bg-surface-1 border border-border p-6 shadow-card">
            <p className="text-xs text-muted-foreground mb-3">{puzzle.origin}</p>
            <p className="text-lg font-medium leading-relaxed text-foreground">
              "{puzzle.proverb}"
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
