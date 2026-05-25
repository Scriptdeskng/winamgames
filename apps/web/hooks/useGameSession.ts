"use client";

import { Chess, type Square } from "chess.js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { closeGameSession, requestHint, startGameSession, submitGameMove } from "@/lib/api";

const MAX_LIVES = 3;
const AUTO_ADVANCE_MS = 5000;

// ─── Types ────────────────────────────────────────────────────────────────────

export type PuzzleData =
  | {
      gameType: "checkmate";
      puzzleId: string;
      fen: string;
      theme: string;
      opponentFrom: string | null;
      opponentTo: string | null;
    }
  | {
      gameType: "wisdomdrop";
      puzzleId: string;
      displayText: string;
      options: string[];
      region: string;
      blank: string;
      originalProverb: string;
      explanation: string | null;
    };

export interface HintData {
  from?: string;
  piece?: string;
  destination?: string;
  eliminate?: string;
  startsWidth?: string;
  answer?: string;
}

export interface LastReveal {
  blank?: string;
  originalProverb?: string;
  region?: string;
  explanation?: string | null;
  selectedAnswer?: string;
}

export type GamePhase = "loading" | "playing" | "feedback" | "advancing" | "ended";

interface PendingAdvance {
  nextPuzzle: PuzzleData | null;
  nextIdx: number;
  isGameOver: boolean;
  isLivesOut: boolean;
  finalSolved: number;
  finalHints: number;
}

interface SubmitMoveResult {
  correct: boolean;
  nextPuzzle: PuzzleData | null;
  revealData: { from?: string; to?: string; blank?: string; originalProverb?: string; region?: string; explanation?: string | null; } | null;
}
interface UseHintResult { success: boolean; newBalance: number; hintData: HintData; }
interface CloseSessionResult {
  success: boolean; entries: number; baseEntries: number; streakBonus: number;
  coins: number; xp: number; streak: number; weekTotal: number; weekCap: number;
  rankTier: string; previousRank: string; completedMissions: unknown[];
}

// ─── Backend session helpers ─────────────────────────────────────────────────

async function startSession({ data }: { data: { playerId: string; gameType: "checkmate" | "wisdomdrop" } }) {
  const result = (await startGameSession(data.playerId, data.gameType)) as {
    sessionId: string;
    drawWeekId: string;
    puzzleIds?: string[];
    firstPuzzle?: Record<string, unknown> | null;
    totalPuzzles?: number;
  };
  const firstPuzzle = result.firstPuzzle
    ? { ...(result.firstPuzzle as Record<string, unknown>), gameType: data.gameType as PuzzleData["gameType"] }
    : null;
  return {
    success: true as const,
    sessionId: String(result.sessionId),
    drawWeekId: String(result.drawWeekId),
    puzzleIds: (result.puzzleIds ?? []).slice(),
    firstPuzzle: firstPuzzle as PuzzleData | null,
    totalPuzzles: Number(result.totalPuzzles ?? 0),
    allPuzzles: [],
  };
}

async function submitMove({ data }: { data: { sessionId: string; puzzleId: string; answer: string; timeMs: number; nextPuzzleId?: string; gameType: string } }): Promise<SubmitMoveResult> {
  const result = (await submitGameMove({
    sessionId: data.sessionId,
    puzzleId: data.puzzleId,
    answer: data.answer,
    timeMs: data.timeMs,
    nextPuzzleId: data.nextPuzzleId,
  })) as {
    correct?: boolean;
    nextPuzzle?: Record<string, unknown> | null;
    revealData?: SubmitMoveResult["revealData"];
  };
  return {
    correct: Boolean(result.correct),
    nextPuzzle: result.nextPuzzle
      ? ({
          ...(result.nextPuzzle as Record<string, unknown>),
          gameType: data.gameType as PuzzleData["gameType"],
        } as PuzzleData)
      : null,
    revealData: result.revealData ?? null,
  };
}

async function useHint({ data }: { data: { playerId: string; puzzleId: string; tier: number; gameType: "checkmate" | "wisdomdrop" } }): Promise<UseHintResult> {
  const result = await requestHint({
    playerId: data.playerId,
    puzzleId: data.puzzleId,
    tier: data.tier,
  });
  return {
    success: Boolean((result as { success?: boolean }).success),
    newBalance: Number((result as { newBalance?: number }).newBalance ?? 0),
    hintData: (result as { hintData?: HintData }).hintData ?? {},
  };
}

async function closeSession({ data }: { data: { sessionId: string; playerId: string; gameType: "checkmate" | "wisdomdrop"; drawWeekId?: string; puzzlesSolved: number; hintsUsed: number; durationSeconds: number; completionReason: "completed" | "lives_out" | "exited" } }): Promise<CloseSessionResult> {
  const result = await closeGameSession({
    sessionId: data.sessionId,
    playerId: data.playerId,
    gameType: data.gameType,
    drawWeekId: data.drawWeekId,
    puzzlesSolved: data.puzzlesSolved,
    hintsUsed: data.hintsUsed,
    durationSeconds: data.durationSeconds,
    completionReason: data.completionReason,
  });
  return {
    success: true,
    entries: Number((result as { entries?: number }).entries ?? 0),
    baseEntries: Number((result as { baseEntries?: number }).baseEntries ?? 0),
    streakBonus: Number((result as { streakBonus?: number }).streakBonus ?? 0),
    coins: Number((result as { coins?: number }).coins ?? 0),
    xp: Number((result as { xp?: number }).xp ?? 0),
    streak: Number((result as { streak?: number }).streak ?? 0),
    weekTotal: Number((result as { weekTotal?: number }).weekTotal ?? 0),
    weekCap: Number((result as { weekCap?: number }).weekCap ?? 50),
    rankTier: String((result as { rankTier?: string }).rankTier ?? "starter"),
    previousRank: String((result as { previousRank?: string }).previousRank ?? "starter"),
    completedMissions: (result as { completedMissions?: unknown[] }).completedMissions ?? [],
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseGameSessionOptions {
  playerId: string;
  gameType: "checkmate" | "wisdomdrop";
  coinBalance: number;
  onCoinBalanceChange: (balance: number) => void;
}

export interface UseGameSessionReturn {
  phase: GamePhase;
  sessionId: string | null;
  drawWeekId: string | null;
  currentPuzzle: PuzzleData | null;
  puzzleNumber: number;
  totalPuzzles: number;
  lives: number;
  maxLives: number;
  elapsedMs: number;
  feedback: "correct" | "wrong" | null;
  autoAdvanceProgress: number;
  autoAdvanceMs: number;
  isSubmitting: boolean;
  hintData: HintData | null;
  hintTierUsed: number;
  selectedSquare: string | null;
  legalTargets: string[];
  lastMove: { from: string; to: string } | null;
  revealMove: { from: string; to: string } | null;
  lastReveal: LastReveal | null;
  puzzlesSolved: number;
  hintsUsed: number;
  isLastPuzzle: boolean;
  onSquareClick: (square: string) => void;
  requestHint: (tier: number) => Promise<void>;
  skipAdvance: () => void;
  exitSession: () => void;
  startGame: () => void;
}

export function useGameSession({
  playerId,
  gameType,
  coinBalance: _coinBalance,
  onCoinBalanceChange,
}: UseGameSessionOptions): UseGameSessionReturn {
  const router = useRouter();

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [drawWeekId, setDrawWeekId] = useState<string | null>(null);
  const [allPuzzles, setAllPuzzles] = useState<Record<string, unknown>[]>([]);
  const [puzzleIds, setPuzzleIds] = useState<string[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleData | null>(null);
  const [puzzleNumber, setPuzzleNumber] = useState(1);
  const [totalPuzzles, setTotalPuzzles] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hintData, setHintData] = useState<HintData | null>(null);
  const [hintTierUsed, setHintTierUsed] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalTargets, setLegalTargets] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [revealMove, setRevealMove] = useState<{ from: string; to: string } | null>(null);
  const [lastReveal, setLastReveal] = useState<LastReveal | null>(null);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [autoAdvanceProgress, setAutoAdvanceProgress] = useState(0);
  const [started, setStarted] = useState(false);

  // Refs
  const chessRef = useRef(new Chess());
  const puzzleStartRef = useRef(Date.now());
  const sessionStartRef = useRef(Date.now());
  const pendingAdvanceRef = useRef<PendingAdvance | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endingRef = useRef(false);
  const proverbsRef = useRef<Array<{
    displayText: string;
    blank: string;
    originalProverb: string;
    region: string;
    explanation: string | null;
  }>>([]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  // Timer — runs during playing and feedback
  useEffect(() => {
    if (phase !== "playing" && phase !== "feedback") return;
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - sessionStartRef.current);
    }, 100);
    return () => window.clearInterval(id);
  }, [phase]);

  const resetSelection = useCallback(() => {
    setSelectedSquare(null);
    setLegalTargets([]);
  }, []);

  const loadPuzzle = useCallback((puzzle: PuzzleData) => {
    if (puzzle.gameType === "checkmate") {
      chessRef.current.load(puzzle.fen);
      if (puzzle.opponentFrom && puzzle.opponentTo) {
        setLastMove({ from: puzzle.opponentFrom, to: puzzle.opponentTo });
      } else {
        setLastMove(null);
      }
    } else {
      setLastMove(null);
    }
    setCurrentPuzzle(puzzle);
    setHintData(null);
    setHintTierUsed(0);
    setRevealMove(null);
    setLastReveal(null);
    resetSelection();
    puzzleStartRef.current = Date.now();
  }, [resetSelection]);

  // finishSession receives finalSolved and finalHints to avoid stale state
  const finishSession = useCallback(async (
    reason: "completed" | "lives" | "exit",
    finalSolved?: number,
    finalHints?: number,
  ) => {
    if (endingRef.current || !sessionId) return;
    endingRef.current = true;
    setPhase("ended");
    const durationSeconds = Math.floor((Date.now() - sessionStartRef.current) / 1000);
    const result = await closeSession({
      data: {
        sessionId, playerId, gameType,
        drawWeekId: drawWeekId ?? undefined,
        puzzlesSolved: finalSolved ?? puzzlesSolved,
        hintsUsed: finalHints ?? hintsUsed,
        durationSeconds,
        completionReason:
          reason === "completed"
            ? "completed"
            : reason === "lives"
              ? "lives_out"
              : "exited",
      },
    });
    const params = new URLSearchParams({
      sessionId, gameType,
      entries: String(result.entries),
      baseEntries: String(result.baseEntries),
      streakBonus: String(result.streakBonus),
      coins: String(result.coins),
      xp: String(result.xp),
      streak: String(result.streak),
      weekTotal: String(result.weekTotal),
      weekCap: String(result.weekCap),
      rankTier: result.rankTier,
      previousRank: result.previousRank,
      drawWeekId: drawWeekId ?? "",
      missions: "",
      puzzlesSolved: String(finalSolved ?? puzzlesSolved),
    });
    if (proverbsRef.current.length > 0) {
      try {
        sessionStorage.setItem("winam_proverb_review", JSON.stringify(proverbsRef.current));
      } catch {
        // sessionStorage unavailable, skip
      }
    }
    router.push(`/results?${params.toString()}`);
  }, [drawWeekId, gameType, hintsUsed, playerId, puzzleIds, puzzlesSolved, router, sessionId]);

  const advanceToNext = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }

    const pending = pendingAdvanceRef.current;
    if (!pending) return;
    pendingAdvanceRef.current = null;

    if (pending.isGameOver) {
      void finishSession(
        pending.isLivesOut ? "lives" : "completed",
        pending.finalSolved,
        pending.finalHints,
      );
      return;
    }

    setPuzzleNumber((n) => n + 1);
    loadPuzzle(pending.nextPuzzle!);
    setFeedback(null);
    setAutoAdvanceProgress(0);
    setPhase("playing");
  }, [finishSession, loadPuzzle]);

  const skipAdvance = useCallback(() => {
    if (phase !== "feedback") return;
    advanceToNext();
  }, [advanceToNext, phase]);

  const handleSubmitAnswer = useCallback(async (answer: string) => {
    if (!sessionId || !currentPuzzle || isSubmitting || phase !== "playing") return;
    setIsSubmitting(true);
    const timeMs = Date.now() - puzzleStartRef.current;
    try {
      const nextPuzzleId = puzzleNumber < puzzleIds.length ? puzzleIds[puzzleNumber] : undefined;
      const result = await submitMove({
        data: { sessionId, puzzleId: currentPuzzle.puzzleId, answer, timeMs, nextPuzzleId, gameType },
      });

      const newSolved = result.correct ? puzzlesSolved + 1 : puzzlesSolved;
      const newLives = result.correct ? lives : lives - 1;
      const isLastPuzzle = !result.nextPuzzle;
      const isDead = newLives <= 0;
      const isGameOver = isDead || isLastPuzzle;

      pendingAdvanceRef.current = {
        nextPuzzle: result.nextPuzzle,
        nextIdx: puzzleNumber,
        isGameOver,
        isLivesOut: newLives <= 0,
        finalSolved: newSolved,
        finalHints: hintsUsed,
      };

      if (result.correct) {
        setPuzzlesSolved(newSolved);
        setFeedback("correct");
        setPhase("feedback");
        if (result.revealData?.from && result.revealData?.to) {
          setRevealMove({ from: result.revealData.from, to: result.revealData.to });
        }
        // Auto-advance after timer
        advanceTimerRef.current = setTimeout(() => {
          advanceToNext();
        }, AUTO_ADVANCE_MS);
      } else {
        setFeedback("wrong");
        setPhase("feedback");
        setLives(newLives);
        if (result.revealData?.from && result.revealData?.to) {
          setRevealMove({ from: result.revealData.from, to: result.revealData.to });
        }
        if (gameType === "wisdomdrop" && result.revealData) {
          setLastReveal({
            blank: result.revealData.blank,
            originalProverb: result.revealData.originalProverb,
            region: result.revealData.region,
            explanation: result.revealData.explanation ?? null,
            selectedAnswer: answer,
          });
        }
      }

      if (gameType === "wisdomdrop" && result.correct && result.revealData) {
        setLastReveal({
          blank: result.revealData.blank,
          originalProverb: result.revealData.originalProverb,
          region: result.revealData.region,
          explanation: result.revealData.explanation ?? null,
          selectedAnswer: answer,
        });
      }

      if (gameType === "wisdomdrop" && result.revealData) {
        const blank = result.revealData.blank ?? "";
        const displayText = (currentPuzzle as { displayText?: string }).displayText ?? "";
        proverbsRef.current.push({
          displayText: displayText.replace("____", blank),
          blank,
          originalProverb: result.revealData.originalProverb ?? "",
          region: result.revealData.region ?? "",
          explanation: result.revealData.explanation ?? null,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [advanceToNext, allPuzzles, currentPuzzle, gameType, hintsUsed, isSubmitting, lives, phase, puzzleIds, puzzleNumber, puzzlesSolved, sessionId]);

  const onSquareClick = useCallback((square: string) => {
    if (!currentPuzzle) return;
    if (currentPuzzle.gameType === "wisdomdrop") {
      void handleSubmitAnswer(square);
      return;
    }
    // Checkmate selection logic
    if (phase !== "playing" || isSubmitting) return;
    if (selectedSquare) {
      if (legalTargets.includes(square)) {
        void handleSubmitAnswer(JSON.stringify({ from: selectedSquare, to: square }));
        setSelectedSquare(null);
        setLegalTargets([]);
      } else {
        setSelectedSquare(square);
        try {
          const moves = chessRef.current.moves({ square: square as Square, verbose: true });
          setLegalTargets(moves.map((m) => m.to));
        } catch {
          setLegalTargets([]);
        }
      }
    } else {
      setSelectedSquare(square);
      try {
        const moves = chessRef.current.moves({ square: square as Square, verbose: true });
        setLegalTargets(moves.map((m) => m.to));
      } catch {
        setLegalTargets([]);
      }
    }
  }, [currentPuzzle, handleSubmitAnswer, isSubmitting, legalTargets, phase, selectedSquare]);

  const requestHint = useCallback(async (tier: number) => {
    if (!currentPuzzle || phase !== "playing" || tier <= hintTierUsed) return;
    const result = await useHint({
      data: { playerId, puzzleId: currentPuzzle.puzzleId, tier, gameType },
    });
    if (result.success) {
      setHintsUsed((n) => n + 1);
      setHintTierUsed(tier);
      setHintData((prev) => ({ ...prev, ...result.hintData }));
      onCoinBalanceChange(result.newBalance);
    }
  }, [currentPuzzle, gameType, hintTierUsed, onCoinBalanceChange, phase, playerId]);

  const exitSession = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    pendingAdvanceRef.current = null;
    void finishSession("exit");
  }, [finishSession]);

  const startGame = useCallback(() => {
    setStarted(true);
  }, []);

  // Init session when started
  useEffect(() => {
    if (!playerId || !started) return;
    let cancelled = false;
    async function init() {
      const result = await startSession({ data: { playerId, gameType } });
      if (cancelled || !result.success) {
        router.push("/app");
        return;
      }
      setSessionId(result.sessionId);
      setDrawWeekId(result.drawWeekId);
      setPuzzleIds(result.puzzleIds);
      setAllPuzzles(result.allPuzzles);
      setTotalPuzzles(result.totalPuzzles);
      setPuzzleNumber(1);
      sessionStartRef.current = Date.now();
      if (result.firstPuzzle) {
        loadPuzzle(result.firstPuzzle);
      }
      setPhase("playing");
    }
    void init();
    return () => { cancelled = true; };
  }, [gameType, loadPuzzle, playerId, router, started]);

  const isLastPuzzle = !pendingAdvanceRef.current?.nextPuzzle && !!pendingAdvanceRef.current;

  return {
    phase, sessionId, drawWeekId, currentPuzzle, puzzleNumber, totalPuzzles,
    lives, maxLives: MAX_LIVES, elapsedMs, feedback, autoAdvanceProgress,
    autoAdvanceMs: AUTO_ADVANCE_MS, isSubmitting, hintData, hintTierUsed,
    selectedSquare, legalTargets, lastMove, revealMove, lastReveal,
    puzzlesSolved, hintsUsed, isLastPuzzle,
    onSquareClick, requestHint, skipAdvance, exitSession, startGame,
  };
}
