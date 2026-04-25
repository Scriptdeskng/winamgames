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
// Daily-rollover missions: player has a 3-slot slate per WAT day. Completed
// missions stay visible for the day and missing slots are replenished lazily.
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
    const todayWat = todayWatString();

    // Need a draw week id to insert new player_mission rows (FK requires it).
    const { data: drawWeek } = await supabaseAdmin
      .from("winam_draw_weeks")
      .select("id")
      .eq("status", "open")
      .limit(1)
      .maybeSingle();

    type PlayerMissionRow = {
      id: string;
      mission_id: string;
      status: string;
      progress_current: number;
      entries_awarded: number;
      completed_at: string | null;
      assigned_date_wat: string | null;
      winam_missions: unknown;
    };

    const missionSelect = `
      id,
      mission_id,
      status,
      progress_current,
      entries_awarded,
      completed_at,
      assigned_date_wat,
      winam_missions (
        title,
        condition_type,
        condition_value,
        reward_amount
      )
    `;

    const loadTodaysMissions = async (): Promise<PlayerMissionRow[]> => {
      const { data: todaysMissions } = await (supabaseAdmin
        .from("winam_player_missions") as any)
        .select(missionSelect)
        .eq("player_id", data.playerId)
        .or(`status.eq.pending,and(status.eq.completed,assigned_date_wat.eq.${todayWat})`)
        .order("assigned_date_wat", { ascending: false })
        .order("completed_at", { ascending: true, nullsFirst: true })
        .order("id", { ascending: true })
        .limit(TARGET_PENDING);

      return (todaysMissions ?? []) as PlayerMissionRow[];
    };

    let todaysMissions = await loadTodaysMissions();
    const slotsAvailable = Math.max(0, TARGET_PENDING - todaysMissions.length);

    if (slotsAvailable > 0 && drawWeek) {
      const pendingIds = todaysMissions.map((p) => p.mission_id);

      const { data: recentCompleted } = await supabaseAdmin
        .from("winam_player_missions")
        .select("mission_id")
        .eq("player_id", data.playerId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(RECENT_EXCLUDE);
      const recentIds = (recentCompleted ?? []).map((r) => r.mission_id);

      const { data: everCompleted } = await supabaseAdmin
        .from("winam_player_missions")
        .select("mission_id, winam_missions(condition_type)")
        .eq("player_id", data.playerId)
        .eq("status", "completed");

      const streakMissionsEverDone = new Set(
        (everCompleted ?? [])
          .filter((r) => {
            const m = r.winam_missions as unknown as { condition_type: string } | null;
            return m?.condition_type === "streak_day";
          })
          .map((r) => r.mission_id)
      );

      const exclude = new Set<string>([...pendingIds, ...recentIds]);
      for (const id of streakMissionsEverDone) exclude.add(id);

      const { data: candidates } = await supabaseAdmin
        .from("winam_missions")
        .select("id")
        .eq("is_active", true);

      let pool = (candidates ?? []).filter((m) => !exclude.has(m.id));

      // If exclude pool is too aggressive (player has done everything recently),
      // relax to just exclude currently loaded slots.
      if (pool.length === 0) {
        pool = (candidates ?? []).filter((m) => !pendingIds.includes(m.id));
      }

      const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, slotsAvailable);

      if (shuffled.length > 0) {
        const inserts = shuffled.map((m) => ({
          player_id: data.playerId,
          mission_id: m.id,
          draw_week_id: drawWeek.id,
          progress_current: 0,
          assigned_date_wat: todayWat,
        }));
        await (supabaseAdmin.from("winam_player_missions") as any).insert(inserts);
        todaysMissions = await loadTodaysMissions();
      }
    }

    return {
      success: true as const,
      missions: todaysMissions.map((pm) => {
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


// ── Winner + KYC claim status ──────────────────────────────────────────
export const getMyWinnerStatus = createServerFn({ method: "POST" })
  .inputValidator(z.object({ playerId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: cfg } = await supabaseAdmin
      .from("winam_platform_config")
      .select("value")
      .eq("key", "winners_published_week_id")
      .maybeSingle();

    const rawWeekId = cfg?.value as unknown;
    const weekId = typeof rawWeekId === "string" && rawWeekId.length > 10 ? rawWeekId : null;
    if (!weekId) return { won: false as const };

    const { data: winner } = await supabaseAdmin
      .from("winam_winners")
      .select("id, draw_week_id, position, prize_type, prize_amount")
      .eq("draw_week_id", weekId)
      .eq("player_id", data.playerId)
      .eq("is_flagged", false)
      .maybeSingle();

    if (!winner) return { won: false as const };

    const { data: kyc } = await (supabaseAdmin.from("winam_kyc") as any)
      .select("id, submitted_at, bank_details_submitted_at, verified")
      .eq("player_id", data.playerId)
      .maybeSingle();

    const { data: payment } = await (supabaseAdmin.from("winam_payments") as any)
      .select("id, status, paid_at")
      .eq("winner_id", winner.id)
      .maybeSingle();

    return {
      won: true as const,
      winnerId: winner.id,
      drawWeekId: winner.draw_week_id,
      position: winner.position,
      prizeType: winner.prize_type,
      prizeAmount: winner.prize_amount,
      kyc: kyc
        ? {
            identitySubmitted: !!kyc.submitted_at,
            bankSubmitted: !!kyc.bank_details_submitted_at,
            verified: !!kyc.verified,
            paymentProcessed: payment?.status === "paid",
          }
        : null,
    };
  });

export const submitKycIdentity = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      playerId: z.string().uuid(),
      firstName: z.string().trim().min(1).max(100),
      lastName: z.string().trim().min(1).max(100),
      dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      idType: z.enum(["nin", "bvn"]),
      idNumber: z.string().length(11).regex(/^\d{11}$/),
    })
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      player_id: data.playerId,
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      dob: data.dob,
      id_type: data.idType,
      // TODO pre-launch: encrypt NIN/BVN before storage
      id_number: data.idNumber,
      submitted_at: new Date().toISOString(),
    };
    const { error } = await (supabaseAdmin.from("winam_kyc") as any).upsert(payload, {
      onConflict: "player_id",
    });
    if (error) throw new Error(error.message);
    return { success: true as const };
  });

export const submitKycBankDetails = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      playerId: z.string().uuid(),
      bankCode: z.string().trim().min(1).max(20),
      bankName: z.string().trim().min(1).max(100),
      accountNumber: z.string().length(10).regex(/^\d{10}$/),
      accountName: z.string().trim().max(120).optional(),
    })
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: updated, error } = await (supabaseAdmin.from("winam_kyc") as any)
      .update({
        bank_code: data.bankCode.trim(),
        bank_name: data.bankName.trim(),
        account_number: data.accountNumber,
        account_name: data.accountName?.trim() || null,
        bank_details_submitted_at: new Date().toISOString(),
      })
      .eq("player_id", data.playerId)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) throw new Error("Complete identity verification first.");
    return { success: true as const };
  });

export const getKycStatus = createServerFn({ method: "POST" })
  .inputValidator(z.object({ playerId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: kyc } = await (supabaseAdmin.from("winam_kyc") as any)
      .select("submitted_at, bank_details_submitted_at, bank_name, bank_code, account_number, account_name, first_name, last_name, dob, id_type, verified")
      .eq("player_id", data.playerId)
      .maybeSingle();
    return { kyc };
  });

// ── Helpers ───────────────────────────────────────────────────────────
function todayWatString(): string {
  // WAT = UTC+1 (no DST). Shift "now" by +1h, then take the UTC date parts.
  const shifted = new Date(Date.now() + 60 * 60 * 1000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type RankedRow = { id: string; puzzles: number };

async function buildLeaderboardRows(
  rows: Array<{ player_id: string; puzzles_solved: number | null }>,
  limit: number,
  playerId: string | undefined
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const playerMap = new Map<string, number>();
  for (const r of rows) {
    const inc = r.puzzles_solved ?? 0;
    if (inc <= 0) continue;
    playerMap.set(r.player_id, (playerMap.get(r.player_id) ?? 0) + inc);
  }
  const totalPlayers = playerMap.size;

  const fullRanked: RankedRow[] = [...playerMap.entries()]
    .map(([id, puzzles]) => ({ id, puzzles }))
    .sort((a, b) => b.puzzles - a.puzzles);

  const topRanked = fullRanked.slice(0, limit);
  const topIds = topRanked.map((r) => r.id);

  const { data: players } = topIds.length
    ? await supabaseAdmin
        .from("winam_players")
        .select("id, nickname, msisdn_last4, rank_tier")
        .in("id", topIds)
    : { data: [] as Array<{ id: string; nickname: string | null; msisdn_last4: string; rank_tier: string }> };

  const sorted = topRanked.map((r) => {
    const p = players?.find((x) => x.id === r.id);
    return {
      id: r.id,
      name: p?.nickname ?? `****${p?.msisdn_last4 ?? "0000"}`,
      puzzles: r.puzzles,
      rankTier: p?.rank_tier ?? "starter",
    };
  });

  let currentPlayer: {
    id: string;
    name: string;
    puzzles: number;
    rankTier: string;
    rank: number;
  } | null = null;

  if (playerId) {
    const inTop = topIds.includes(playerId);
    if (!inTop) {
      const idx = fullRanked.findIndex((r) => r.id === playerId);
      if (idx >= 0) {
        const { data: me } = await supabaseAdmin
          .from("winam_players")
          .select("id, nickname, msisdn_last4, rank_tier")
          .eq("id", playerId)
          .maybeSingle();
        currentPlayer = {
          id: playerId,
          name: me?.nickname ?? `****${me?.msisdn_last4 ?? "0000"}`,
          puzzles: fullRanked[idx].puzzles,
          rankTier: me?.rank_tier ?? "starter",
          rank: idx + 1,
        };
      }
    }
  }

  return { players: sorted, totalPlayers, currentPlayer };
}

// ── getLeaderboard (weekly — puzzles solved this draw week) ───────────
export const getLeaderboard = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      limit: z.number().min(1).max(50).default(10),
      playerId: z.string().uuid().optional(),
    })
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: drawWeek } = await supabaseAdmin
      .from("winam_draw_weeks")
      .select("id, week_start_wat, week_end_wat, draw_executes_at")
      .eq("status", "open")
      .limit(1)
      .maybeSingle();

    if (!drawWeek) {
      return {
        success: true as const,
        players: [],
        totalPlayers: 0,
        weekStartWat: null,
        weekEndWat: null,
        drawExecutesAt: null,
        currentPlayer: null,
      };
    }

    const weekMeta = {
      weekStartWat: drawWeek.week_start_wat,
      weekEndWat: drawWeek.week_end_wat,
      drawExecutesAt: drawWeek.draw_executes_at,
    };

    const { data: sessions } = await supabaseAdmin
      .from("winam_game_sessions")
      .select("player_id, puzzles_solved")
      .eq("draw_week_id", drawWeek.id)
      .gt("puzzles_solved", 0)
      .limit(2000);

    if (!sessions || sessions.length === 0) {
      return {
        success: true as const,
        players: [],
        totalPlayers: 0,
        ...weekMeta,
        currentPlayer: null,
      };
    }

    const result = await buildLeaderboardRows(sessions, data.limit, data.playerId);

    return {
      success: true as const,
      ...result,
      ...weekMeta,
    };
  });

// ── getDailyLeaderboard (today — puzzles solved today WAT) ────────────
export const getDailyLeaderboard = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      limit: z.number().min(1).max(50).default(50),
      playerId: z.string().uuid().optional(),
    })
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const todayWat = todayWatString();

    const { data: sessions } = await supabaseAdmin
      .from("winam_game_sessions")
      .select("player_id, puzzles_solved")
      .eq("session_date_wat", todayWat)
      .gt("puzzles_solved", 0)
      .limit(2000);

    if (!sessions || sessions.length === 0) {
      return {
        success: true as const,
        players: [],
        totalPlayers: 0,
        todayWat,
        currentPlayer: null,
      };
    }

    const result = await buildLeaderboardRows(sessions, data.limit, data.playerId);

    return {
      success: true as const,
      ...result,
      todayWat,
    };
  });
