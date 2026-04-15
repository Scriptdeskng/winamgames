import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ── getPlayerData ─────────────────────────────────────────────────────
export const getPlayerData = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      playerId: z.string().uuid(),
    })
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: player, error } = await supabaseAdmin
      .from("winam_players")
      .select("*")
      .eq("id", data.playerId)
      .single();

    if (error || !player) {
      return { success: false as const, error: "Player not found" };
    }

    // Get current draw week
    const { data: drawWeek } = await supabaseAdmin
      .from("winam_draw_weeks")
      .select("id, draw_executes_at, week_start_wat, week_end_wat, status")
      .eq("status", "open")
      .limit(1)
      .maybeSingle();

    // Get weekly entry total
    let weekTotal = 0;
    if (drawWeek) {
      const { data: weekEntries } = await supabaseAdmin
        .from("winam_entry_ledger")
        .select("week_total_after")
        .eq("player_id", data.playerId)
        .eq("draw_week_id", drawWeek.id)
        .order("created_at", { ascending: false })
        .limit(1);

      weekTotal = weekEntries && weekEntries.length > 0
        ? weekEntries[0].week_total_after
        : 0;
    }

    return {
      success: true as const,
      player: {
        id: player.id,
        nickname: player.nickname,
        msisdnLast4: player.msisdn_last4,
        coinBalance: player.coin_balance,
        xpTotal: player.xp_total,
        rankTier: player.rank_tier,
        currentStreak: player.current_streak,
        avatarId: player.avatar_id,
      },
      weekTotal,
      weekCap: 50,
      drawWeek: drawWeek
        ? {
            id: drawWeek.id,
            drawExecutesAt: drawWeek.draw_executes_at,
            weekStartWat: drawWeek.week_start_wat,
            weekEndWat: drawWeek.week_end_wat,
          }
        : null,
    };
  });

// ── getDailyMissions ──────────────────────────────────────────────────
export const getDailyMissions = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      playerId: z.string().uuid(),
    })
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // WAT date (UTC+1)
    const now = new Date();
    const watDate = new Date(now.getTime() + 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // Check for existing assignments today
    const { data: existing } = await supabaseAdmin
      .from("winam_player_missions")
      .select(`
        id,
        mission_id,
        status,
        coins_awarded,
        entries_awarded,
        winam_missions (
          title,
          condition_type,
          condition_value,
          reward_type,
          reward_amount,
          game_type
        )
      `)
      .eq("player_id", data.playerId)
      .eq("assigned_date_wat", watDate);

    if (existing && existing.length > 0) {
      // Get progress stats
      const { getTodaySessionStats } = await import("@/utils/mission.server");
      const stats = await getTodaySessionStats(supabaseAdmin, data.playerId, watDate);

      return {
        success: true as const,
        missions: existing.map((pm) => {
          const m = pm.winam_missions as unknown as {
            title: string;
            condition_type: string;
            condition_value: number;
            reward_type: string;
            reward_amount: number;
            game_type: string | null;
          };
          return {
            id: pm.id,
            title: m?.title ?? "",
            status: pm.status,
            rewardType: m?.reward_type ?? "coins",
            rewardAmount: m?.reward_amount ?? 0,
            progress: getProgress(m?.condition_type, m?.condition_value, stats),
          };
        }),
      };
    }

    // Assign 3 random missions
    const { data: drawWeek } = await supabaseAdmin
      .from("winam_draw_weeks")
      .select("id")
      .eq("status", "open")
      .limit(1)
      .maybeSingle();

    if (!drawWeek) {
      return { success: false as const, error: "No active draw week" };
    }

    const { data: activeMissions } = await supabaseAdmin
      .from("winam_missions")
      .select("*")
      .eq("is_active", true);

    if (!activeMissions || activeMissions.length === 0) {
      return { success: true as const, missions: [] };
    }

    // Pick 3 (or fewer if not enough missions)
    const shuffled = [...activeMissions].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 3);

    const inserts = picked.map((m) => ({
      player_id: data.playerId,
      mission_id: m.id,
      draw_week_id: drawWeek.id,
      assigned_date_wat: watDate,
    }));

    const { data: inserted } = await supabaseAdmin
      .from("winam_player_missions")
      .insert(inserts)
      .select(`
        id,
        mission_id,
        status,
        coins_awarded,
        entries_awarded,
        winam_missions (
          title,
          condition_type,
          condition_value,
          reward_type,
          reward_amount,
          game_type
        )
      `);

    return {
      success: true as const,
      missions: (inserted ?? []).map((pm) => {
        const m = pm.winam_missions as unknown as {
          title: string;
          condition_type: string;
          condition_value: number;
          reward_type: string;
          reward_amount: number;
        };
        return {
          id: pm.id,
          title: m?.title ?? "",
          status: pm.status,
          rewardType: m?.reward_type ?? "coins",
          rewardAmount: m?.reward_amount ?? 0,
          progress: "0/" + (m?.condition_value ?? 1),
        };
      }),
    };
  });

// ── getLeaderboard ────────────────────────────────────────────────────
export const getLeaderboard = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      limit: z.number().min(1).max(50).default(10),
    })
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Get current draw week
    const { data: drawWeek } = await supabaseAdmin
      .from("winam_draw_weeks")
      .select("id")
      .eq("status", "open")
      .limit(1)
      .maybeSingle();

    if (!drawWeek) return { success: true as const, players: [] };

    // Get top players by entry total this week
    const { data: entries } = await supabaseAdmin
      .from("winam_entry_ledger")
      .select("player_id, week_total_after")
      .eq("draw_week_id", drawWeek.id)
      .order("week_total_after", { ascending: false })
      .limit(data.limit);

    if (!entries || entries.length === 0) return { success: true as const, players: [] };

    // Deduplicate by player (take highest week_total_after)
    const playerMap = new Map<string, number>();
    for (const e of entries) {
      const current = playerMap.get(e.player_id) ?? 0;
      if (e.week_total_after > current) playerMap.set(e.player_id, e.week_total_after);
    }

    const playerIds = [...playerMap.keys()];
    const { data: players } = await supabaseAdmin
      .from("winam_players")
      .select("id, nickname, msisdn_last4, rank_tier")
      .in("id", playerIds);

    const sorted = playerIds
      .map((pid) => {
        const p = players?.find((x) => x.id === pid);
        return {
          id: pid,
          name: p?.nickname ?? `****${p?.msisdn_last4 ?? "0000"}`,
          entries: playerMap.get(pid) ?? 0,
          rankTier: p?.rank_tier ?? "pawn",
        };
      })
      .sort((a, b) => b.entries - a.entries)
      .slice(0, data.limit);

    return { success: true as const, players: sorted };
  });

// Helper: compute mission progress string
function getProgress(
  conditionType: string | undefined,
  conditionValue: number | undefined,
  stats: { totalPuzzlesSolved: number; hasNoHintsSession: boolean; distinctGameTypes: number; currentStreak: number }
): string {
  const target = conditionValue ?? 1;
  switch (conditionType) {
    case "puzzles_solved":
      return `${Math.min(stats.totalPuzzlesSolved, target)}/${target}`;
    case "no_hints":
      return stats.hasNoHintsSession ? "1/1" : "0/1";
    case "streak_day":
      return `${Math.min(stats.currentStreak, target)}/${target}`;
    case "game_type_mix":
      return `${Math.min(stats.distinctGameTypes, target)}/${target}`;
    default:
      return `0/${target}`;
  }
}
