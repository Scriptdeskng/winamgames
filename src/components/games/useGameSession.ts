import { useState, useRef, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { startSession, submitMove, useHint, closeSession } from "@/utils/game.functions";

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
};

export function useGameSession(gameType: "checkmate" | "wisdomdrop", playerId: string) {
  const [state, setState] = useState<GameSessionState>(INITIAL_STATE);
  const puzzleStartRef = useRef(Date.now());
  const navigate = useNavigate();

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

  const submit = useCallback(async (answer: string) => {
    if (!state.sessionId || !state.currentPuzzle || state.loading || state.gameOver) return;

    const puzzleId = (state.currentPuzzle as { puzzleId: string }).puzzleId;
    const timeMs = Date.now() - puzzleStartRef.current;
    const nextIdx = state.currentPuzzleIndex + 1;
    const nextPuzzleId = nextIdx < state.puzzleIds.length ? state.puzzleIds[nextIdx] : undefined;

    setState((s) => ({ ...s, loading: true, feedback: null }));

    try {
      const result = await submitMove({
        data: {
          sessionId: state.sessionId,
          puzzleId,
          answer,
          timeMs,
          nextPuzzleId,
        },
      }) as { correct: boolean; nextPuzzle: Record<string, string | string[]> | null };

      const newSolved = result.correct ? state.puzzlesSolved + 1 : state.puzzlesSolved;
      const newLives = result.correct ? state.lives : state.lives - 1;
      const isLastPuzzle = !result.nextPuzzle;
      const isDead = newLives <= 0;
      const isGameOver = isDead || (result.correct && isLastPuzzle);

      setState((s) => ({
        ...s,
        loading: false,
        feedback: result.correct ? "correct" : "incorrect",
        puzzlesSolved: newSolved,
        lives: newLives,
        currentPuzzleIndex: result.correct ? nextIdx : s.currentPuzzleIndex,
        currentPuzzle: result.correct && result.nextPuzzle ? result.nextPuzzle : s.currentPuzzle,
        currentHintTier: result.correct ? 0 : s.currentHintTier,
        hintData: result.correct ? null : s.hintData,
        gameOver: isGameOver,
        running: !isGameOver,
      }));

      if (result.correct) {
        puzzleStartRef.current = Date.now();
      }

      if (isGameOver) {
        const finalHints = state.hintsUsed;
        setTimeout(() => {
          endSession(newSolved, finalHints);
        }, 1500);
      }
    } catch (err) {
      console.error("Submit failed:", err);
      setState((s) => ({ ...s, loading: false }));
    }
  }, [state.sessionId, state.currentPuzzle, state.loading, state.gameOver, state.puzzleIds, state.currentPuzzleIndex, state.puzzlesSolved, state.lives, state.hintsUsed]);

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

  const endSession = useCallback(async (solved?: number, hints?: number) => {
    if (!state.sessionId) return;

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
        },
      });

      if (result.success) {
        // Encode completed missions as "title|type|amount;;..." for search params
        const missionsStr = (result.completedMissions ?? [])
          .map((m: { title: string; rewardType: string; rewardAmount: number }) =>
            `${m.title}|${m.rewardType}|${m.rewardAmount}`
          )
          .join(";;");

        navigate({
          to: "/results",
          search: {
            entries: result.entries,
            coins: result.coins,
            xp: result.xp,
            streak: result.streak,
            weekTotal: result.weekTotal,
            weekCap: result.weekCap,
            rankTier: result.rankTier ?? "pawn",
            previousRank: result.previousRank ?? "pawn",
            missions: missionsStr,
          },
        });
      }
    } catch (err) {
      console.error("Close session failed:", err);
      navigate({ to: "/" });
    }
  }, [state.sessionId, state.startTime, state.puzzlesSolved, state.hintsUsed, playerId, navigate]);

  const exitEarly = useCallback(() => {
    if (state.sessionId && state.running) {
      endSession();
    } else {
      navigate({ to: "/" });
    }
  }, [state.sessionId, state.running, endSession, navigate]);

  return {
    ...state,
    start,
    submit,
    requestHint,
    exitEarly,
  };
}
