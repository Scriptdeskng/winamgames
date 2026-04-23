import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useMemo } from "react";
import React from "react";
import { Chess, type Square } from "chess.js";
import { ChessBoard } from "@/components/games/ChessBoard";
import { GameHeader } from "@/components/games/GameHeader";
import { AnswerFooter } from "@/components/games/AnswerFooter";
import { useGameSession } from "@/components/games/useGameSession";
import { DrawLockBanner } from "@/components/games/DrawLockBanner";
import { getPlayerData } from "@/utils/mission.functions";
import { getSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { Swords, Check, X, ArrowLeft, Heart, Puzzle, Crown, ArrowRight, Coins, Lightbulb } from "lucide-react";
import { playMove, playCapture, playCorrect, playIncorrect } from "@/utils/sound";
import { motion, AnimatePresence } from "framer-motion";

const HINT_TIERS = [
  { tier: 1 as const, label: "Piece", cost: 25 },
  { tier: 2 as const, label: "Move", cost: 75 },
];

const GOAL_BY_THEME: Record<string, string> = {
  "Fork": "Your piece can attack two opponent pieces at once. Find the fork.",
  "Checkmate in 1": "You have an immediate checkmate. Can you find it?",
  "Pin": "You can pin a piece against a more valuable one behind it. Find the pin.",
  "Attacking f2 or f7": "The f7 square is weak and under-defended. How do you exploit it?",
  "Clearance": "Find the move that develops your piece to its most active square.",
  "Exposed king": "The king is exposed in the centre. Find the move that exploits it.",
  "Advanced pawn": "A strong pawn push controls the centre and gains space. Find it.",
  "Hanging piece": "An opponent piece is undefended or can be attacked with tempo. Find it.",
  "Trapped piece": "An opponent piece has no safe escape. Find the move that proves it.",
  "Capture the defender": "Capturing this piece removes a key defender. Find the winning exchange.",
  "Discovered attack": "Moving one piece reveals a hidden attack from another. Find it.",
};

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
  const [committedMove, setCommittedMove] = useState<{ from: string; to: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("winam_checkmate_onboarded")) {
      setShowOnboarding(true);
    }
  }, []);

  const dismissOnboarding = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("winam_checkmate_onboarded", "1");
    }
    setShowOnboarding(false);
  };

  const puzzleFen = (session.currentPuzzle as { fen?: string } | null)?.fen ?? null;

  const legalMoves = useMemo(() => {
    if (!selectedSquare || !puzzleFen) return new Set<string>();
    try {
      const chess = new Chess(puzzleFen);
      return new Set(
        chess.moves({ square: selectedSquare as Square, verbose: true }).map((m) => m.to as string)
      );
    } catch {
      return new Set<string>();
    }
  }, [selectedSquare, puzzleFen]);

  const handleSquareClick = useCallback((square: string) => {
    if (!session.currentPuzzle || session.loading || session.gameOver) return;

    if (selectedSquare) {
      if (square === selectedSquare) {
        setSelectedSquare(null);
        return;
      }
      // Gate: only submit legal moves
      if (!legalMoves.has(square)) {
        setSelectedSquare(null);
        return;
      }
      // Detect capture from current FEN before submission
      const fen = (session.currentPuzzle as { fen?: string }).fen;
      let isCapture = false;
      if (fen) {
        try {
          const chess = new Chess(fen);
          const target = chess.get(square as Square);
          isCapture = !!target;
        } catch {
          isCapture = false;
        }
      }
      setCommittedMove({ from: selectedSquare, to: square });
      if (isCapture) playCapture();
      else playMove();
      session.submit(JSON.stringify({ from: selectedSquare, to: square }));
      setSelectedSquare(null);
    } else {
      setSelectedSquare(square);
    }
  }, [selectedSquare, session, legalMoves]);

  const lastMove = useMemo(() => {
    const p = session.currentPuzzle as
      | { opponentFrom?: string | null; opponentTo?: string | null }
      | null;
    if (!p?.opponentFrom || !p?.opponentTo) return null;
    return { from: p.opponentFrom, to: p.opponentTo };
  }, [session.currentPuzzle]);

  useEffect(() => {
    setSelectedSquare(null);
    setCommittedMove(null);
  }, [puzzleFen]);

  useEffect(() => {
    if (session.feedback === "correct") playCorrect();
    else if (session.feedback === "incorrect") playIncorrect();
  }, [session.feedback]);

  useEffect(() => {
    if (!lastMove) return;
    playMove();
  }, [lastMove]);

  if (!session.sessionId) {
    return (
      <div className="mx-auto min-h-[100dvh] max-w-[430px] bg-background relative overflow-hidden">
        {/* Ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full bg-emerald/10 blur-3xl z-0"
        />

        <Link
          to="/app"
          className="absolute left-4 top-4 z-20 h-10 w-10 rounded-xl bg-surface-1/70 backdrop-blur border border-border flex items-center justify-center hover:border-primary/40 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </Link>

        <div className="relative z-10 px-6 pt-24 pb-10 flex flex-col items-center min-h-[100dvh]">
          {/* Medallion */}
          <div className="relative mb-7">
            <div className="absolute inset-0 rounded-full bg-emerald/30 blur-2xl" aria-hidden />
            <div className="relative h-24 w-24 rounded-full border border-emerald/40 bg-gradient-to-br from-surface-2 to-surface-1 shadow-glow flex items-center justify-center">
              <Swords className="h-11 w-11 text-emerald" strokeWidth={1.75} />
            </div>
          </div>

          {/* Title + tagline */}
          <h1 className="text-3xl font-bold tracking-tight text-gradient-emerald">
            CheckMate
          </h1>
          <p className="mt-3 text-sm italic text-muted-foreground text-center max-w-[280px] leading-relaxed">
            Outthink the board, claim the crown.
          </p>

          {/* Stat chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-1 border border-border px-3 py-1.5 text-xs font-medium">
              <Heart className="h-3.5 w-3.5 text-live" />
              <span className="tabular-nums">3 lives</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-1 border border-border px-3 py-1.5 text-xs font-medium">
              <Puzzle className="h-3.5 w-3.5 text-xp" />
              <span className="tabular-nums">10 puzzles</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-1 border border-border px-3 py-1.5 text-xs font-medium">
              <Crown className="h-3.5 w-3.5 text-emerald" />
              <span>Best move</span>
            </span>
          </div>

          {/* Spacer */}
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
        <DrawLockBanner />

        {showOnboarding && (
          <div className="rounded-xl bg-surface-1 border border-emerald/30 p-4 space-y-3">
            <p className="text-sm text-foreground leading-relaxed">
              Tap a piece to select it, then tap where you want it to move.
              Find the winning move to earn your entry.
            </p>
            <button
              onClick={dismissOnboarding}
              className="w-full h-10 rounded-lg bg-emerald text-emerald-foreground text-sm font-semibold hover:bg-emerald/90 transition-colors"
            >
              Got it
            </button>
          </div>
        )}

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
          <div className="rounded-xl bg-surface-1 border border-border px-4 py-3 flex gap-3 items-center">
            <div
              className="shrink-0 w-8 h-8 rounded flex items-center justify-center"
              style={{ backgroundColor: puzzle.fen.split(" ")[1] === "w" ? "#F0D9B5" : "#B58863" }}
            >
              <img
                src={puzzle.fen.split(" ")[1] === "w"
                  ? "https://lichess1.org/assets/piece/staunty/wP.svg"
                  : "https://lichess1.org/assets/piece/staunty/bP.svg"
                }
                alt={puzzle.fen.split(" ")[1] === "w" ? "White" : "Black"}
                className="w-6 h-6"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">
                {puzzle.fen.split(" ")[1] === "w" ? "White" : "Black"} to move
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {GOAL_BY_THEME[(puzzle as any).theme] ?? "Find the best move."}
              </p>
            </div>
          </div>
        )}

        {puzzle && (
          <ChessBoard
            fen={puzzle.fen}
            selectedSquare={selectedSquare}
            onSquareClick={handleSquareClick}
            lastMove={lastMove}
            legalMoves={legalMoves}
            hintFrom={session.hintData?.from}
            hintTo={undefined}
            committedMove={committedMove}
            feedback={session.feedback}
            arrowMove={
              session.currentHintTier >= 2 && session.hintData?.from && session.hintData?.destination
                ? { from: session.hintData.from, to: session.hintData.destination }
                : null
            }
            disabled={session.loading || session.gameOver || !!session.feedback}
          />
        )}

        {session.currentHintTier >= 1 && !session.feedback && session.hintData?.piece && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl bg-gradient-to-br from-coin/15 to-coin/5 border border-coin/30 p-3 flex items-center gap-3"
          >
            <div className="h-10 w-10 rounded-lg bg-coin/20 border border-coin/30 flex items-center justify-center shrink-0">
              <Lightbulb className="h-5 w-5 text-coin" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wide text-coin/80 font-semibold">
                {session.currentHintTier >= 2 ? "Move hint" : "Piece hint"}
              </p>
              <p className="text-sm font-bold text-foreground">
                Move the highlighted <span className="text-coin">{session.hintData.piece}</span>
              </p>
            </div>
          </motion.div>
        )}

        <AnswerFooter
          feedback={session.feedback}
          isLastPuzzle={session.isLastPuzzle}
          isGameOver={session.gameOver}
          autoAdvanceMs={session.autoAdvanceMs}
          onAdvance={session.advance}
        />

        {!session.feedback && (
          <div className="space-y-2">
            <div className="flex items-center justify-end gap-1.5 px-1">
              <Coins className="w-3.5 h-3.5 text-coin" />
              <span className="text-xs font-semibold text-coin tabular-nums">
                {session.coinBalance} coins
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
            {HINT_TIERS.map(({ tier, label, cost }) => {
              const purchased = session.currentHintTier >= tier;
              const locked = tier > session.currentHintTier + 1;
              const canAfford = session.coinBalance >= cost;
              const disabled =
                purchased ||
                locked ||
                !canAfford ||
                session.loading ||
                session.gameOver;

              return (
                <button
                  key={tier}
                  disabled={disabled}
                  onClick={() => session.requestHint(tier)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-xs font-medium transition-all border min-h-[72px]",
                    purchased
                      ? "bg-success/10 border-success/30 text-success"
                      : disabled
                        ? "bg-surface-1/50 border-border/50 text-muted-foreground cursor-not-allowed opacity-50"
                        : "bg-surface-1 border-border text-foreground hover:border-primary/30"
                  )}
                >
                  {purchased ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Lightbulb className="h-4 w-4 text-coin" />
                  )}
                  <span className="leading-tight">{label}</span>
                  <span className="tabular-nums text-[10px] text-coin">
                    {purchased ? "Bought" : `${cost} coins`}
                  </span>
                </button>
              );
            })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

