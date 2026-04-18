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

    // Get session stats for dynamic tips
    const { data: sessions } = await supabaseAdmin
      .from("winam_game_sessions")
      .select("puzzles_solved")
      .eq("player_id", data.playerId);

    const totalSessions = sessions?.length ?? 0;
    const bestSession = sessions?.reduce(
      (m, s) => Math.max(m, s.puzzles_solved ?? 0),
      0
    ) ?? 0;

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
      totalSessions,
      bestSession,
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

// ── updateNickname ────────────────────────────────────────────────────
export const updateNickname = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      playerId: z.string().uuid(),
      nickname: z
        .string()
        .trim()
        .min(2, "Nickname must be at least 2 characters")
        .max(20, "Nickname must be 20 characters or less")
        .regex(/^[a-zA-Z0-9 _-]+$/, "Only letters, numbers, spaces, _ and - allowed"),
    })
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const trimmed = data.nickname.trim();

    const { error } = await supabaseAdmin
      .from("winam_players")
      .update({ nickname: trimmed })
      .eq("id", data.playerId);

    if (error) {
      return { success: false as const, error: "Could not update nickname" };
    }

    return { success: true as const, nickname: trimmed };
  });

// ── getActiveMissions ─────────────────────────────────────────────────
// Persistent missions: player always has up to 3 pending. Completed ones
// are replaced lazily on next fetch (with a variety guard).
export const getActiveMissions = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      playerId: z.string().uuid(),
    })
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const TARGET_PENDING = 3;
    const RECENT_EXCLUDE = 3;

    // Need a draw week id to insert new player_mission rows (FK requires it).
    const { data: drawWeek } = await supabaseAdmin
      .from("winam_draw_weeks")
      .select("id")
      .eq("status", "open")
      .limit(1)
      .maybeSingle();

    // Helper to fetch full active set (pending + recent completed for display)
    const loadActive = async () => {
      const { data: pending } = await supabaseAdmin
        .from("winam_player_missions")
        .select(`
          id,
          mission_id,
          status,
          progress_current,
          entries_awarded,
          completed_at,
          winam_missions (
            title,
            condition_type,
            condition_value,
            reward_amount
          )
        `)
        .eq("player_id", data.playerId)
        .eq("status", "pending")
        .order("id", { ascending: true });

      return pending ?? [];
    };

    let pending = await loadActive();

    // Replenish if below target and we have a draw week to anchor new rows
    if (pending.length < TARGET_PENDING && drawWeek) {
      const pendingIds = pending.map((p) => p.mission_id);

      // Recent completions to avoid immediate repeats
      const { data: recentCompleted } = await supabaseAdmin
        .from("winam_player_missions")
        .select("mission_id")
        .eq("player_id", data.playerId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(RECENT_EXCLUDE);
      const recentIds = (recentCompleted ?? []).map((r) => r.mission_id);

      const exclude = new Set<string>([...pendingIds, ...recentIds]);

      let pool: Array<{ id: string }> = [];
      const { data: candidates } = await supabaseAdmin
        .from("winam_missions")
        .select("id")
        .eq("is_active", true);
      pool = (candidates ?? []).filter((m) => !exclude.has(m.id));

      // If exclude pool is too aggressive (player has done everything recently),
      // relax to just exclude currently pending.
      if (pool.length === 0) {
        pool = (candidates ?? []).filter((m) => !pendingIds.includes(m.id));
      }

      const needed = TARGET_PENDING - pending.length;
      const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, needed);

      if (shuffled.length > 0) {
        const inserts = shuffled.map((m) => ({
          player_id: data.playerId,
          mission_id: m.id,
          draw_week_id: drawWeek.id,
          progress_current: 0,
        }));
        await supabaseAdmin.from("winam_player_missions").insert(inserts);
        pending = await loadActive();
      }
    }

    return {
      success: true as const,
      missions: pending.map((pm) => {
        const m = pm.winam_missions as unknown as {
          title: string;
          condition_type: string;
          condition_value: number;
          reward_amount: number;
        } | null;
        return {
          id: pm.id,
          title: m?.title ?? "",
          conditionType: m?.condition_type ?? "puzzles_solved",
          conditionValue: m?.condition_value ?? 1,
          progressCurrent: pm.progress_current,
          rewardAmount: m?.reward_amount ?? 0,
          status: pm.status,
        };
      }),
    };
  });

// ── getActiveBanners ──────────────────────────────────────────────────
export const getActiveBanners = createServerFn({ method: "POST" }).handler(
  async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("winam_banners")
      .select("id, title, subtitle, icon_url, display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(3);

    if (error) return { success: false as const, banners: [] };
    return { success: true as const, banners: data ?? [] };
  }
);

// ── getLeaderboard ────────────────────────────────────────────────────
export const getLeaderboard = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      limit: z.number().min(1).max(50).default(10),
    })
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: drawWeek } = await supabaseAdmin
      .from("winam_draw_weeks")
      .select("id")
      .eq("status", "open")
      .limit(1)
      .maybeSingle();

    if (!drawWeek) return { success: true as const, players: [] };

    const { data: entries } = await supabaseAdmin
      .from("winam_entry_ledger")
      .select("player_id, week_total_after")
      .eq("draw_week_id", drawWeek.id)
      .order("week_total_after", { ascending: false })
      .limit(data.limit);

    if (!entries || entries.length === 0) return { success: true as const, players: [] };

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
          rankTier: p?.rank_tier ?? "starter",
        };
      })
      .sort((a, b) => b.entries - a.entries)
      .slice(0, data.limit);

    return { success: true as const, players: sorted };
  });
