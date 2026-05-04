import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { startSession, submitMove, useHint, closeSession } from "@/utils/game.functions";

interface RevealData {
  correctAnswer: string;
  blank: string;
  originalProverb: string;
  region: string;
  explanation: string | null;
}

interface PendingAdvance {
  nextPuzzle: Record<string, unknown> | null;
  nextIdx: number;
  isGameOver: boolean;
  finalSolved: number;
  finalHints: number;
}

interface GameSessionState {
  sessionId: string | null;
  drawWeekId: string | null;
  puzzleIds: string[];
  currentPuzzleIndex: number;
  currentPuzzle: Record<string, unknown> | null;
  totalPuzzles: number;
  lives: number;
  puzzlesSolved: number;
  hintsUsed: number;
  currentHintTier: number;
  coinBalance: number;
  startTime: number;
  running: boolean;
  loading: boolean;
  feedback: "correct" | "incorrect" | null;
  hintData: Record<string, string> | null;
  gameOver: boolean;
  lastReveal: RevealData | null;
  awaitingAdvance: boolean;
  selectedAnswer: string | null;
  closing: boolean;
}

const INITIAL_STATE: GameSessionState = {
  sessionId: null,
  drawWeekId: null,
  puzzleIds: [],
  currentPuzzleIndex: 0,
  currentPuzzle: null,
  totalPuzzles: 0,
  lives: 3,
  puzzlesSolved: 0,
  hintsUsed: 0,
  currentHintTier: 0,
  coinBalance: 0,
  startTime: Date.now(),
  running: false,
  loading: false,
  feedback: null,
  hintData: null,
  gameOver: false,
  lastReveal: null,
  awaitingAdvance: false,
  selectedAnswer: null,
  closing: false,
};

// Auto-advance windows tuned per game type.
const AUTO_ADVANCE_MS: Record<"checkmate" | "wisdomdrop", number> = {
  wisdomdrop: 4000,
  checkmate: 5000,
};

export function useGameSession(gameType: "checkmate" | "wisdomdrop", playerId: string) {
  const [state, setState] = useState<GameSessionState>(INITIAL_STATE);
  const puzzleStartRef = useRef(Date.now());
  const pendingAdvanceRef = useRef<PendingAdvance | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const autoAdvanceMs = AUTO_ADVANCE_MS[gameType];

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  const start = useCallback(async (coins: number) => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const result = await startSession({ data: { playerId, gameType } });
      if (!result.success) {
        setState((s) => ({ ...s, loading: false }));
        return;
      }
      puzzleStartRef.current = Date.now();
      setState({
        ...INITIAL_STATE,
        sessionId: result.sessionId,
        drawWeekId: result.drawWeekId,
        puzzleIds: result.puzzleIds,
        currentPuzzle: result.firstPuzzle,
        totalPuzzles: result.totalPuzzles,
        coinBalance: coins,
        startTime: Date.now(),
        running: true,
        loading: false,
      });
    } catch (err) {
      console.error("Failed to start session:", err);
      setState((s) => ({ ...s, loading: false }));
    }
  }, [playerId, gameType]);

  const endSession = useCallback(async (solved?: number, hints?: number) => {
    if (!state.sessionId || state.closing) return;
    setState((s) => ({ ...s, closing: true }));

    const duration = Math.floor((Date.now() - state.startTime) / 1000);
    const finalSolved = solved ?? state.puzzlesSolved;
    const finalHints = hints ?? state.hintsUsed;

    try {
      const result = await closeSession({
        data: {
          sessionId: state.sessionId,
          playerId,
          puzzlesSolved: finalSolved,
          hintsUsed: finalHints,
          durationSeconds: duration,
          servedPuzzleIds: state.puzzleIds,
        },
      });

      if (result.success) {
        const missionsStr = (result.completedMissions ?? [])
          .map((m: { title: string; rewardAmount: number }) =>
            `${m.title}|${m.rewardAmount}`
          )
          .join(";;");

        navigate({
          to: "/results",
          search: {
            entries: result.entries,
            baseEntries: result.baseEntries ?? 0,
            streakBonus: result.streakBonus ?? 0,
            coins: result.coins,
            xp: result.xp,
            streak: result.streak,
            weekTotal: result.weekTotal,
            weekCap: result.weekCap,
            rankTier: result.rankTier ?? "starter",
            previousRank: result.previousRank ?? "starter",
            missions: missionsStr,
            puzzlesSolved: finalSolved,
            gameType,
          },
        });
      } else {
        navigate({ to: "/app" });
      }
    } catch (err) {
      console.error("Close session failed:", err);
      navigate({ to: "/app" });
    }
  }, [state.sessionId, state.closing, state.startTime, state.puzzlesSolved, state.hintsUsed, state.puzzleIds, playerId, navigate, gameType]);

  /**
   * Apply the queued advance: either move to the next puzzle or end the session.
   * Safe to call multiple times — the pending ref is consumed on the first call.
   */
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
  }, [state.closing, endSession]);

  const submit = useCallback(async (answer: string) => {
    if (!state.sessionId || !state.currentPuzzle || state.loading || state.gameOver) return;
    if (state.awaitingAdvance) return; // ignore stray submits while feedback is shown

    const puzzleId = (state.currentPuzzle as { puzzleId: string }).puzzleId;
    const timeMs = Date.now() - puzzleStartRef.current;
    const nextIdx = state.currentPuzzleIndex + 1;
    const nextPuzzleId = nextIdx < state.puzzleIds.length ? state.puzzleIds[nextIdx] : undefined;

    setState((s) => ({ ...s, loading: true, feedback: null, lastReveal: null, selectedAnswer: answer }));

    try {
      const result = await submitMove({
        data: {
          sessionId: state.sessionId,
          puzzleId,
          answer,
          timeMs,
          nextPuzzleId,
        },
      }) as {
        correct: boolean;
        submittedAnswer?: string;
        nextPuzzle: Record<string, string | string[]> | null;
        revealData: RevealData | null;
      };

      const newSolved = result.correct ? state.puzzlesSolved + 1 : state.puzzlesSolved;
      const newLives = result.correct ? state.lives : state.lives - 1;
      const isLastPuzzle = !result.nextPuzzle;
      const isDead = newLives <= 0;
      const isGameOver = isDead || isLastPuzzle;
      const finalHints = state.hintsUsed;

      // Queue the advance — consumed by `advance()` (button) or auto-timer (correct only).
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
        lastReveal: result.revealData,
        awaitingAdvance: true,
        selectedAnswer: result.submittedAnswer ?? answer,
      }));

      // Only correct answers auto-advance. Wrong answers wait for player tap
      // so they can read the reveal at their own pace.
      if (result.correct) {
        if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = setTimeout(() => {
          advance();
        }, autoAdvanceMs);
      }
    } catch (err) {
      console.error("Submit failed:", err);
      setState((s) => ({ ...s, loading: false }));
    }
  }, [state.sessionId, state.currentPuzzle, state.loading, state.gameOver, state.awaitingAdvance, state.puzzleIds, state.currentPuzzleIndex, state.puzzlesSolved, state.lives, state.hintsUsed, autoAdvanceMs, advance]);

  const requestHint = useCallback(async (tier: 1 | 2 | 3) => {
    if (!state.currentPuzzle || state.loading) return;
    const puzzleId = (state.currentPuzzle as { puzzleId: string }).puzzleId;

    setState((s) => ({ ...s, loading: true }));
    try {
      const result = await useHint({ data: { playerId, puzzleId, tier } });
      if (result.success) {
        setState((s) => ({
          ...s,
          loading: false,
          hintsUsed: s.hintsUsed + 1,
          currentHintTier: tier,
          coinBalance: result.newBalance,
          hintData: result.hintData,
        }));
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    } catch (err) {
      console.error("Hint failed:", err);
      setState((s) => ({ ...s, loading: false }));
    }
  }, [state.currentPuzzle, state.loading, playerId]);

  const exitEarly = useCallback(() => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    pendingAdvanceRef.current = null;
    if (state.sessionId && state.running) {
      endSession();
    } else {
      navigate({ to: "/app" });
    }
  }, [state.sessionId, state.running, endSession, navigate]);

  // Whether the next-puzzle is the same as the current (i.e. this answer ends the round).
  const isLastPuzzle = !pendingAdvanceRef.current?.nextPuzzle;

  return {
    ...state,
    autoAdvanceMs,
    isLastPuzzle,
    start,
    submit,
    requestHint,
    advance,
    exitEarly,
  };
}
