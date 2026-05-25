"use client";

import { Chess, type Square } from "chess.js";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Coins,
  Crown,
  Heart,
  Lightbulb,
  Puzzle,
  Swords,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import AnswerFooter from "@/components/games/AnswerFooter";
import AutoAdvanceRing from "@/components/games/AutoAdvanceRing";
import { ChessBoard } from "@/components/games/ChessBoard";
import DrawLockBanner from "@/components/games/DrawLockBanner";
import GameHeader from "@/components/games/GameHeader";
import { useGameSession } from "@/hooks/useGameSession";
import { localStore } from "@/lib/client-utils";
import { sessionStore } from "@/lib/session";
import { cn } from "@/lib/utils";
import { playCapture, playCorrect, playIncorrect, playMove } from "@/lib/sound";

const HINT_TIERS = [
  { tier: 1 as const, label: "Piece hint", description: "Highlights the piece to move", cost: 25 },
  { tier: 2 as const, label: "Move hint", description: "Shows the exact move", cost: 75 },
];

const GOAL_BY_THEME: Record<string, string> = {
  "Fork": "Your piece can attack two opponent pieces at once. Find the fork.",
  "Checkmate in 1": "You have an immediate checkmate. Can you find it?",
  "Pin": "You can pin a piece against a more valuable one behind it. Find the pin.",
  "Attacking f2 or f7": "A key square is weak and under-defended. How do you exploit it?",
  "Clearance": "Find the move that develops your piece to its most active square.",
  "Exposed king": "The king is exposed in the centre. Find the move that exploits it.",
  "Advanced pawn": "A strong pawn push controls the centre and gains space. Find it.",
  "Hanging piece": "An opponent piece is undefended or can be attacked with tempo. Find it.",
  "Trapped piece": "An opponent piece has no safe escape. Find the move that proves it.",
  "Capture the defender": "Capturing this piece removes a key defender. Find the winning exchange.",
  "Discovered attack": "Moving one piece reveals a hidden attack from another. Find it.",
  "Skewer": "A high value piece is under attack — moving it will expose a less valuable piece behind it. Find the skewer.",
  "Back rank mate": "Your opponent's king is trapped on the back rank with no escape. Find the checkmate.",
};

const THEME_INTRO_KEY = "winam_checkmate_theme_intro_seen";

export default function CheckMatePage() {
  const router = useRouter();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [coinBalance, setCoinBalance] = useState(0);
  const [committedMove, setCommittedMove] = useState<{ from: string; to: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStore.get("winam_checkmate_onboarded") !== "1",
  );
  const [starting, setStarting] = useState(false);

  const game = useGameSession({
    playerId: playerId ?? "",
    gameType: "checkmate",
    coinBalance,
    onCoinBalanceChange: setCoinBalance,
  });

  useEffect(() => {
    const session = sessionStore.get();
    if (!session?.player.id) {
      router.push("/login");
      return;
    }
    setPlayerId(session.player.id);
    setCoinBalance(session.player.coins ?? 0);
  }, [router]);

  const legalMoves = useMemo(
    () => new Set(game.legalTargets),
    [game.legalTargets],
  );

  const checkmatePuzzle =
    game.currentPuzzle && game.currentPuzzle.gameType === "checkmate"
      ? game.currentPuzzle
      : null;

  const boardFeedback = useMemo((): "correct" | "incorrect" | null => {
    if (game.feedback === "correct") return "correct";
    if (game.feedback === "wrong") return "incorrect";
    return null;
  }, [game.feedback]);

  useEffect(() => {
    const theme = checkmatePuzzle?.theme;
    if (!theme) return;
    const seen = localStore.getJSON<string[]>(THEME_INTRO_KEY) ?? [];
    if (!seen.includes(theme)) {
      localStore.setJSON(THEME_INTRO_KEY, [...seen, theme]);
    }
  }, [checkmatePuzzle?.theme]);

  useEffect(() => {
    if (game.feedback === "correct") playCorrect();
    else if (game.feedback === "wrong") playIncorrect();
  }, [game.feedback]);

  useEffect(() => {
    if (!game.lastMove) return;
    playMove();
  }, [game.lastMove]);

  useEffect(() => {
    setCommittedMove(null);
  }, [checkmatePuzzle?.puzzleId]);

  useEffect(() => {
    if (game.feedback === null) {
      setCommittedMove(null);
    }
  }, [game.feedback]);

  const handleSquareClick = useCallback(
    (square: string) => {
      if (
        game.selectedSquare &&
        game.legalTargets.includes(square) &&
        checkmatePuzzle?.fen
      ) {
        let isCapture = false;
        try {
          const chess = new Chess(checkmatePuzzle.fen);
          const target = chess.get(square as Square);
          isCapture = !!target;
        } catch {
          isCapture = false;
        }
        if (isCapture) playCapture();
        else playMove();
        setCommittedMove({ from: game.selectedSquare, to: square });
      }
      game.onSquareClick(square);
    },
    [checkmatePuzzle, game],
  );

  if (playerId && !game.sessionId) {
    return (
      <div className="relative mx-auto min-h-[100dvh] max-w-[430px] overflow-hidden bg-background">
        {/* Ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 z-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        />

        <button
          type="button"
          onClick={() => router.push("/app")}
          className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-1/70 backdrop-blur transition-colors hover:border-primary/40"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>

        <div className="relative z-10 flex min-h-[100dvh] flex-col items-center px-6 pb-10 pt-24">
          {/* Medallion */}
          <div className="relative mb-7">
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl" aria-hidden />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-primary/40 bg-gradient-to-br from-surface-2 to-surface-1 shadow-glow">
              <Swords className="h-11 w-11 text-primary" strokeWidth={1.75} />
            </div>
          </div>

          {/* Title + tagline */}
          <h1 className="text-3xl font-bold tracking-tight text-primary">CheckMate</h1>
          <p className="mt-3 max-w-[280px] text-center text-sm italic leading-relaxed text-muted-foreground">
            Outthink the board, claim the crown.
          </p>

          {/* Stat chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-1 px-3 py-1.5 text-xs font-medium">
              <Heart className="h-3.5 w-3.5 text-destructive" />
              <span className="tabular-nums">3 lives</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-1 px-3 py-1.5 text-xs font-medium">
              <Puzzle className="h-3.5 w-3.5 text-primary" />
              <span className="tabular-nums">10 puzzles</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-1 px-3 py-1.5 text-xs font-medium">
              <Crown className="h-3.5 w-3.5 text-primary" />
              <span>Best move</span>
            </span>
          </div>

          {/* Mini board preview */}
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-4">
            <div className="w-[180px] grid grid-cols-4 grid-rows-4 rounded-lg overflow-hidden">
              {(() => {
                const pieces: Record<number, string> = {
                  0: "https://lichess1.org/assets/piece/staunty/bK.svg",
                  2: "https://lichess1.org/assets/piece/staunty/bR.svg",
                  5: "https://lichess1.org/assets/piece/staunty/bP.svg",
                  9: "https://lichess1.org/assets/piece/staunty/wQ.svg",
                  14: "https://lichess1.org/assets/piece/staunty/wK.svg",
                };
                const hintSquare = 2;
                return Array.from({ length: 16 }).map((_, i) => {
                  const row = Math.floor(i / 4);
                  const col = i % 4;
                  const isHint = i === hintSquare;
                  return (
                    <div
                      key={i}
                      className={cn(
                        "relative aspect-square flex items-center justify-center",
                        isHint
                          ? "bg-primary/30"
                          : (row + col) % 2 === 0
                            ? "bg-surface-2"
                            : "bg-surface-1",
                      )}
                    >
                      {pieces[i] && (
                        <img
                          src={pieces[i]}
                          alt=""
                          aria-hidden
                          className="w-[70%] h-[70%] object-contain"
                        />
                      )}
                    </div>
                  );
                });
              })()}
            </div>
            <p className="text-center text-xs text-muted-foreground/60">
              Tap a piece · tap its destination
            </p>
          </div>

          {/* Reward preview */}
          <div className="mb-4 w-full max-w-[320px] rounded-2xl border border-border bg-surface-1/70 p-4 shadow-card backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-coin/20 bg-coin/15">
                <Coins className="h-5 w-5 text-coin" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Earn up to <span className="tabular-nums text-coin">5 tickets</span> per round
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Plus XP, streak bonuses & weekly draws
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={() => {
              setStarting(true);
              game.startGame();
            }}
            disabled={starting}
            className="group relative h-14 w-full max-w-[320px] overflow-hidden rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-glow transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 to-transparent" />
            <span className="relative inline-flex items-center justify-center gap-2">
              {starting ? (
                "Starting..."
              ) : (
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

  if (!playerId || game.phase === "loading") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
          role="status"
          aria-label="Loading puzzle"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[100dvh] max-w-[430px] flex-col bg-background">
      <GameHeader
        puzzleIndex={game.puzzleNumber - 1}
        totalPuzzles={game.totalPuzzles}
        elapsedMs={game.elapsedMs}
        lives={game.lives}
        maxLives={game.maxLives}
        onExit={game.exitSession}
      />

      <DrawLockBanner />

      <div className="flex min-h-0 flex-1 flex-col px-4 pt-3">
        {showOnboarding ? (
          <div className="mb-3 rounded-xl bg-surface-1 border border-emerald/30 p-4 space-y-3">
              <p className="text-sm text-foreground leading-relaxed">
                Tap a piece to select it, then tap where you want it to move. Find the winning move
                to earn your ticket.
              </p>
              <button
                type="button"
                onClick={() => {
                  localStore.set("winam_checkmate_onboarded", "1");
                  setShowOnboarding(false);
                }}
                className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
              >
                Got it
              </button>
          </div>
        ) : null}

        <div className="space-y-3">
          {game.feedback === "correct" ? (
            <div className="w-full rounded-xl bg-primary/15 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-primary">
              <Check className="h-4 w-4" />
              Correct!
            </div>
          ) : null}
          {game.feedback === "wrong" ? (
            <div className="w-full rounded-xl bg-destructive/15 py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-destructive">
              <X className="h-4 w-4" />
              Wrong move
            </div>
          ) : null}

          <div className="mt-4 mb-4 rounded-xl bg-surface-1 border border-border px-4 py-3 flex gap-3 items-center">
            <div
              className="shrink-0 w-8 h-8 rounded flex items-center justify-center"
              style={{
                backgroundColor:
                  checkmatePuzzle?.fen.split(" ")[1] === "w" ? "#F0D9B5" : "#B58863",
              }}
            >
              <img
                src={
                  checkmatePuzzle?.fen.split(" ")[1] === "w"
                    ? "https://lichess1.org/assets/piece/staunty/wP.svg"
                    : "https://lichess1.org/assets/piece/staunty/bP.svg"
                }
                alt={checkmatePuzzle?.fen.split(" ")[1] === "w" ? "White" : "Black"}
                className="w-6 h-6"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">
                {checkmatePuzzle?.fen.split(" ")[1] === "w" ? "White" : "Black"} to move
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {GOAL_BY_THEME[checkmatePuzzle?.theme ?? ""] ?? "Find the best move."}
              </p>
            </div>
          </div>

          {game.hintTierUsed >= 1 && !game.feedback && game.hintData?.piece && (
            <div className="rounded-xl bg-gradient-to-br from-coin/15 to-coin/5 border border-coin/30 p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-coin/20 border border-coin/30 flex items-center justify-center shrink-0">
                <Lightbulb className="h-5 w-5 text-coin" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wide text-coin/80 font-semibold">
                  Piece Hint
                </p>
                <p className="text-sm font-bold text-foreground">
                  Move the highlighted <span className="text-coin">{game.hintData.piece}</span>
                </p>
              </div>
            </div>
          )}

          {checkmatePuzzle ? (
            <ChessBoard
              fen={checkmatePuzzle.fen}
              selectedSquare={game.selectedSquare}
              onSquareClick={handleSquareClick}
              lastMove={game.lastMove}
              legalMoves={legalMoves}
              hintFrom={game.hintTierUsed >= 1 ? game.hintData?.from ?? null : null}
              hintTo={undefined}
              arrowMove={
                game.feedback === "wrong" && game.revealMove
                  ? game.revealMove
                  : game.hintTierUsed >= 2 && game.hintData?.from && game.hintData?.destination
                    ? { from: game.hintData.from, to: game.hintData.destination }
                    : null
              }
              arrowColor={
                game.feedback === "wrong" ? "rgba(245,158,11,0.8)" : "rgba(0,200,100,0.85)"
              }
              committedMove={committedMove}
              feedback={boardFeedback}
              disabled={game.phase !== "playing" || game.isSubmitting || boardFeedback !== null}
            />
          ) : null}

          {game.feedback === "correct" ? (
            <button
              type="button"
              onClick={game.skipAdvance}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-glow"
            >
              <AutoAdvanceRing durationMs={game.autoAdvanceMs ?? 5000} />
              {game.puzzleNumber >= game.totalPuzzles ? "See Results" : "Next"}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
          {game.feedback === "wrong"
            ? (() => {
                const isGameOver = game.lives <= 0 || game.puzzleNumber >= game.totalPuzzles;
                const label = isGameOver ? "See Results" : "Continue";
                return (
                  <button
                    type="button"
                    onClick={game.skipAdvance}
                    className="group flex h-14 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface-1 text-base font-semibold text-foreground transition-all hover:border-primary/40"
                  >
                    {label}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                );
              })()
            : null}
        </div>

        <AnswerFooter
          coinBalance={coinBalance}
          hintTiers={[...HINT_TIERS]}
          hintTierUsed={game.hintTierUsed}
          feedback={game.feedback}
          phase={game.phase}
          autoAdvanceProgress={game.autoAdvanceProgress}
          autoAdvanceMs={game.autoAdvanceMs ?? 5000}
          onHint={game.requestHint}
          onSkipAdvance={game.skipAdvance}
        />
      </div>
    </div>
  );
}
