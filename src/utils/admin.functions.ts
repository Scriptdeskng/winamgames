import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ---- Internal helpers (run server-side) ----
async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertAdmin(adminId: string) {
  const supabaseAdmin = await getAdmin();
  const { data, error } = await supabaseAdmin
    .from("winam_admin_users")
    .select("id, role")
    .eq("id", adminId)
    .maybeSingle();
  if (error || !data) throw new Error("Unauthorized");
  return data;
}

async function audit(
  adminId: string,
  action: string,
  target_type: string | null,
  target_id: string | null,
  details: Record<string, unknown> = {}
) {
  try {
    const supabaseAdmin = await getAdmin();
    const payload = {
      admin_id: adminId,
      action,
      target_type,
      target_id,
      details: details as never,
    };
    await supabaseAdmin.from("winam_admin_audit_log").insert(payload);
  } catch (e) {
    console.error("[audit] failed to log", action, e);
  }
}

function todayWAT(): string {
  const wat = new Date(Date.now() + 60 * 60 * 1000);
  return wat.toISOString().slice(0, 10);
}

async function getOpenOrLockedDrawWeek() {
  const supabaseAdmin = await getAdmin();
  const { data } = await supabaseAdmin
    .from("winam_draw_weeks")
    .select("*")
    .in("status", ["open", "locked"])
    .order("week_start_wat", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

// ============================================================
// DASHBOARD
// ============================================================
export const getDashboardStats = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid() }))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const today = todayWAT();

    const [playersRes, subsRes, weekRow, sessionsTodayRes] = await Promise.all([
      supabaseAdmin.from("winam_players").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("winam_subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      getOpenOrLockedDrawWeek(),
      supabaseAdmin
        .from("winam_game_sessions")
        .select("*", { count: "exact", head: true })
        .eq("session_date_wat", today),
    ]);

    let weekEntries = 0;
    let currentWeek = null as null | {
      id: string;
      status: string;
      week_start_wat: string;
      week_end_wat: string;
      entry_lock_at: string;
      draw_executes_at: string;
      total_entries: number;
    };
    if (weekRow) {
      currentWeek = {
        id: weekRow.id,
        status: weekRow.status,
        week_start_wat: weekRow.week_start_wat,
        week_end_wat: weekRow.week_end_wat,
        entry_lock_at: weekRow.entry_lock_at,
        draw_executes_at: weekRow.draw_executes_at,
        total_entries: weekRow.total_entries ?? 0,
      };
      const { data: entries } = await supabaseAdmin
        .from("winam_entry_ledger")
        .select("entries_delta")
        .eq("draw_week_id", weekRow.id);
      weekEntries = (entries ?? []).reduce(
        (s, r) => s + (r.entries_delta ?? 0),
        0
      );
    }

    const { data: recentSessions } = await supabaseAdmin
      .from("winam_game_sessions")
      .select(
        "id, game_type, puzzles_solved, entries_awarded, completed_at, player_id"
      )
      .order("completed_at", { ascending: false })
      .limit(10);

    const playerIds = Array.from(
      new Set((recentSessions ?? []).map((s) => s.player_id))
    );
    let playerMap: Record<string, { nickname: string | null; msisdn_last4: string }> = {};
    if (playerIds.length > 0) {
      const { data: players } = await supabaseAdmin
        .from("winam_players")
        .select("id, nickname, msisdn_last4")
        .in("id", playerIds);
      playerMap = Object.fromEntries(
        (players ?? []).map((p) => [
          p.id,
          { nickname: p.nickname, msisdn_last4: p.msisdn_last4 },
        ])
      );
    }

    return {
      totalPlayers: playersRes.count ?? 0,
      activeSubscriptions: subsRes.count ?? 0,
      sessionsToday: sessionsTodayRes.count ?? 0,
      currentWeekEntries: weekEntries,
      currentWeek,
      recentSessions: (recentSessions ?? []).map((s) => ({
        ...s,
        player: playerMap[s.player_id] ?? { nickname: null, msisdn_last4: "----" },
      })),
    };
  });

// ============================================================
// PLAYERS
// ============================================================
export const getPlayers = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminId: z.string().uuid(),
      search: z.string().max(100).optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(25),
    })
  )
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const from = (data.page - 1) * data.limit;
    const to = from + data.limit - 1;

    let q = supabaseAdmin
      .from("winam_players")
      .select(
        "id, nickname, msisdn_last4, rank_tier, coin_balance, xp_total, current_streak, is_flagged, created_at, last_session_date",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (data.search && data.search.trim().length > 0) {
      const s = data.search.trim();
      q = q.or(`nickname.ilike.%${s}%,msisdn_last4.ilike.%${s}%`);
    }

    const { data: players, count } = await q;
    return { players: players ?? [], total: count ?? 0 };
  });

export const getPlayerDetail = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ adminId: z.string().uuid(), playerId: z.string().uuid() })
  )
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();

    const [playerRes, subsRes, sessionsRes, ledgerRes, missionsRes, kycRes] = await Promise.all([
      supabaseAdmin.from("winam_players").select("*").eq("id", data.playerId).maybeSingle(),
      supabaseAdmin
        .from("winam_subscriptions")
        .select("*")
        .eq("player_id", data.playerId)
        .order("valid_from", { ascending: false }),
      supabaseAdmin
        .from("winam_game_sessions")
        .select("*")
        .eq("player_id", data.playerId)
        .order("completed_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("winam_entry_ledger")
        .select("draw_week_id, entries_delta, source_type, created_at")
        .eq("player_id", data.playerId)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("winam_player_missions")
        .select("*, mission:winam_missions(title, condition_type, condition_value, reward_type, reward_amount)")
        .eq("player_id", data.playerId)
        .order("completed_at", { ascending: false, nullsFirst: false })
        .limit(20),
      (supabaseAdmin.from("winam_kyc") as any)
        .select("*")
        .eq("player_id", data.playerId)
        .maybeSingle(),
    ]);

    return {
      player: playerRes.data,
      subscriptions: subsRes.data ?? [],
      sessions: sessionsRes.data ?? [],
      ledger: ledgerRes.data ?? [],
      missions: missionsRes.data ?? [],
      kyc: kycRes.data ?? null,
    };
  });

export const flagPlayer = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminId: z.string().uuid(),
      playerId: z.string().uuid(),
      flagged: z.boolean(),
      reason: z.string().min(1).max(500),
    })
  )
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin
      .from("winam_players")
      .update({
        is_flagged: data.flagged,
        flag_reason: data.flagged ? data.reason : null,
      })
      .eq("id", data.playerId);
    if (error) throw new Error(error.message);
    await audit(data.adminId, data.flagged ? "player_flag" : "player_unflag", "player", data.playerId, {
      reason: data.reason,
    });
    return { success: true };
  });

export const adjustPlayerCoins = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminId: z.string().uuid(),
      playerId: z.string().uuid(),
      amount: z.number().int(),
      reason: z.string().min(1).max(500),
    })
  )
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { data: p } = await supabaseAdmin
      .from("winam_players")
      .select("coin_balance")
      .eq("id", data.playerId)
      .maybeSingle();
    if (!p) throw new Error("Player not found");
    const next = Math.max(0, (p.coin_balance ?? 0) + data.amount);
    const { error } = await supabaseAdmin
      .from("winam_players")
      .update({ coin_balance: next })
      .eq("id", data.playerId);
    if (error) throw new Error(error.message);
    await audit(data.adminId, "player_adjust_coins", "player", data.playerId, {
      amount: data.amount,
      reason: data.reason,
      before: p.coin_balance,
      after: next,
    });
    return { success: true, newBalance: next };
  });

export const RANK_TIERS = [
  { tier: "starter", min: 0 },
  { tier: "recruit", min: 150 },
  { tier: "sergeant", min: 500 },
  { tier: "veteran", min: 1200 },
  { tier: "champion", min: 2500 },
  { tier: "icon", min: 4500 },
  { tier: "legend", min: 7000 },
  { tier: "immortal", min: 10000 },
] as const;

export function computeRankTier(xp: number) {
  let t: (typeof RANK_TIERS)[number]["tier"] = "starter";
  for (const r of RANK_TIERS) if (xp >= r.min) t = r.tier;
  return t;
}

export const adjustPlayerXP = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminId: z.string().uuid(),
      playerId: z.string().uuid(),
      amount: z.number().int(),
      reason: z.string().min(1).max(500),
    })
  )
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { data: p } = await supabaseAdmin
      .from("winam_players")
      .select("xp_total")
      .eq("id", data.playerId)
      .maybeSingle();
    if (!p) throw new Error("Player not found");
    const next = Math.max(0, (p.xp_total ?? 0) + data.amount);
    const newTier = computeRankTier(next);
    const { error } = await supabaseAdmin
      .from("winam_players")
      .update({ xp_total: next, rank_tier: newTier })
      .eq("id", data.playerId);
    if (error) throw new Error(error.message);
    await audit(data.adminId, "player_adjust_xp", "player", data.playerId, {
      amount: data.amount,
      reason: data.reason,
      before: p.xp_total,
      after: next,
      tier: newTier,
    });
    return { success: true, newXP: next, newTier };
  });

export const updateSubscription = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminId: z.string().uuid(),
      playerId: z.string().uuid(),
      action: z.enum(["cancel", "extend"]),
      days: z.number().int().min(1).max(365).optional(),
      reason: z.string().min(1).max(500),
    })
  )
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { data: sub } = await supabaseAdmin
      .from("winam_subscriptions")
      .select("*")
      .eq("player_id", data.playerId)
      .order("valid_from", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub) throw new Error("No subscription found");

    if (data.action === "cancel") {
      const { error } = await supabaseAdmin
        .from("winam_subscriptions")
        .update({ status: "cancelled" })
        .eq("id", sub.id);
      if (error) throw new Error(error.message);
      await audit(data.adminId, "subscription_cancel", "subscription", sub.id, {
        reason: data.reason,
      });
      return { success: true };
    }

    // extend
    const days = data.days ?? 7;
    const base = sub.valid_until ? new Date(sub.valid_until) : new Date();
    const next = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    const { error } = await supabaseAdmin
      .from("winam_subscriptions")
      .update({ valid_until: next.toISOString(), status: "active" })
      .eq("id", sub.id);
    if (error) throw new Error(error.message);
    await audit(data.adminId, "subscription_extend", "subscription", sub.id, {
      days,
      reason: data.reason,
      newValidUntil: next.toISOString(),
    });
    return { success: true, newValidUntil: next.toISOString() };
  });

// ============================================================
// BANNERS
// ============================================================
export const getBanners = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid() }))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { data: rows } = await supabaseAdmin
      .from("winam_banners")
      .select("*")
      .order("display_order", { ascending: true });
    return { banners: rows ?? [] };
  });

const bannerFields = z.object({
  title: z.string().min(1).max(120),
  subtitle: z.string().min(1).max(240),
  icon_url: z.string().max(500).nullable().optional(),
  is_active: z.boolean(),
  display_order: z.number().int().min(0).max(9999),
});

export const createBanner = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid() }).merge(bannerFields))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { data: row, error } = await supabaseAdmin
      .from("winam_banners")
      .insert({
        title: data.title,
        subtitle: data.subtitle,
        icon_url: data.icon_url ?? null,
        is_active: data.is_active,
        display_order: data.display_order,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await audit(data.adminId, "banner_create", "banner", row.id, { title: data.title });
    return { banner: row };
  });

export const updateBanner = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ adminId: z.string().uuid(), bannerId: z.string().uuid() }).merge(
      bannerFields.partial()
    )
  )
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { adminId, bannerId, ...patch } = data;
    const { error } = await supabaseAdmin
      .from("winam_banners")
      .update(patch)
      .eq("id", bannerId);
    if (error) throw new Error(error.message);
    await audit(adminId, "banner_update", "banner", bannerId, patch as Record<string, unknown>);
    return { success: true };
  });

export const deleteBanner = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid(), bannerId: z.string().uuid() }))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from("winam_banners").delete().eq("id", data.bannerId);
    if (error) throw new Error(error.message);
    await audit(data.adminId, "banner_delete", "banner", data.bannerId, {});
    return { success: true };
  });

export const reorderBanners = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminId: z.string().uuid(),
      order: z.array(z.string().uuid()).max(50),
    })
  )
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    for (let i = 0; i < data.order.length; i++) {
      await supabaseAdmin
        .from("winam_banners")
        .update({ display_order: i })
        .eq("id", data.order[i]);
    }
    await audit(data.adminId, "banner_reorder", "banner", null, { order: data.order });
    return { success: true };
  });

// ============================================================
// MISSIONS
// ============================================================
export const getMissions = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid() }))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { data: rows } = await supabaseAdmin
      .from("winam_missions")
      .select("*")
      .order("title", { ascending: true });
    return { missions: rows ?? [] };
  });

const missionFields = z.object({
  title: z.string().min(1).max(120),
  game_type: z.enum(["checkmate", "wisdomdrop"]).nullable(),
  condition_type: z.enum(["puzzles_solved", "no_hints", "streak_day", "game_type_mix"]),
  condition_value: z.number().int().min(1).max(10000),
  reward_type: z.enum(["coins", "entries"]),
  reward_amount: z.number().int().min(1).max(10000),
  is_active: z.boolean(),
});

export const createMission = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid() }).merge(missionFields))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { adminId: _adminId, ...fields } = data;
    const { data: row, error } = await supabaseAdmin
      .from("winam_missions")
      .insert(fields)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await audit(data.adminId, "mission_create", "mission", row.id, { title: data.title });
    return { mission: row };
  });

export const updateMission = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ adminId: z.string().uuid(), missionId: z.string().uuid() }).merge(
      missionFields.partial()
    )
  )
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { adminId, missionId, ...patch } = data;
    const { error } = await supabaseAdmin
      .from("winam_missions")
      .update(patch)
      .eq("id", missionId);
    if (error) throw new Error(error.message);
    await audit(adminId, "mission_update", "mission", missionId, patch as Record<string, unknown>);
    return { success: true };
  });

// ============================================================
// PLATFORM CONFIG
// ============================================================
export const getPlatformConfig = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid() }))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { data: rows } = await supabaseAdmin
      .from("winam_platform_config")
      .select("*")
      .order("key", { ascending: true });
    return { config: rows ?? [] };
  });

export const updatePlatformConfig = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminId: z.string().uuid(),
      key: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_]+$/),
      value: z.unknown(),
    })
  )
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin
      .from("winam_platform_config")
      .upsert({
        key: data.key,
        value: data.value as never,
        updated_by: data.adminId,
        updated_at: new Date().toISOString(),
      });
    if (error) throw new Error(error.message);
    await audit(data.adminId, "config_update", "config", data.key, { value: data.value });
    return { success: true };
  });


// ============================================================
// KYC ADMIN
// ============================================================
export const getKycForPlayer = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid(), playerId: z.string().uuid() }))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { data: kyc, error } = await (supabaseAdmin.from("winam_kyc") as any)
      .select("*")
      .eq("player_id", data.playerId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { kyc: kyc ?? null };
  });

export const verifyKyc = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid(), playerId: z.string().uuid() }))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { error } = await (supabaseAdmin.from("winam_kyc") as any)
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
        verified_by: data.adminId,
      })
      .eq("player_id", data.playerId);
    if (error) throw new Error(error.message);
    await audit(data.adminId, "kyc_verify", "player", data.playerId, {});
    return { success: true };
  });

export const createPaymentRecord = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    adminId: z.string().uuid(),
    playerId: z.string().uuid(),
    winnerId: z.string().uuid(),
    drawWeekId: z.string().uuid(),
    amountNaira: z.number().int(),
    prizeType: z.string(),
  }))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { data: payment, error } = await (supabaseAdmin.from("winam_payments") as any)
      .insert({
        player_id: data.playerId,
        winner_id: data.winnerId,
        draw_week_id: data.drawWeekId,
        amount_naira: data.amountNaira,
        prize_type: data.prizeType,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    await audit(data.adminId, "payment_create", "player", data.playerId, {
      winnerId: data.winnerId,
      amountNaira: data.amountNaira,
    });
    return { success: true, paymentId: payment.id };
  });

export const markPaymentPaid = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    adminId: z.string().uuid(),
    paymentId: z.string().uuid(),
    playerId: z.string().uuid(),
  }))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { error } = await (supabaseAdmin.from("winam_payments") as any)
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        paid_by: data.adminId,
      })
      .eq("id", data.paymentId);
    if (error) throw new Error(error.message);
    await audit(data.adminId, "payment_mark_paid", "player", data.playerId, {
      paymentId: data.paymentId,
    });
    return { success: true };
  });

export const getPaymentsForPlayer = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    adminId: z.string().uuid(),
    playerId: z.string().uuid(),
  }))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { data: payments } = await (supabaseAdmin.from("winam_payments") as any)
      .select("*")
      .eq("player_id", data.playerId)
      .order("created_at", { ascending: false });
    return { payments: payments ?? [] };
  });

// ============================================================
// DRAW MANAGEMENT
// ============================================================
export const getDrawWeeks = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid() }))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { data: rows } = await supabaseAdmin
      .from("winam_draw_weeks")
      .select("*")
      .order("week_start_wat", { ascending: false });

    // unique players per week
    const weeks = await Promise.all(
      (rows ?? []).map(async (w) => {
        const { data: ledger } = await supabaseAdmin
          .from("winam_entry_ledger")
          .select("player_id, entries_delta")
          .eq("draw_week_id", w.id);
        const uniquePlayers = new Set((ledger ?? []).map((r) => r.player_id)).size;
        const totalTickets = (ledger ?? []).reduce(
          (s, r) => s + (r.entries_delta ?? 0),
          0
        );
        return { ...w, unique_players: uniquePlayers, total_tickets: totalTickets };
      })
    );
    return { weeks };
  });

export const lockDrawWeek = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid(), drawWeekId: z.string().uuid() }))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();

    const { data: w } = await supabaseAdmin
      .from("winam_draw_weeks")
      .select("*")
      .eq("id", data.drawWeekId)
      .maybeSingle();
    if (!w) throw new Error("Draw week not found");
    if (w.status !== "open") throw new Error(`Cannot lock — status is ${w.status}`);

    const { data: entries } = await supabaseAdmin
      .from("winam_entry_ledger")
      .select("entries_delta")
      .eq("draw_week_id", data.drawWeekId);
    const totalEntries = (entries ?? []).reduce((s, r) => s + (r.entries_delta ?? 0), 0);

    const { error } = await supabaseAdmin
      .from("winam_draw_weeks")
      .update({ status: "locked", total_entries: totalEntries })
      .eq("id", data.drawWeekId);
    if (error) throw new Error(error.message);

    await audit(data.adminId, "draw_lock", "draw_week", data.drawWeekId, {
      total_entries: totalEntries,
    });
    return { success: true, totalEntries };
  });

interface CashTier { position: number; amount_naira: number }
interface AirtimeTier { count: number; amount_naira: number }

export const executeDrawWeek = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid(), drawWeekId: z.string().uuid() }))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { expandTickets, selectWinners } = await import("@/utils/draw-engine");
    const crypto = await import("crypto");

    const { data: w } = await supabaseAdmin
      .from("winam_draw_weeks")
      .select("*")
      .eq("id", data.drawWeekId)
      .maybeSingle();
    if (!w) throw new Error("Draw week not found");
    if (w.status !== "locked") throw new Error(`Cannot execute — status is ${w.status}`);

    // Load config
    const { data: cfgRows } = await supabaseAdmin
      .from("winam_platform_config")
      .select("key, value")
      .in("key", ["prize_cash_tiers", "prize_airtime_tiers", "weekly_cap"]);
    const cfg: Record<string, unknown> = {};
    for (const r of cfgRows ?? []) cfg[r.key] = r.value;
    const cashTiers = (cfg.prize_cash_tiers as CashTier[]) ?? [
      { position: 1, amount_naira: 35000 },
      { position: 2, amount_naira: 10000 },
      { position: 3, amount_naira: 5000 },
    ];
    const airtimeTiers = (cfg.prize_airtime_tiers as AirtimeTier[]) ?? [
      { count: 75, amount_naira: 200 },
    ];
    const weeklyCap = typeof cfg.weekly_cap === "number" ? (cfg.weekly_cap as number) : 50;

    // Fetch ledger + flagged players
    const [ledgerRes, flaggedRes] = await Promise.all([
      supabaseAdmin
        .from("winam_entry_ledger")
        .select("player_id, entries_delta")
        .eq("draw_week_id", data.drawWeekId),
      supabaseAdmin.from("winam_players").select("id").eq("is_flagged", true),
    ]);
    const flagged = new Set((flaggedRes.data ?? []).map((p) => p.id));

    // Generate seed (Worker-safe via Web Crypto)
    const buf = new Uint8Array(32);
    if (typeof globalThis.crypto?.getRandomValues === "function") {
      globalThis.crypto.getRandomValues(buf);
    } else {
      const random = crypto.randomBytes(32);
      buf.set(random);
    }
    const seed = Array.from(buf)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const tickets = expandTickets(ledgerRes.data ?? [], weeklyCap, flagged);
    const winners = selectWinners(tickets, seed, cashTiers, airtimeTiers);

    if (winners.length === 0) {
      throw new Error("No eligible tickets to draw winners from");
    }

    // Insert winners
    const rows = winners.map((wn) => ({
      draw_week_id: data.drawWeekId,
      player_id: wn.playerId,
      position: wn.position,
      prize_type: wn.prizeType,
      prize_amount: wn.prizeAmount,
      ticket_id: wn.ticketId,
    }));
    const { error: insErr } = await supabaseAdmin.from("winam_winners").insert(rows);
    if (insErr) throw new Error(insErr.message);

    const { error: updErr } = await supabaseAdmin
      .from("winam_draw_weeks")
      .update({ status: "drawn", draw_seed: seed })
      .eq("id", data.drawWeekId);
    if (updErr) throw new Error(updErr.message);

    await audit(data.adminId, "draw_execute", "draw_week", data.drawWeekId, {
      winner_count: winners.length,
      total_tickets: tickets.length,
      seed,
    });

    return {
      success: true,
      winnerCount: winners.length,
      totalTickets: tickets.length,
      cashWinners: winners.filter((w) => w.prizeType === "cash").length,
      airtimeWinners: winners.filter((w) => w.prizeType === "airtime").length,
    };
  });

export const publishWinners = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid(), drawWeekId: z.string().uuid() }))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from("winam_platform_config").upsert({
      key: "winners_published_week_id",
      value: data.drawWeekId as never,
      updated_by: data.adminId,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    await audit(data.adminId, "winners_publish", "draw_week", data.drawWeekId, {});
    return { success: true };
  });

export const settleDrawWeek = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid(), drawWeekId: z.string().uuid() }))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { data: w } = await supabaseAdmin
      .from("winam_draw_weeks")
      .select("status")
      .eq("id", data.drawWeekId)
      .maybeSingle();
    if (!w) throw new Error("Draw week not found");
    if (w.status !== "drawn") throw new Error(`Cannot settle — status is ${w.status}`);
    const { error } = await supabaseAdmin
      .from("winam_draw_weeks")
      .update({ status: "settled" })
      .eq("id", data.drawWeekId);
    if (error) throw new Error(error.message);
    await audit(data.adminId, "draw_settle", "draw_week", data.drawWeekId, {});
    return { success: true };
  });

export const getWinners = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid(), drawWeekId: z.string().uuid() }))
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { data: rows } = await supabaseAdmin
      .from("winam_winners")
      .select("*")
      .eq("draw_week_id", data.drawWeekId)
      .order("position", { ascending: true });

    const playerIds = Array.from(new Set((rows ?? []).map((r) => r.player_id).filter(Boolean) as string[]));
    let playerMap: Record<string, { nickname: string | null; msisdn_last4: string }> = {};
    let kycMap: Record<string, any> = {};
    let paymentMap: Record<string, any> = {};
    if (playerIds.length > 0) {
      const [{ data: players }, { data: kycRows }, { data: payments }] = await Promise.all([
        supabaseAdmin
          .from("winam_players")
          .select("id, nickname, msisdn_last4")
          .in("id", playerIds),
        (supabaseAdmin.from("winam_kyc") as any)
          .select("*")
          .in("player_id", playerIds),
        (supabaseAdmin.from("winam_payments") as any)
          .select("winner_id, id, status, paid_at")
          .in("winner_id", (rows ?? []).map((r) => r.id)),
      ]);
      playerMap = Object.fromEntries(
        (players ?? []).map((p) => [p.id, { nickname: p.nickname, msisdn_last4: p.msisdn_last4 }])
      );
      kycMap = Object.fromEntries((kycRows ?? []).map((k: any) => [k.player_id, k]));
      paymentMap = Object.fromEntries((payments ?? []).map((p: any) => [p.winner_id, p]));
    }
    return {
      winners: (rows ?? []).map((r) => ({
        ...r,
        player: r.player_id ? playerMap[r.player_id] ?? null : null,
        kyc: r.player_id ? kycMap[r.player_id] ?? null : null,
        payment: r.id ? paymentMap[r.id] ?? null : null,
      })),
    };
  });

export const flagWinner = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminId: z.string().uuid(),
      winnerId: z.string().uuid(),
      flagged: z.boolean(),
    })
  )
  .handler(async ({ data }) => {
    await assertAdmin(data.adminId);
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin
      .from("winam_winners")
      .update({ is_flagged: data.flagged })
      .eq("id", data.winnerId);
    if (error) throw new Error(error.message);
    await audit(data.adminId, data.flagged ? "winner_flag" : "winner_unflag", "winner", data.winnerId, {});
    return { success: true };
  });

// ============================================================
// PUBLIC (no admin) — for player-facing winners screen
// ============================================================
export const getPublishedWinners = createServerFn({ method: "POST" })
  .handler(async () => {
    const supabaseAdmin = await getAdmin();
    const { data: cfg } = await supabaseAdmin
      .from("winam_platform_config")
      .select("value")
      .eq("key", "winners_published_week_id")
      .maybeSingle();

    const raw = cfg?.value as unknown;
    let weekId: string | null = null;
    if (typeof raw === "string" && raw.length > 10 && raw !== "null") weekId = raw;

    if (!weekId) return { weekId: null, week: null, winners: [] };

    const [weekRes, winnersRes] = await Promise.all([
      supabaseAdmin
        .from("winam_draw_weeks")
        .select("id, week_start_wat, week_end_wat, draw_executes_at, status")
        .eq("id", weekId)
        .maybeSingle(),
      supabaseAdmin
        .from("winam_winners")
        .select("id, position, prize_type, prize_amount, ticket_id, player_id")
        .eq("draw_week_id", weekId)
        .eq("is_flagged", false)
        .order("position", { ascending: true }),
    ]);

    const playerIds = Array.from(
      new Set((winnersRes.data ?? []).map((w) => w.player_id).filter(Boolean) as string[])
    );
    let playerMap: Record<string, { nickname: string | null; msisdn_last4: string }> = {};
    if (playerIds.length > 0) {
      const { data: players } = await supabaseAdmin
        .from("winam_players")
        .select("id, nickname, msisdn_last4")
        .in("id", playerIds);
      playerMap = Object.fromEntries(
        (players ?? []).map((p) => [p.id, { nickname: p.nickname, msisdn_last4: p.msisdn_last4 }])
      );
    }

    return {
      weekId,
      week: weekRes.data,
      winners: (winnersRes.data ?? []).map((w) => ({
        id: w.id,
        position: w.position,
        prizeType: w.prize_type,
        prizeAmount: w.prize_amount,
        ticketId: w.ticket_id,
        nickname: w.player_id ? playerMap[w.player_id]?.nickname ?? null : null,
        msisdnLast4: w.player_id ? playerMap[w.player_id]?.msisdn_last4 ?? "----" : "----",
      })),
    };
  });


