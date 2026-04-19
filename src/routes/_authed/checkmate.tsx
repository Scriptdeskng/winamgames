import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import React from "react";
import { ChessBoard } from "@/components/games/ChessBoard";
import { GameHeader } from "@/components/games/GameHeader";
import { HintButton } from "@/components/games/HintButton";
import { useGameSession } from "@/components/games/useGameSession";
import { getPlayerData } from "@/utils/mission.functions";
import { getSession } from "@/lib/session";
import { Swords, Check, X, ArrowLeft, Heart, Puzzle, Crown, ArrowRight, Coins } from "lucide-react";

export const Route = createFileRoute("/_authed/checkmate")({
  component: CheckMatePage,
  head: () => ({
    meta: [
      { title: "CheckMate — WinamGames" },
      { name: "description", content: "Solve chess puzzles and earn draw entries." },
    ],
  }),
});

function CheckMatePage() {
  const sessionData = getSession();
  const playerId = sessionData?.playerId ?? "";
  const [playerData, setPlayerData] = React.useState<any>(null);

  React.useEffect(() => {
    if (!playerId) return;
    getPlayerData({ data: { playerId } }).then(setPlayerData);
  }, [playerId]);

  const coinBalance = playerData?.success ? playerData.player.coinBalance : 0;
  const session = useGameSession("checkmate", playerId);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  const handleSquareClick = useCallback((square: string) => {
    if (!session.currentPuzzle || session.loading || session.gameOver) return;
    if (selectedSquare) {
      session.submit(square);
      setSelectedSquare(null);
    } else {
      setSelectedSquare(square);
    }
  }, [selectedSquare, session]);

  if (!session.sessionId) {
    return (
      <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background relative">
        <Link
          to="/"
          className="absolute left-4 top-4 z-10 h-10 w-10 rounded-xl bg-surface-1 border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Link>
        <div className="px-4 pt-6 pb-24 flex flex-col items-center justify-center min-h-[100dvh]">
          <div className="h-20 w-20 rounded-2xl bg-primary/15 flex items-center justify-center mb-6">
            <Swords className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">CheckMate</h1>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-[280px]">
            Solve chess puzzles to earn draw entries. Find the best move!
          </p>
          <div className="mt-4 space-y-1 text-center">
            <p className="text-xs text-muted-foreground">3 lives per session</p>
            <p className="text-xs text-muted-foreground">10 puzzles per round</p>
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

  const puzzle = session.currentPuzzle as { puzzleId: string; fen: string } | null;

  return (
    <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background">
      <GameHeader
        title="CheckMate"
        lives={session.lives}
        startTime={session.startTime}
        running={session.running}
        puzzleIndex={session.currentPuzzleIndex}
        totalPuzzles={session.totalPuzzles}
        onExit={session.exitEarly}
      />

      <div className="px-4 pt-4 pb-8 space-y-4">
        {session.feedback && (
          <div className={`flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold ${
            session.feedback === "correct"
              ? "bg-success/15 text-success"
              : "bg-live/15 text-live"
          }`}>
            {session.feedback === "correct" ? (
              <><Check className="h-4 w-4" /> Correct!</>
            ) : (
              <><X className="h-4 w-4" /> Wrong move</>
            )}
          </div>
        )}

        {puzzle && (
          <ChessBoard
            fen={puzzle.fen}
            selectedSquare={selectedSquare}
            onSquareClick={handleSquareClick}
            disabled={session.loading || session.gameOver}
          />
        )}

        {session.hintData && (
          <div className="rounded-xl bg-coin/10 border border-coin/20 p-3">
            <p className="text-xs font-medium text-coin">
              {session.hintData.piece && `Piece: ${session.hintData.piece}`}
              {session.hintData.destination && ` → ${session.hintData.destination}`}
              {session.hintData.move && ` (${session.hintData.move})`}
            </p>
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
