"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Coins,
  Crown,
  Flame,
  Globe,
  Heart,
  Lightbulb,
  Puzzle,
  Swords,
  Trophy,
} from "lucide-react";
import { Chess, type Square } from "chess.js";
import { getDashboard } from "@/lib/api";
import { getSession } from "@/lib/session";
import { useGameSession } from "@/lib/use-game-session";
import { AnswerFooter } from "./answer-footer";
import { ChessBoard } from "./chess-board";
import { DrawLockBanner } from "./draw-lock-banner";
import { GameHeader } from "./game-header";

type GameType = "checkmate" | "wisdomdrop";

export function GamePage({ gameType }: { gameType: GameType }) {
  return gameType === "checkmate" ? <CheckmateScreen /> : <WisdomDropScreen />;
}

function CheckmateScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [coinBalance, setCoinBalance] = useState(0);
  const session = useGameSession("checkmate", playerId, coinBalance);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [committedMove, setCommittedMove] = useState<{ from: string; to: string } | null>(null);
  const puzzle = session.currentPuzzle as { puzzleId: string; fen: string; theme?: string; opponentFrom?: string | null; opponentTo?: string | null } | null;
  const legalMoves = useMemo(() => {
    if (!selectedSquare || !puzzle?.fen) return new Set<string>();
    try {
      const chess = new Chess(puzzle.fen);
      return new Set(chess.moves({ square: selectedSquare as Square, verbose: true }).map((move) => move.to));
    } catch {
      return new Set<string>();
    }
  }, [puzzle?.fen, selectedSquare]);

  useEffect(() => {
    const stored = getSession();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setPlayerId(stored.playerId);
    getDashboard(stored.playerId)
      .then((data) => setCoinBalance(data?.player?.coinBalance ?? 0))
      .catch(() => setCoinBalance(0))
      .finally(() => setReady(true));
  }, [router]);

  useEffect(() => {
    if (!session.currentPuzzle) return;
    setSelectedSquare(null);
    setCommittedMove(null);
  }, [session.currentPuzzle]);

  const intro = !session.sessionId;

  if (!ready) {
    return <LoadingScreen />;
  }

  if (session.result && session.gameOver) {
    return <ResultScreen gameType="checkmate" result={session.result} onBack={() => router.push("/app")} />;
  }

  if (intro) {
    return <GameIntro gameType="checkmate" loading={session.loading} onStart={() => session.start()} coinBalance={coinBalance} />;
  }

  const lastMove = puzzle?.opponentFrom && puzzle?.opponentTo ? { from: puzzle.opponentFrom, to: puzzle.opponentTo } : null;

  const handleSquareClick = (square: string) => {
    if (!puzzle || session.loading || session.gameOver) return;
    if (selectedSquare) {
      if (square === selectedSquare) {
        setSelectedSquare(null);
        return;
      }
      if (!legalMoves.has(square)) {
        setSelectedSquare(null);
        return;
      }
      setCommittedMove({ from: selectedSquare, to: square });
      session.submit(JSON.stringify({ from: selectedSquare, to: square }));
      setSelectedSquare(null);
      return;
    }
    setSelectedSquare(square);
  };

  const currentIndex = session.currentPuzzleIndex;
  const total = session.totalPuzzles;
  const isLast = currentIndex + 1 >= total;

  return (
    <main className="mx-auto min-h-[100dvh] max-w-[430px] bg-background">
      <GameHeader
        title="CheckMate"
        lives={session.lives}
        startTime={session.startTime}
        running={session.running}
        puzzleIndex={currentIndex}
        totalPuzzles={total}
        onExit={session.exitEarly}
      />

      <div className="px-3 pt-4 pb-8 space-y-3.5">
        <DrawLockBanner />

        <div className="rounded-2xl bg-surface-1 border border-border shadow-card p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-[0.2em]">
              <Swords className="h-4 w-4 text-primary" />
              Tactical puzzle
            </div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{puzzle?.theme ?? "Find the best move"}</span>
          </div>

          {puzzle?.fen && (
            <ChessBoard
              fen={puzzle.fen}
              selectedSquare={selectedSquare}
              onSquareClick={handleSquareClick}
              lastMove={lastMove}
              hintFrom={session.hintData?.from ?? null}
              hintTo={session.hintData?.destination ?? null}
              disabled={session.loading || session.gameOver}
              legalMoves={legalMoves}
              committedMove={committedMove}
              feedback={session.feedback}
            />
          )}

          <p className="text-xs text-muted-foreground text-center">Tap a piece, then tap its destination.</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <HintCard
            label="Piece"
            cost="25 coins"
            active={!!session.hintData?.piece}
            onClick={() => session.requestHint(1)}
            text={session.hintData?.piece ? `Piece: ${session.hintData.piece}` : "Reveal the critical piece"}
          />
          <HintCard
            label="Move"
            cost="75 coins"
            active={!!session.hintData?.destination}
            onClick={() => session.requestHint(2)}
            text={session.hintData?.destination ? `Target square: ${session.hintData.destination}` : "Reveal the target square"}
          />
        </div>

        {session.feedback && (
          <div className={`rounded-2xl border p-4 ${session.feedback === "correct" ? "border-success/30 bg-success/10" : "border-live/30 bg-live/10"}`}>
            <p className="text-sm font-semibold">{session.feedback === "correct" ? "Correct move!" : "Not quite."}</p>
            {session.lastReveal?.explanation && <p className="mt-1 text-sm text-muted-foreground">{session.lastReveal.explanation}</p>}
          </div>
        )}

        <AnswerFooter
          feedback={session.feedback}
          isLastPuzzle={isLast}
          isGameOver={session.gameOver}
          autoAdvanceMs={5000}
          onAdvance={session.advance}
          closing={session.closing}
        />
      </div>
    </main>
  );
}

function WisdomDropScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [coinBalance, setCoinBalance] = useState(0);
  const session = useGameSession("wisdomdrop", playerId, coinBalance);

  useEffect(() => {
    const stored = getSession();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setPlayerId(stored.playerId);
    getDashboard(stored.playerId)
      .then((data) => setCoinBalance(data?.player?.coinBalance ?? 0))
      .catch(() => setCoinBalance(0))
      .finally(() => setReady(true));
  }, [router]);

  const intro = !session.sessionId;

  if (!ready) return <LoadingScreen />;

  if (session.result && session.gameOver) {
    return <ResultScreen gameType="wisdomdrop" result={session.result} onBack={() => router.push("/app")} />;
  }

  if (intro) {
    return <GameIntro gameType="wisdomdrop" loading={session.loading} onStart={() => session.start()} coinBalance={coinBalance} />;
  }

  const puzzle = session.currentPuzzle as { puzzleId: string; displayText: string; options: string[]; region: string } | null;
  const selectedAnswer = session.selectedAnswer;
  const eliminatedOptions = session.hintData?.eliminate ? session.hintData.eliminate.split(",") : [];
  const revealedAnswer = session.hintData?.answer ?? null;
  const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
  const currentIndex = session.currentPuzzleIndex;
  const total = session.totalPuzzles;
  const isLast = currentIndex + 1 >= total;

  return (
    <main className="mx-auto min-h-[100dvh] max-w-[430px] bg-background">
      <GameHeader
        title="WisdomDrop"
        lives={session.lives}
        startTime={session.startTime}
        running={session.running}
        puzzleIndex={currentIndex}
        totalPuzzles={total}
        onExit={session.exitEarly}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-4">
        <DrawLockBanner />

        {puzzle && (
          <div className="rounded-2xl bg-surface-1 border border-border shadow-card overflow-hidden">
            <div className="p-6">
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 border border-emerald/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald">
                  <Globe className="h-3 w-3" />
                  {puzzle.region}
                </span>
              </div>
              <p className="text-lg font-medium leading-relaxed text-foreground">"{puzzle.displayText}"</p>
            </div>

            <div className="px-4 pb-4 grid grid-cols-1 gap-3">
              {puzzle.options.map((option, index) => {
                const isEliminated = eliminatedOptions.includes(option);
                const isSelected = !!selectedAnswer && normalize(option) === normalize(selectedAnswer);
                const isCorrect = !!session.lastReveal?.correctAnswer && normalize(option) === normalize(session.lastReveal.correctAnswer);
                const showState = !!session.feedback;
                const isRevealed = !showState && !!revealedAnswer && normalize(option) === normalize(revealedAnswer);
                return (
                  <button
                    key={`${option}-${index}`}
                    onClick={() => session.submit(option)}
                    disabled={session.loading || session.gameOver || isEliminated || showState}
                    className={`h-14 rounded-xl text-sm font-semibold transition-all border min-h-[44px] inline-flex items-center justify-center gap-2 ${
                      showState && isCorrect ? "bg-success/15 border-success/40 text-success"
                        : showState && isSelected && !isCorrect ? "bg-live/15 border-live/40 text-live"
                        : !showState && isEliminated ? "bg-surface-1/30 border-border/30 text-muted-foreground/30 line-through cursor-not-allowed"
                        : !showState && isRevealed ? "bg-success/10 border-success/40 text-success ring-1 ring-success/30 shadow-glow"
                        : "bg-surface-1 border-border text-foreground hover:border-primary/40 hover:shadow-glow active:scale-[0.98]"
                    }`}
                  >
                    {showState && isCorrect && <Check className="h-4 w-4" />}
                    {showState && isSelected && !isCorrect && <Flame className="h-4 w-4" />}
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <HintCard
            label="Eliminate 2"
            cost="25 coins"
            active={!!session.hintData?.eliminate}
            onClick={() => session.requestHint(1)}
            text={session.hintData?.eliminate ? "Two wrong answers removed" : "Remove two wrong choices"}
          />
          <HintCard
            label="First letter"
            cost="75 coins"
            active={!!session.hintData?.startsWidth}
            onClick={() => session.requestHint(2)}
            text={session.hintData?.startsWidth ? `Starts with ${session.hintData.startsWidth}` : "Reveal the first letter"}
          />
          <HintCard
            label="Reveal"
            cost="150 coins"
            active={!!session.hintData?.answer}
            onClick={() => session.requestHint(3)}
            text={session.hintData?.answer ? `Answer: ${session.hintData.answer}` : "Reveal the answer"}
          />
        </div>

        {session.feedback && (
          <div className={`rounded-2xl border p-4 ${session.feedback === "correct" ? "border-success/30 bg-success/10" : "border-live/30 bg-live/10"}`}>
            <p className="text-sm font-semibold">{session.feedback === "correct" ? "Correct answer!" : "Keep going."}</p>
            {session.lastReveal?.originalProverb && <p className="mt-1 text-sm text-muted-foreground">"{session.lastReveal.originalProverb}"</p>}
          </div>
        )}

        <AnswerFooter
          feedback={session.feedback}
          isLastPuzzle={isLast}
          isGameOver={session.gameOver}
          autoAdvanceMs={4000}
          onAdvance={session.advance}
          closing={session.closing}
        />
      </div>
    </main>
  );
}

function GameIntro({
  gameType,
  loading,
  onStart,
  coinBalance,
}: {
  gameType: GameType;
  loading: boolean;
  onStart: () => void;
  coinBalance: number;
}) {
  const isCheckmate = gameType === "checkmate";
  const title = isCheckmate ? "CheckMate" : "WisdomDrop";
  const Icon = isCheckmate ? Swords : BookOpen;
  return (
    <main className="mx-auto min-h-[100dvh] max-w-[430px] bg-background relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full bg-emerald/10 blur-3xl z-0" />
      <Link href="/app" className="absolute left-4 top-4 z-20 h-10 w-10 rounded-xl bg-surface-1/70 backdrop-blur border border-border flex items-center justify-center hover:border-primary/40 transition-colors">
        <ArrowLeft className="h-5 w-5 text-foreground" />
      </Link>
      <div className="relative z-10 px-6 pt-24 pb-10 flex flex-col items-center min-h-[100dvh]">
        <div className="relative mb-7">
          <div className="absolute inset-0 rounded-full bg-emerald/30 blur-2xl" aria-hidden />
          <div className="relative h-24 w-24 rounded-full border border-emerald/40 bg-gradient-to-br from-surface-2 to-surface-1 shadow-glow flex items-center justify-center">
            <Icon className="h-11 w-11 text-emerald" strokeWidth={1.75} />
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-gradient-emerald">{title}</h1>
        <p className="mt-3 text-sm italic text-muted-foreground text-center max-w-[280px] leading-relaxed">
          {isCheckmate ? "Outthink the board, claim the crown." : "Finish the proverb. Inherit the wisdom."}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-1 border border-border px-3 py-1.5 text-xs font-medium">
            <Heart className="h-3.5 w-3.5 text-live" />
            <span className="tabular-nums">3 lives</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-1 border border-border px-3 py-1.5 text-xs font-medium">
            {isCheckmate ? <Puzzle className="h-3.5 w-3.5 text-xp" /> : <BookOpen className="h-3.5 w-3.5 text-xp" />}
            <span className="tabular-nums">10 {isCheckmate ? "puzzles" : "proverbs"}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-1 border border-border px-3 py-1.5 text-xs font-medium">
            <Crown className="h-3.5 w-3.5 text-emerald" />
            <span>Best move</span>
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center w-full py-4">
          <div className="w-full max-w-[280px] rounded-xl bg-surface-1 border border-border p-3 space-y-2 mx-4">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Example</p>
            {isCheckmate ? (
              <div className="grid grid-cols-4 gap-0 rounded-lg overflow-hidden">
                {Array.from({ length: 16 }).map((_, i) => {
                  const row = Math.floor(i / 4);
                  const col = i % 4;
                  const isQueen = row === 2 && col === 2;
                  const isKing = row === 0 && col === 0;
                  const isHint = row === 0 && col === 2;
                  return (
                    <div key={i} className={`relative aspect-square flex items-center justify-center ${isHint ? "checkmate-preview-hint" : (row + col) % 2 === 0 ? "checkmate-preview-light" : "checkmate-preview-dark"}`}>
                      {isQueen && <span aria-hidden className="text-3xl leading-none text-foreground/70">♕</span>}
                      {isKing && <span aria-hidden className="text-3xl leading-none text-muted-foreground">♚</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground leading-relaxed">"A child who is not taught at home will teach the village a ____"</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {["lesson", "song", "dance", "game"].map((opt) => (
                    <div key={opt} className="h-7 rounded-lg border border-border bg-surface-2 flex items-center justify-center text-[11px] text-muted-foreground">
                      {opt}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="w-full max-w-[320px] rounded-2xl bg-surface-1/70 backdrop-blur border border-border p-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-coin/15 border border-coin/20 flex items-center justify-center shrink-0">
              <Coins className="h-5 w-5 text-coin" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Earn up to <span className="text-coin tabular-nums">5 tickets</span> per round
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Plus XP, streak bonuses & weekly draws</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Coins available: {coinBalance}</p>
        </div>

        <button
          onClick={onStart}
          disabled={loading}
          className="group relative mt-4 h-14 w-full max-w-[320px] rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all shadow-glow disabled:opacity-50 overflow-hidden"
        >
          <span className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
          <span className="relative inline-flex items-center justify-center gap-2">
            {loading ? "Starting..." : <>Start Game <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
          </span>
        </button>
      </div>
    </main>
  );
}

function HintCard({
  label,
  cost,
  text,
  active,
  onClick,
}: {
  label: string;
  cost: string;
  text: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={`rounded-2xl border p-3 text-left transition-all shadow-card ${active ? "bg-primary/10 border-primary/30" : "bg-surface-1 border-border hover:border-primary/30"}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{cost}</p>
        </div>
        <Lightbulb className="h-4 w-4 text-coin" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{text}</p>
    </button>
  );
}

function ResultScreen({ gameType, result, onBack }: { gameType: GameType; result: any; onBack: () => void }) {
  const title = gameType === "checkmate" ? "CheckMate complete" : "WisdomDrop complete";
  return (
    <main className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface-1 border border-border p-5 shadow-card text-center space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-gold/20 flex items-center justify-center mx-auto">
          <Trophy className="h-7 w-7 text-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">Your round has been scored and added to this week&apos;s draw.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Entries" value={String(result.entries ?? 0)} />
          <Stat label="Coins" value={String(result.coins ?? 0)} />
          <Stat label="XP" value={String(result.xp ?? 0)} />
          <Stat label="Streak" value={String(result.streak ?? 0)} />
        </div>

        <button onClick={onBack} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold shadow-glow">
          Back to dashboard
        </button>
        <Link href="/results" className="block w-full h-12 rounded-xl border border-border bg-surface-2 text-foreground font-semibold flex items-center justify-center">
          View full results
        </Link>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/50 p-3">
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="min-h-[100dvh] bg-background flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </main>
  );
}
