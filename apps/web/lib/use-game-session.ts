"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { closeGameSession, startGameSession, submitGameMove, useGameHint } from "@/lib/api";

type GameType = "checkmate" | "wisdomdrop";
type Feedback = "correct" | "incorrect" | null;

type RevealData = {
  correctAnswer: string;
  blank: string;
  originalProverb: string;
  region: string;
  explanation: string | null;
};

type PendingAdvance = {
  nextPuzzle: Record<string, unknown> | null;
  nextIdx: number;
  isGameOver: boolean;
  finalSolved: number;
  finalHints: number;
};

const INITIAL_STATE = {
  sessionId: null as string | null,
  drawWeekId: null as string | null,
  puzzleIds: [] as string[],
  currentPuzzleIndex: 0,
  currentPuzzle: null as Record<string, unknown> | null,
  totalPuzzles: 0,
  lives: 3,
  puzzlesSolved: 0,
  hintsUsed: 0,
  currentHintTier: 0,
  coinBalance: 0,
  startTime: Date.now(),
  running: false,
  loading: false,
  feedback: null as Feedback,
  hintData: null as Record<string, string> | null,
  gameOver: false,
  lastReveal: null as RevealData | null,
  awaitingAdvance: false,
  selectedAnswer: null as string | null,
  closing: false,
  result: null as null | Record<string, any>,
};

const AUTO_ADVANCE_MS: Record<GameType, number> = {
  wisdomdrop: 4000,
  checkmate: 5000,
};

const LAST_RESULT_KEY = "winam.last-result";

export function useGameSession(gameType: GameType, playerId: string, initialCoins = 0) {
  const [state, setState] = useState({ ...INITIAL_STATE, coinBalance: initialCoins });
  const pendingAdvanceRef = useRef<PendingAdvance | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const puzzleStartRef = useRef(Date.now());

  useEffect(() => {
    if (state.sessionId) return;
    setState((current) => ({ ...current, coinBalance: initialCoins }));
  }, [initialCoins, state.sessionId]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const endSession = useCallback(
    async (solved?: number, hints?: number) => {
      if (!state.sessionId || state.closing) return;
      setState((s) => ({ ...s, closing: true }));

      const duration = Math.max(0, Math.floor((Date.now() - state.startTime) / 1000));
      const finalSolved = solved ?? state.puzzlesSolved;
      const finalHints = hints ?? state.hintsUsed;

      try {
        const result = await closeGameSession({
          playerId,
          sessionId: state.sessionId,
          gameType,
          durationSeconds: duration,
          puzzlesSolved: finalSolved,
          hintsUsed: finalHints,
        });

        if (result?.success) {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              LAST_RESULT_KEY,
              JSON.stringify({
                gameType,
                playerId,
                puzzlesSolved: finalSolved,
                hintsUsed: finalHints,
                completedAt: new Date().toISOString(),
                ...result,
              }),
            );
          }
          setState((s) => ({ ...s, closing: false, gameOver: true, running: false, result }));
        } else {
          setState((s) => ({ ...s, closing: false, gameOver: true, running: false, result: null }));
        }
      } catch {
        setState((s) => ({ ...s, closing: false, gameOver: true, running: false, result: null }));
      }
    },
    [gameType, playerId, state.closing, state.hintsUsed, state.puzzlesSolved, state.sessionId, state.startTime],
  );

  const advance = useCallback(() => {
    if (state.closing) return;
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }

    const pending = pendingAdvanceRef.current;
    if (!pending) return;
    pendingAdvanceRef.current = null;

    if (pending.isGameOver) {
      endSession(pending.finalSolved, pending.finalHints);
      return;
    }

    puzzleStartRef.current = Date.now();
    setState((s) => ({
      ...s,
      loading: false,
      feedback: null,
      lastReveal: null,
      awaitingAdvance: false,
      selectedAnswer: null,
      currentPuzzleIndex: pending.nextIdx,
      currentPuzzle: pending.nextPuzzle ?? s.currentPuzzle,
      currentHintTier: 0,
      hintData: null,
    }));
  }, [endSession, state.closing]);

  const start = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const result = await startGameSession(playerId, gameType);
      if (!result?.success) {
        setState((s) => ({ ...s, loading: false }));
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(LAST_RESULT_KEY);
      }

      puzzleStartRef.current = Date.now();
      setState({
        ...INITIAL_STATE,
        coinBalance: initialCoins,
        sessionId: result.sessionId,
        drawWeekId: result.drawWeekId,
        puzzleIds: result.puzzleIds ?? [],
        currentPuzzle: result.firstPuzzle ?? null,
        totalPuzzles: result.totalPuzzles ?? 0,
        running: true,
        loading: false,
        startTime: Date.now(),
      });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [gameType, initialCoins, playerId]);

  const submit = useCallback(
    async (answer: string) => {
      if (!state.sessionId || !state.currentPuzzle || state.loading || state.gameOver || state.awaitingAdvance) return;

      const puzzleId = String((state.currentPuzzle as { puzzleId?: string }).puzzleId ?? "");
      const timeMs = Date.now() - puzzleStartRef.current;
      const nextIdx = state.currentPuzzleIndex + 1;
      const nextPuzzleId = nextIdx < state.puzzleIds.length ? state.puzzleIds[nextIdx] : undefined;

      setState((s) => ({ ...s, loading: true, feedback: null, lastReveal: null, selectedAnswer: answer }));
      try {
        const result = await submitGameMove({
          sessionId: state.sessionId,
          puzzleId,
          answer,
          timeMs,
          nextPuzzleId,
        });

        const newSolved = result.correct ? state.puzzlesSolved + 1 : state.puzzlesSolved;
        const newLives = result.correct ? state.lives : state.lives - 1;
        const isGameOver = newLives <= 0 || !result.nextPuzzle;
        const finalHints = state.hintsUsed;

        pendingAdvanceRef.current = {
          nextPuzzle: result.nextPuzzle,
          nextIdx,
          isGameOver,
          finalSolved: newSolved,
          finalHints,
        };

        setState((s) => ({
          ...s,
          loading: false,
          feedback: result.correct ? "correct" : "incorrect",
          puzzlesSolved: newSolved,
          lives: newLives,
          gameOver: isGameOver,
          running: !isGameOver,
          lastReveal: result.revealData ?? null,
          awaitingAdvance: true,
          selectedAnswer: answer,
        }));

        if (result.correct && !isGameOver) {
          if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
          advanceTimerRef.current = setTimeout(() => advance(), AUTO_ADVANCE_MS[gameType]);
        }

        if (isGameOver) {
          advanceTimerRef.current = setTimeout(() => advance(), 700);
        }
      } catch {
        setState((s) => ({ ...s, loading: false }));
      }
    },
    [advance, gameType, state.awaitingAdvance, state.currentPuzzle, state.currentPuzzleIndex, state.gameOver, state.loading, state.lives, state.puzzlesSolved, state.puzzleIds, state.sessionId, state.hintsUsed],
  );

  const requestHint = useCallback(
    async (tier: 1 | 2 | 3) => {
      if (!state.currentPuzzle || state.loading) return;
      const puzzleId = String((state.currentPuzzle as { puzzleId?: string }).puzzleId ?? "");

      setState((s) => ({ ...s, loading: true }));
      try {
        const result = await useGameHint({
          playerId,
          puzzleId,
          tier,
        });

        if (result?.success) {
          setState((s) => ({
            ...s,
            loading: false,
            hintsUsed: s.hintsUsed + 1,
            currentHintTier: tier,
            coinBalance: result.newBalance ?? s.coinBalance,
            hintData: result.hintData ?? null,
          }));
        } else {
          setState((s) => ({ ...s, loading: false }));
        }
      } catch {
        setState((s) => ({ ...s, loading: false }));
      }
    },
    [playerId, state.currentPuzzle, state.loading],
  );

  const exitEarly = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    pendingAdvanceRef.current = null;
    if (state.sessionId && state.running) {
      endSession();
    }
  }, [endSession, state.running, state.sessionId]);

  return {
    ...state,
    start,
    submit,
    requestHint,
    advance,
    exitEarly,
  };
}
