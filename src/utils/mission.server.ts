/**
 * Server-only helpers for mission condition evaluation.
 * NEVER import this file from client code.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface MissionCondition {
  missionId: string;
  playerMissionId: string;
  conditionType: string;
  conditionValue: number;
  rewardType: string;
  rewardAmount: number;
  title: string;
}

export interface MissionEvalResult {
  missionId: string;
  playerMissionId: string;
  title: string;
  completed: boolean;
  rewardType: string;
  rewardAmount: number;
}

interface SessionStats {
  totalPuzzlesSolved: number;
  hasNoHintsSession: boolean;
  distinctGameTypes: number;
  currentStreak: number;
}

/**
 * Gather today's session stats for a player (WAT timezone).
 */
export async function getTodaySessionStats(
  supabase: SupabaseClient,
  playerId: string,
  watDate: string
): Promise<SessionStats> {
  const { data: sessions } = await supabase
    .from("winam_game_sessions")
    .select("puzzles_solved, hints_used, game_type")
    .eq("player_id", playerId)
    .eq("session_date_wat", watDate);

  const { data: player } = await supabase
    .from("winam_players")
    .select("current_streak")
    .eq("id", playerId)
    .single();

  const totalPuzzlesSolved = sessions
    ? sessions.reduce((sum, s) => sum + s.puzzles_solved, 0)
    : 0;
  const hasNoHintsSession = sessions
    ? sessions.some((s) => s.hints_used === 0 && s.puzzles_solved > 0)
    : false;
  const distinctGameTypes = sessions
    ? new Set(sessions.map((s) => s.game_type)).size
    : 0;

  return {
    totalPuzzlesSolved,
    hasNoHintsSession,
    distinctGameTypes,
    currentStreak: player?.current_streak ?? 0,
  };
}

/**
 * Check if a mission condition is met based on today's session stats.
 */
export function checkCondition(
  conditionType: string,
  conditionValue: number,
  stats: SessionStats
): boolean {
  switch (conditionType) {
    case "puzzles_solved":
      return stats.totalPuzzlesSolved >= conditionValue;
    case "no_hints":
      return stats.hasNoHintsSession;
    case "streak_day":
      return stats.currentStreak >= conditionValue;
    case "game_type_mix":
      return stats.distinctGameTypes >= conditionValue;
    default:
      return false;
  }
}

/**
 * Evaluate and award pending missions for a player today.
 * Called inline from closeSession. Returns completed missions.
 */
export async function evaluatePendingMissions(
  supabase: SupabaseClient,
  playerId: string,
  drawWeekId: string,
  watDate: string
): Promise<MissionEvalResult[]> {
  // Get pending missions for today
  const { data: pendingMissions } = await supabase
    .from("winam_player_missions")
    .select(`
      id,
      mission_id,
      winam_missions (
        title,
        condition_type,
        condition_value,
        reward_type,
        reward_amount
      )
    `)
    .eq("player_id", playerId)
    .eq("assigned_date_wat", watDate)
    .eq("status", "pending");

  if (!pendingMissions || pendingMissions.length === 0) return [];

  const stats = await getTodaySessionStats(supabase, playerId, watDate);
  const results: MissionEvalResult[] = [];

  for (const pm of pendingMissions) {
    const mission = pm.winam_missions as unknown as {
      title: string;
      condition_type: string;
      condition_value: number;
      reward_type: string;
      reward_amount: number;
    };
    if (!mission) continue;

    const completed = checkCondition(
      mission.condition_type,
      mission.condition_value,
      stats
    );

    if (completed) {
      // Update mission status
      await supabase
        .from("winam_player_missions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          coins_awarded: mission.reward_type === "coins" ? mission.reward_amount : 0,
          entries_awarded: mission.reward_type === "entries" ? mission.reward_amount : 0,
        })
        .eq("id", pm.id);

      // Award reward to player
      if (mission.reward_type === "coins") {
        const { data: player } = await supabase
          .from("winam_players")
          .select("coin_balance")
          .eq("id", playerId)
          .single();
        if (player) {
          await supabase
            .from("winam_players")
            .update({ coin_balance: player.coin_balance + mission.reward_amount })
            .eq("id", playerId);
        }
      } else if (mission.reward_type === "entries") {
        // Add entries to ledger
        const { data: weekEntries } = await supabase
          .from("winam_entry_ledger")
          .select("week_total_after")
          .eq("player_id", playerId)
          .eq("draw_week_id", drawWeekId)
          .order("created_at", { ascending: false })
          .limit(1);

        const weekSoFar = weekEntries && weekEntries.length > 0
          ? weekEntries[0].week_total_after
          : 0;
        const weekCap = 50;
        const entriesToAdd = Math.min(mission.reward_amount, weekCap - weekSoFar);

        if (entriesToAdd > 0) {
          await supabase.from("winam_entry_ledger").insert({
            player_id: playerId,
            draw_week_id: drawWeekId,
            source_type: "mission",
            source_id: pm.id,
            entries_delta: entriesToAdd,
            cap_overflow: Math.max(0, mission.reward_amount - entriesToAdd),
            week_total_after: weekSoFar + entriesToAdd,
          });
        }
      }
    }

    results.push({
      missionId: pm.mission_id,
      playerMissionId: pm.id,
      title: mission.title,
      completed,
      rewardType: mission.reward_type,
      rewardAmount: mission.reward_amount,
    });
  }

  return results.filter((r) => r.completed);
}
