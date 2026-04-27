/**
 * Server-only helpers for mission progress evaluation.
 * NEVER import this file from client code.
 *
 * Missions are persistent (no daily reset). Progress is incremental and
 * tracked per player_mission row. Rewards are entries-only.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface MissionEvalResult {
  missionId: string;
  playerMissionId: string;
  title: string;
  rewardAmount: number;
  entriesAdded: number;
  capOverflow: number;
}

interface SessionDelta {
  puzzlesSolved: number;
  hintsUsed: number;
  gameType: string;
}

/**
 * Evaluate pending missions for a player after a session closes.
 * Updates progress_current incrementally per condition_type, completes
 * missions whose targets are met, awards entries (respecting weekly cap),
 * and returns the list of newly-completed missions.
 */
export async function evaluatePendingMissions(
  supabase: SupabaseClient,
  playerId: string,
  drawWeekId: string,
  _watDate: string,
  sessionDelta: SessionDelta
): Promise<MissionEvalResult[]> {
  // Load pending missions joined with mission definitions
  const { data: pending } = await supabase
    .from("winam_player_missions")
    .select(`
      id,
      mission_id,
      progress_current,
      winam_missions (
        title,
        condition_type,
        condition_value,
        reward_amount
      )
    `)
    .eq("player_id", playerId)
    .eq("status", "pending")
    .eq("assigned_date_wat", _watDate)
    .order("assigned_date_wat", { ascending: false })
    .order("id", { ascending: true })
    .limit(3);

  if (!pending || pending.length === 0) return [];

  // Pre-compute aggregate signals (cheap, only when needed)
  let distinctGameTypes: number | null = null;
  let hasNoHintsSession: boolean | null = null;

  const needsGameMix = pending.some((pm) => {
    const m = pm.winam_missions as unknown as { condition_type: string } | null;
    return m?.condition_type === "game_type_mix";
  });
  const needsNoHints = pending.some((pm) => {
    const m = pm.winam_missions as unknown as { condition_type: string } | null;
    return m?.condition_type === "no_hints";
  });

  if (needsGameMix) {
    const { data: rows } = await supabase
      .from("winam_game_sessions")
      .select("game_type")
      .eq("player_id", playerId);
    distinctGameTypes = rows ? new Set(rows.map((r) => r.game_type)).size : 0;
  }
  if (needsNoHints) {
    const { data: rows } = await supabase
      .from("winam_game_sessions")
      .select("hints_used, puzzles_solved")
      .eq("player_id", playerId)
      .eq("hints_used", 0)
      .gt("puzzles_solved", 0)
      .limit(1);
    hasNoHintsSession = !!(rows && rows.length > 0);
  }

  // Player streak (for streak_day missions)
  const { data: player } = await supabase
    .from("winam_players")
    .select("current_streak")
    .eq("id", playerId)
    .single();
  const currentStreak = player?.current_streak ?? 0;

  const results: MissionEvalResult[] = [];

  // Track week total locally so multiple completions in one batch don't
  // all read the same stale ledger value.
  const { data: weekEntries } = await supabase
    .from("winam_entry_ledger")
    .select("week_total_after")
    .eq("player_id", playerId)
    .eq("draw_week_id", drawWeekId)
    .order("created_at", { ascending: false })
    .limit(1);
  let weekSoFar =
    weekEntries && weekEntries.length > 0 ? weekEntries[0].week_total_after : 0;
  const weekCap = 50;

  for (const pm of pending) {
    const mission = pm.winam_missions as unknown as {
      title: string;
      condition_type: string;
      condition_value: number;
      reward_amount: number;
    } | null;
    if (!mission) continue;

    let newProgress = pm.progress_current;
    switch (mission.condition_type) {
      case "puzzles_solved":
        newProgress = pm.progress_current + sessionDelta.puzzlesSolved;
        break;
      case "streak_day":
        newProgress = currentStreak;
        break;
      case "game_type_mix":
        newProgress = distinctGameTypes ?? 0;
        break;
      case "no_hints":
        newProgress = hasNoHintsSession ? 1 : pm.progress_current;
        break;
    }

    const completed = newProgress >= mission.condition_value;

    if (!completed) {
      if (newProgress !== pm.progress_current) {
        await supabase
          .from("winam_player_missions")
          .update({ progress_current: newProgress })
          .eq("id", pm.id);
      }
      continue;
    }

    // Mission complete — clamp progress, mark completed, award entries
    const entriesToAdd = Math.min(
      mission.reward_amount,
      Math.max(0, weekCap - weekSoFar)
    );
    const overflow = mission.reward_amount - entriesToAdd;

    await supabase
      .from("winam_player_missions")
      .update({
        progress_current: mission.condition_value,
        status: "completed",
        completed_at: new Date().toISOString(),
        entries_awarded: mission.reward_amount,
      })
      .eq("id", pm.id);

    if (entriesToAdd > 0) {
      await supabase.from("winam_entry_ledger").insert({
        player_id: playerId,
        draw_week_id: drawWeekId,
        source_type: "mission",
        source_id: pm.id,
        entries_delta: entriesToAdd,
        cap_overflow: overflow,
        week_total_after: weekSoFar + entriesToAdd,
      });
      weekSoFar += entriesToAdd;
    }

    results.push({
      missionId: pm.mission_id,
      playerMissionId: pm.id,
      title: mission.title,
      rewardAmount: mission.reward_amount,
      entriesAdded: entriesToAdd,
      capOverflow: overflow,
    });
  }

  return results;
}
