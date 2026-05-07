import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { winamApiGet, winamApiPost } from "@/lib/winam-api";

// ============================================================
// DASHBOARD
// ============================================================
export const getDashboardStats = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid() }))
  .handler(async ({ data }) => {
    return await winamApiGet<{
      totalPlayers: number;
      activeSubscriptions: number;
      sessionsToday: number;
      currentWeekEntries: number;
      currentWeek: unknown;
      recentSessions: Array<unknown>;
    }>(`/admin/data/dashboard/stats?admin_id=${encodeURIComponent(data.adminId)}`);
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
    return await winamApiGet<{ players: Array<unknown>; total: number }>(
      `/admin/data/players?admin_id=${encodeURIComponent(data.adminId)}&search=${encodeURIComponent(data.search ?? "")}&page=${encodeURIComponent(String(data.page))}&limit=${encodeURIComponent(String(data.limit))}`
    );
  });

export const getPlayerDetail = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ adminId: z.string().uuid(), playerId: z.string().uuid() })
  )
  .handler(async ({ data }) => {
    return await winamApiGet<{
      player: unknown;
      subscriptions: Array<unknown>;
      sessions: Array<unknown>;
      ledger: Array<unknown>;
      missions: Array<unknown>;
      kyc: unknown;
    }>(
      `/admin/data/players/${encodeURIComponent(data.playerId)}?admin_id=${encodeURIComponent(data.adminId)}`
    );
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
    return await winamApiPost<{ success: boolean }>("/admin/mutations/players/flag", {
      admin_id: data.adminId,
      player_id: data.playerId,
      flagged: data.flagged,
      reason: data.reason,
    });
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
    return await winamApiPost<{ success: boolean; newBalance?: number }>("/admin/mutations/players/coins", {
      admin_id: data.adminId,
      player_id: data.playerId,
      amount: data.amount,
      reason: data.reason,
    });
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
    return await winamApiPost<{ success: boolean; newXP?: number; newTier?: string }>("/admin/mutations/players/xp", {
      admin_id: data.adminId,
      player_id: data.playerId,
      amount: data.amount,
      reason: data.reason,
    });
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
    return await winamApiPost<{ success: boolean; newValidUntil?: string }>("/admin/mutations/subscriptions/update", {
      admin_id: data.adminId,
      player_id: data.playerId,
      action: data.action,
      days: data.days ?? null,
      reason: data.reason,
    });
  });

// ============================================================
// BANNERS
// ============================================================
export const getBanners = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid() }))
  .handler(async ({ data }) => {
    return await winamApiGet<{ banners: Array<unknown> }>(
      `/admin/data/banners?admin_id=${encodeURIComponent(data.adminId)}`
    );
  });

const bannerFields = z.object({
  title: z.string().min(1).max(30),
  subtitle: z.string().min(1).max(80),
  icon_url: z.string().max(500).nullable().optional(),
  is_active: z.boolean(),
  display_order: z.number().int().min(0).max(9999),
});

export const createBanner = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid() }).merge(bannerFields))
  .handler(async ({ data }) => {
    return await winamApiPost<{ banner: { id: string } }>("/admin/mutations/banners/create", {
      admin_id: data.adminId,
      title: data.title,
      subtitle: data.subtitle,
      icon_url: data.icon_url ?? null,
      is_active: data.is_active,
      display_order: data.display_order,
    });
  });

export const updateBanner = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ adminId: z.string().uuid(), bannerId: z.string().uuid() }).merge(
      bannerFields.partial()
    )
  )
  .handler(async ({ data }) => {
    return await winamApiPost<{ success: boolean }>("/admin/mutations/banners/update", {
      admin_id: data.adminId,
      banner_id: data.bannerId,
      title: data.title ?? null,
      subtitle: data.subtitle ?? null,
      icon_url: data.icon_url ?? null,
      is_active: data.is_active ?? null,
      display_order: data.display_order ?? null,
    });
  });

export const deleteBanner = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid(), bannerId: z.string().uuid() }))
  .handler(async ({ data }) => {
    return await winamApiPost<{ success: boolean }>("/admin/mutations/banners/delete", {
      admin_id: data.adminId,
      banner_id: data.bannerId,
    });
  });

export const reorderBanners = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      adminId: z.string().uuid(),
      order: z.array(z.string().uuid()).max(50),
    })
  )
  .handler(async ({ data }) => {
    for (let i = 0; i < data.order.length; i++) {
      await winamApiPost<{ success: boolean }>("/admin/mutations/banners/update", {
        admin_id: data.adminId,
        banner_id: data.order[i],
        display_order: i,
      });
    }
    return { success: true };
  });

// ============================================================
// MISSIONS
// ============================================================
export const getMissions = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid() }))
  .handler(async ({ data }) => {
    return await winamApiGet<{ missions: Array<unknown> }>(
      `/admin/data/missions?admin_id=${encodeURIComponent(data.adminId)}`
    );
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
    return await winamApiPost<{ mission: { id: string } }>("/admin/mutations/missions/create", {
      admin_id: data.adminId,
      title: data.title,
      game_type: data.game_type,
      condition_type: data.condition_type,
      condition_value: data.condition_value,
      reward_type: data.reward_type,
      reward_amount: data.reward_amount,
      is_active: data.is_active,
    });
  });

export const updateMission = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ adminId: z.string().uuid(), missionId: z.string().uuid() }).merge(
      missionFields.partial()
    )
  )
  .handler(async ({ data }) => {
    return await winamApiPost<{ success: boolean }>("/admin/mutations/missions/update", {
      admin_id: data.adminId,
      mission_id: data.missionId,
      title: data.title ?? null,
      game_type: data.game_type ?? null,
      condition_type: data.condition_type ?? null,
      condition_value: data.condition_value ?? null,
      reward_type: data.reward_type ?? null,
      reward_amount: data.reward_amount ?? null,
      is_active: data.is_active ?? null,
    });
  });

// ============================================================
// PLATFORM CONFIG
// ============================================================
export const getPlatformConfig = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid() }))
  .handler(async ({ data }) => {
    return await winamApiGet<{ config: Array<unknown> }>(
      `/admin/data/config?admin_id=${encodeURIComponent(data.adminId)}`
    );
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
    return await winamApiPost<{ success: boolean }>("/admin/mutations/config/update", {
      admin_id: data.adminId,
      key: data.key,
      value: data.value,
    });
  });


// ============================================================
// KYC ADMIN
// ============================================================
export const getKycForPlayer = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid(), playerId: z.string().uuid() }))
  .handler(async ({ data }) => {
    return await winamApiGet<{ kyc: unknown }>(
      `/admin/data/players/${encodeURIComponent(data.playerId)}/kyc?admin_id=${encodeURIComponent(data.adminId)}`
    );
  });

export const verifyKyc = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid(), playerId: z.string().uuid() }))
  .handler(async ({ data }) => {
    return await winamApiPost<{ success: boolean }>("/admin/mutations/kyc/verify", {
      admin_id: data.adminId,
      player_id: data.playerId,
    });
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
    return await winamApiPost<{ success: boolean; paymentId?: string }>("/admin/mutations/payments/create", {
      admin_id: data.adminId,
      player_id: data.playerId,
      winner_id: data.winnerId,
      draw_week_id: data.drawWeekId,
      amount_naira: data.amountNaira,
      prize_type: data.prizeType,
    });
  });

export const markPaymentPaid = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    adminId: z.string().uuid(),
    paymentId: z.string().uuid(),
    playerId: z.string().uuid(),
  }))
  .handler(async ({ data }) => {
    return await winamApiPost<{ success: boolean }>("/admin/mutations/payments/mark-paid", {
      admin_id: data.adminId,
      payment_id: data.paymentId,
      player_id: data.playerId,
    });
  });

export const getPaymentsForPlayer = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    adminId: z.string().uuid(),
    playerId: z.string().uuid(),
  }))
  .handler(async ({ data }) => {
    return await winamApiGet<{ payments: Array<unknown> }>(
      `/admin/data/players/${encodeURIComponent(data.playerId)}/payments?admin_id=${encodeURIComponent(data.adminId)}`
    );
  });

// ============================================================
// DRAW MANAGEMENT
// ============================================================
export const getDrawWeeks = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid() }))
  .handler(async ({ data }) => {
    return await winamApiGet<{ weeks: Array<unknown> }>(
      `/admin/data/draws?admin_id=${encodeURIComponent(data.adminId)}`
    );
  });

export const lockDrawWeek = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid(), drawWeekId: z.string().uuid() }))
  .handler(async ({ data }) => {
    return await winamApiPost<{ success: boolean; totalEntries: number }>("/admin/draws/lock", {
      admin_id: data.adminId,
      draw_week_id: data.drawWeekId,
    });
  });

export const executeDrawWeek = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid(), drawWeekId: z.string().uuid() }))
  .handler(async ({ data }) => {
    return await winamApiPost<{
      success: boolean;
      winnerCount: number;
      totalTickets: number;
      cashWinners: number;
      airtimeWinners: number;
    }>("/admin/draws/execute", {
      admin_id: data.adminId,
      draw_week_id: data.drawWeekId,
    });
  });

export const publishWinners = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid(), drawWeekId: z.string().uuid() }))
  .handler(async ({ data }) => {
    return await winamApiPost<{ success: boolean }>("/admin/draws/publish", {
      admin_id: data.adminId,
      draw_week_id: data.drawWeekId,
    });
  });

export const settleDrawWeek = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid(), drawWeekId: z.string().uuid() }))
  .handler(async ({ data }) => {
    return await winamApiPost<{ success: boolean }>("/admin/draws/settle", {
      admin_id: data.adminId,
      draw_week_id: data.drawWeekId,
    });
  });

export const getWinners = createServerFn({ method: "POST" })
  .inputValidator(z.object({ adminId: z.string().uuid(), drawWeekId: z.string().uuid() }))
  .handler(async ({ data }) => {
    return await winamApiGet<{ winners: Array<unknown> }>(
      `/admin/data/draws/${encodeURIComponent(data.drawWeekId)}/winners?admin_id=${encodeURIComponent(data.adminId)}`
    );
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
    return await winamApiPost<{ success: boolean }>("/admin/winners/flag", {
      admin_id: data.adminId,
      winner_id: data.winnerId,
      flagged: data.flagged,
    });
  });

// ============================================================
// PUBLIC (no admin) — for player-facing winners screen
// ============================================================
export const getPublishedWinners = createServerFn({ method: "POST" })
  .handler(async () => {
    return await winamApiGet<{ weeks: Array<unknown> }>("/winners/published");
  });
