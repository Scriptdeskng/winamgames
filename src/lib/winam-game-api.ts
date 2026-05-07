import { winamApiPost } from "@/lib/winam-api";

export async function startSession(input: { playerId: string; gameType: "checkmate" | "wisdomdrop" }) {
  return await winamApiPost<{
    success: boolean;
    sessionId?: string;
    drawWeekId?: string;
    puzzleIds?: string[];
    firstPuzzle?: Record<string, unknown> | null;
    totalPuzzles?: number;
    error?: string;
  }>("/sessions/start", {
    player_id: input.playerId,
    game_type: input.gameType,
  });
}

export async function submitMove(input: {
  sessionId: string;
  puzzleId: string;
  answer: string;
  timeMs: number;
  nextPuzzleId?: string;
}) {
  return await winamApiPost<{
    correct: boolean;
    submittedAnswer: string;
    nextPuzzle?: Record<string, unknown> | null;
    revealData?: Record<string, unknown> | null;
  }>("/sessions/move", {
    session_id: input.sessionId,
    puzzle_id: input.puzzleId,
    answer: input.answer,
    time_ms: input.timeMs,
    next_puzzle_id: input.nextPuzzleId ?? null,
  });
}

export async function useHint(input: { playerId: string; puzzleId: string; tier: number }) {
  return await winamApiPost<{
    success: boolean;
    hintData?: Record<string, string>;
    newBalance?: number;
    error?: string;
  }>("/sessions/hint", {
    player_id: input.playerId,
    puzzle_id: input.puzzleId,
    tier: input.tier,
  });
}

export async function closeSession(input: {
  sessionId: string;
  playerId: string;
  puzzlesSolved: number;
  hintsUsed: number;
  durationSeconds: number;
  servedPuzzleIds?: string[];
}) {
  return await winamApiPost<{
    success: boolean;
    entries?: number;
    sessionEntries?: number;
    baseEntries?: number;
    streakBonus?: number;
    missionEntries?: number;
    coins?: number;
    xp?: number;
    streak?: number;
    weekTotal?: number;
    weekCap?: number;
    overflow?: number;
    rankTier?: string;
    previousRank?: string;
    completedMissions?: Array<{ title: string; rewardAmount: number }>;
    error?: string;
  }>("/sessions/close", {
    session_id: input.sessionId,
    player_id: input.playerId,
    puzzles_solved: input.puzzlesSolved,
    hints_used: input.hintsUsed,
    duration_seconds: input.durationSeconds,
    served_puzzle_ids: input.servedPuzzleIds ?? [],
  });
}
