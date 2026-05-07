import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { winamApiGet, winamApiPost } from "@/lib/winam-api";

// ── getPlayerData ─────────────────────────────────────────────────────
export const getPlayerData = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      playerId: z.string().uuid(),
    })
  )
  .handler(async ({ data }) => {
    return await winamApiGet<{
      success: boolean;
      player?: {
        id: string;
        nickname: string | null;
        msisdnLast4: string;
        coinBalance: number;
        xpTotal: number;
        rankTier: string;
        currentStreak: number;
        avatarId: number | null;
      };
      weekTotal?: number;
      weekCap?: number;
      totalSessions?: number;
      bestSession?: number;
      drawWeek?: {
        id: string;
        drawExecutesAt: string;
        weekStartWat: string;
        weekEndWat: string;
        status: string;
      } | null;
      publishedWeekId?: string | null;
      error?: string;
    }>(`/players/dashboard?player_id=${encodeURIComponent(data.playerId)}`);
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
    return await winamApiPost<{ success: boolean; nickname?: string; error?: string }>("/auth/nickname", {
      playerId: data.playerId,
      nickname: data.nickname.trim(),
    });
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
    return await winamApiGet<{
      success: boolean;
      missions: Array<{
        id: string;
        title: string;
        conditionType: string;
        conditionValue: number;
        progressCurrent: number;
        rewardAmount: number;
        status: string;
      }>;
    }>(`/missions/active?player_id=${encodeURIComponent(data.playerId)}`);
  });

// ── getActiveBanners ──────────────────────────────────────────────────
export const getActiveBanners = createServerFn({ method: "POST" }).handler(
  async () => {
    return await winamApiGet<{ success: boolean; banners: Array<{ id: string; title: string; subtitle: string; iconUrl?: string | null; displayOrder: number }> }>(
      "/banners/active"
    );
  }
);


// ── Winner + KYC claim status ──────────────────────────────────────────
export const getMyWinnerStatus = createServerFn({ method: "POST" })
  .inputValidator(z.object({ playerId: z.string().uuid() }))
  .handler(async ({ data }) => {
    return await winamApiGet<{
      won: boolean;
      winnerId?: string;
      drawWeekId?: string;
      position?: number;
      prizeType?: string;
      prizeAmount?: number;
      kyc?: {
        identitySubmitted: boolean;
        bankSubmitted: boolean;
        verified: boolean;
        paymentProcessed: boolean;
      } | null;
    }>(`/winners/me?player_id=${encodeURIComponent(data.playerId)}`);
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
    return await winamApiPost<{ success: boolean; error?: string }>("/kyc/identity", {
      player_id: data.playerId,
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      dob: data.dob,
      id_type: data.idType,
      id_number: data.idNumber,
    });
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
    return await winamApiPost<{ success: boolean; error?: string }>("/kyc/bank", {
      player_id: data.playerId,
      bank_code: data.bankCode.trim(),
      bank_name: data.bankName.trim(),
      account_number: data.accountNumber,
      account_name: data.accountName?.trim() || null,
    });
  });

export const getKycStatus = createServerFn({ method: "POST" })
  .inputValidator(z.object({ playerId: z.string().uuid() }))
  .handler(async ({ data }) => {
    return await winamApiGet<{ kyc: unknown }>(`/kyc/status?player_id=${encodeURIComponent(data.playerId)}`);
  });

// ── getLeaderboard (weekly — puzzles solved this draw week) ───────────
export const getLeaderboard = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      limit: z.number().min(1).max(50).default(10),
      playerId: z.string().uuid().optional(),
    })
  )
  .handler(async ({ data }) => {
    return await winamApiGet<{
      success: boolean;
      players: Array<{ id: string; name: string; puzzles: number; rankTier: string }>;
      totalPlayers: number;
      weekStartWat: string | null;
      weekEndWat: string | null;
      drawExecutesAt: string | null;
      currentPlayer: { id: string; name: string; puzzles: number; rankTier: string; rank: number } | null;
    }>(
      `/leaderboards/weekly?limit=${encodeURIComponent(String(data.limit))}&player_id=${encodeURIComponent(data.playerId ?? "")}`
    );
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
    return await winamApiGet<{
      success: boolean;
      players: Array<{ id: string; name: string; puzzles: number; rankTier: string }>;
      totalPlayers: number;
      todayWat: string;
      currentPlayer: { id: string; name: string; puzzles: number; rankTier: string; rank: number } | null;
    }>(
      `/leaderboards/daily?limit=${encodeURIComponent(String(data.limit))}&player_id=${encodeURIComponent(data.playerId ?? "")}`
    );
  });
