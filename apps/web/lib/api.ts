import type {
  Banner,
  DrawWeek,
  GameSession,
  KYC,
  Mission,
  Player,
  PlayerMission,
  Ticket,
} from "@/types";

export interface AdminBannerRow {
  id: string;
  title: string;
  subtitle: string | null;
  icon_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at?: string | null;
}

export interface AdminConfigRow {
  key: string;
  value: unknown;
  updated_at?: string | null;
  updated_by?: string | null;
  description?: string | null;
  category?: string | null;
}

export interface AdminHelpRow {
  name: string;
  type: string;
  description: string;
  default?: string | null;
  defaultVal?: string | null;
}

export interface AdminHelpItem {
  title: string;
  steps?: string[];
  list?: string[];
  text?: string;
}

export type AdminHelpBlock =
  | {
      type: "section";
      title: string;
      text?: string;
      info?: string;
      warning?: string;
      rows?: AdminHelpRow[];
      steps?: string[];
      grid?: AdminHelpItem[];
      list?: string[];
    }
  | {
      type: "table";
      title?: string;
      headers: string[];
      rows: string[][];
      warning?: string;
    }
  | {
      type: "steps";
      title?: string;
      steps: string[];
      warning?: string;
      info?: string;
      text?: string;
    }
  | {
      type: "grid";
      title?: string;
      warning?: string;
      items: AdminHelpItem[];
    }
  | {
      type: "warning";
      text: string;
    }
  | {
      type: "info";
      text: string;
    };

export interface AdminHelpArticle {
  id: string;
  label: string;
  intro?: string;
  warning?: string;
  blocks: AdminHelpBlock[];
}

function getApiBase(): string {
  if (typeof window === "undefined") {
    return (
      process.env.API_INTERNAL_BASE_URL?.replace(/\/$/, "") ??
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
      "http://api:8000/api/v1"
    );
  }

  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:8000/api/v1"
  );
}

type ApiErrorBody = { detail?: string; message?: string; error?: string };

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${getApiBase()}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    ...init,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as T | ApiErrorBody)
    : ((await response.text()) as unknown as T);

  if (!response.ok) {
    const body = payload as ApiErrorBody;
    throw new Error(
      body?.detail ?? body?.message ?? body?.error ?? `Request failed (${response.status})`,
    );
  }

  return payload as T;
}

function toPlayer(summary: {
  id: string;
  nickname: string | null;
  msisdnLast4?: string | null;
  coinBalance?: number;
  xpTotal?: number;
  rankTier?: string;
  currentStreak?: number;
  streak_last_date?: string | null;
  created_at?: string | null;
}): Player {
  return {
    id: summary.id,
    msisdn_hash: "",
    nickname: summary.nickname ?? "Player",
    coins: summary.coinBalance ?? 0,
    xp: summary.xpTotal ?? 0,
    rank: summary.rankTier ?? "starter",
    streak: summary.currentStreak ?? 0,
    streak_last_date: summary.streak_last_date ?? null,
    created_at: summary.created_at ?? new Date().toISOString(),
  };
}

function normalizeTicketSource(source: string | null | undefined): Ticket["source"] {
  if (source === "mission") return "mission";
  if (source === "streak") return "streak";
  return "gameplay";
}

// ──────────────────────────────────────────────────────────────────────────────
// Auth

export async function sendOtp(msisdn: string): Promise<{ success: boolean; message?: string; msisdnLast4?: string }> {
  return apiFetch("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ msisdn }),
  });
}

export async function verifyOtp(msisdn: string, otp: string): Promise<{
  success: boolean;
  message?: string;
  playerId: string;
  needsOnboarding: boolean;
  msisdnLast4: string;
  msisdn: string;
  hasActiveSubscription: boolean;
  activeSubscription: Record<string, unknown> | null;
  redirectUrl?: string;
  data?: Record<string, unknown>;
  subscriptionId?: string | null;
}> {
  return apiFetch("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ msisdn, otp }),
  });
}

export async function getPlayerSession(): Promise<{
  valid: boolean;
  player?: {
    id: string;
    nickname: string | null;
    msisdnLast4: string;
    coinBalance: number;
    xpTotal: number;
    currentStreak: number;
    rankTier: string;
    createdAt?: string;
  };
  expiresAt?: number;
}> {
  return apiFetch("/auth/session");
}

export async function logoutPlayer(): Promise<{ success: boolean }> {
  return apiFetch("/auth/logout", {
    method: "POST",
  });
}

export async function setNickname(playerId: string, nickname: string): Promise<{ success: boolean; error?: string }> {
  return apiFetch("/auth/nickname", {
    method: "POST",
    body: JSON.stringify({ playerId, nickname }),
  });
}

export async function renewSubscription(playerId: string, plan: "daily" | "weekly"): Promise<{ success: boolean; newValidUntil?: string }> {
  return apiFetch("/auth/renew", {
    method: "POST",
    body: JSON.stringify({ player_id: playerId, plan }),
  });
}

export async function getSubscriptionStatus(playerId: string): Promise<{ success: boolean; data?: Record<string, unknown>; message?: string }> {
  return apiFetch(`/auth/subscription-status?player_id=${encodeURIComponent(playerId)}`);
}

// ──────────────────────────────────────────────────────────────────────────────
// Player

export async function getPlayer(playerId: string): Promise<Player | null> {
  const result = await apiFetch<{
    success: boolean;
    player?: { id: string; nickname: string | null; msisdnLast4?: string; coinBalance?: number; xpTotal?: number; currentStreak?: number; rankTier?: string };
  }>(`/players/me?player_id=${encodeURIComponent(playerId)}`);
  return result.player ? toPlayer({ ...result.player, created_at: new Date().toISOString(), streak_last_date: null }) : null;
}

export async function updatePlayerNickname(playerId: string, nickname: string): Promise<void> {
  const result = await setNickname(playerId, nickname);
  if (!result.success) {
    throw new Error(result.error ?? "Failed to update nickname");
  }
}

export async function getPlayerDashboard(playerId: string): Promise<{
  player: Player;
  weekTotal: number;
  weekCap: number;
  totalSessions: number;
  bestSession: number;
  drawWeek: DrawWeek | null;
  publishedWeekId: string | null;
  missionsCount: number;
}> {
  const result = await apiFetch<{
    success: boolean;
    player: {
      id: string;
      nickname: string | null;
      msisdnLast4: string;
      coinBalance: number;
      xpTotal: number;
      rankTier: string;
      currentStreak: number;
      avatarId?: string | null;
    };
    weekTotal: number;
    weekCap: number;
    totalSessions: number;
    bestSession: number;
    drawWeek: DrawWeek | null;
    publishedWeekId: string | null;
    missionsCount: number;
  }>(`/players/dashboard?player_id=${encodeURIComponent(playerId)}`);

  return {
    player: toPlayer({
      ...result.player,
      streak_last_date: null,
      created_at: new Date().toISOString(),
    }),
    weekTotal: result.weekTotal,
    weekCap: result.weekCap,
    totalSessions: result.totalSessions,
    bestSession: result.bestSession,
    drawWeek: result.drawWeek,
    publishedWeekId: result.publishedWeekId,
    missionsCount: result.missionsCount,
  };
}

export async function getPlayerProfile(playerId: string): Promise<{
  player: Player | null;
  dashboard: Awaited<ReturnType<typeof getPlayerDashboard>> | null;
  subscription: { success: boolean; data?: Record<string, unknown> };
  kyc: KYC | null;
}> {
  const result = await apiFetch<{
    success: boolean;
    player: {
      id: string;
      nickname: string | null;
      msisdnLast4: string;
      coinBalance: number;
      xpTotal: number;
      rankTier: string;
      currentStreak: number;
    } | null;
    dashboard: {
      weekTotal: number;
      weekCap: number;
      totalSessions: number;
      bestSession: number;
      drawWeek: DrawWeek | null;
      publishedWeekId: string | null;
      missionsCount: number;
    } | null;
    subscription: { success: boolean; data?: Record<string, unknown> };
    kyc: KYC | null;
  }>(`/players/profile?player_id=${encodeURIComponent(playerId)}`);

  return {
    player: result.player
      ? toPlayer({
          ...result.player,
          created_at: new Date().toISOString(),
          streak_last_date: null,
        })
      : null,
    dashboard: result.dashboard
      ? {
          player: result.player
            ? toPlayer({
                ...result.player,
                created_at: new Date().toISOString(),
                streak_last_date: null,
              })
            : toPlayer({
                id: playerId,
                nickname: "Player",
                coinBalance: 0,
                xpTotal: 0,
                currentStreak: 0,
                rankTier: "starter",
                created_at: new Date().toISOString(),
                streak_last_date: null,
              }),
          ...result.dashboard,
        }
      : null,
    subscription: result.subscription,
    kyc: result.kyc,
  };
}

export async function getRecentSessions(playerId: string, limit = 10): Promise<GameSession[]> {
  const result = await apiFetch<{
    success: boolean;
    sessions: Array<{
      id: string;
      game_type: "checkmate" | "wisdomdrop";
      puzzles_solved: number;
      entries_awarded: number;
      completed_at: string | null;
      hints_used?: number;
      coins_earned?: number;
      xp_earned?: number;
      duration_seconds?: number;
    }>;
  }>(`/players/recent-sessions?player_id=${encodeURIComponent(playerId)}&limit=${limit}`);

  return (result.sessions ?? []).map((session) => ({
    id: session.id,
    player_id: playerId,
    game_type: session.game_type,
    puzzles_solved: session.puzzles_solved,
    hints_used: session.hints_used ?? 0,
    coins_earned: session.coins_earned ?? 0,
    xp_earned: session.xp_earned ?? 0,
    tickets_earned: session.entries_awarded,
    completed_at: session.completed_at ?? new Date().toISOString(),
  }));
}

export async function getTickets(playerId: string): Promise<Ticket[]> {
  const result = await apiFetch<{ success: boolean; weeks: Array<{ drawWeekId: string; tickets: Ticket[] }> }>(
    `/players/entries?player_id=${encodeURIComponent(playerId)}`,
  );
  return result.weeks.flatMap((week) =>
    (week.tickets ?? []).map((ticket) => ({
      id: ticket.id,
      player_id: playerId,
      draw_week_id: week.drawWeekId,
      source: ticket.source,
      created_at: ticket.created_at,
    })),
  );
}

export async function getPlayerEntries(playerId: string): Promise<{
  weeks: Array<{
    drawWeekId: string;
    weekStartWat: string;
    weekEndWat: string;
    drawExecutesAt: string;
    status: string;
    totalTickets: number;
    tickets: Ticket[];
  }>;
  weekCap: number;
}> {
  const result = await apiFetch<{
    weeks: Array<{
      drawWeekId: string;
      weekStartWat: string;
      weekEndWat: string;
      drawExecutesAt: string;
      status: string;
      totalTickets: number;
      tickets: Array<{ ticketId: string; source: string; earnedAt: string | null }>;
    }>;
    weekCap: number;
  }>(`/players/entries?player_id=${encodeURIComponent(playerId)}`);

  return {
    weekCap: result.weekCap,
    weeks: (result.weeks ?? []).map((week) => ({
      drawWeekId: week.drawWeekId,
      weekStartWat: week.weekStartWat,
      weekEndWat: week.weekEndWat,
      drawExecutesAt: week.drawExecutesAt,
      status: week.status,
      totalTickets: week.totalTickets,
      tickets: (week.tickets ?? []).map((ticket) => ({
        id: ticket.ticketId,
        player_id: playerId,
        draw_week_id: week.drawWeekId,
        source: normalizeTicketSource(ticket.source),
        created_at: ticket.earnedAt ?? new Date().toISOString(),
      })),
    })),
  };
}

export async function getPlayerMissions(playerId: string): Promise<PlayerMission[]> {
  const result = await apiFetch<{ success: boolean; missions: Array<Record<string, unknown>> }>(
    `/missions/active?player_id=${encodeURIComponent(playerId)}`,
  );
  return (result.missions ?? []).map((mission) => ({
    id: String(mission.id),
    player_id: playerId,
    mission_id: String(mission.id),
    progress: Number(mission.progressCurrent ?? 0),
    completed: String(mission.status) === "completed",
    completed_at: (mission.completedAt as string | null) ?? null,
    mission: {
      id: String(mission.id),
      title: String(mission.title ?? ""),
      description: "",
      condition_type: (mission.conditionType as Mission["condition_type"]) ?? "puzzles_solved",
      condition_target: Number(mission.conditionValue ?? 1),
      reward_amount: Number(mission.rewardAmount ?? 0),
      reward_type: (mission.rewardType as Mission["reward_type"]) ?? "ticket",
      is_repeatable: false,
    },
  }));
}

export async function getActiveBanners(): Promise<Banner[]> {
  const result = await apiFetch<{
    banners: Array<{
      id: string;
      title: string;
      subtitle: string | null;
      iconUrl: string | null;
      displayOrder: number;
    }>;
  }>("/banners/active");
  return (result.banners ?? []).map((banner) => ({
    id: banner.id,
    title: banner.title,
    body: banner.subtitle ?? "",
    cta_label: null,
    cta_url: null,
    is_active: true,
    sort_order: banner.displayOrder ?? 0,
  }));
}

export async function getPublicContent(): Promise<{
  support: { email: string; whatsapp: string };
  announcement: {
    id: string;
    image_url: string;
    cta_label: string | null;
    cta_url: string | null;
    frequency: "every_login" | "once_per_week" | "once_only";
    orientation: "portrait" | "landscape";
    is_active: boolean;
  };
}> {
  return apiFetch<{
    support: { email: string; whatsapp: string };
    announcement: {
      id: string;
      image_url: string;
      cta_label: string | null;
      cta_url: string | null;
      frequency: "every_login" | "once_per_week" | "once_only";
      orientation: "portrait" | "landscape";
      is_active: boolean;
    };
  }>("/content/public");
}

export async function getCurrentDrawWeek(): Promise<DrawWeek | null> {
  try {
    return await apiFetch<DrawWeek>("/draws/current");
  } catch {
    return null;
  }
}

export async function getPublishedWinners(): Promise<Array<{
  week: DrawWeek;
  winners: Array<{
    id: string;
    position: number;
    prizeType: "cash" | "airtime";
    prizeAmount: number;
    ticketId: string | null;
    nickname: string | null;
    msisdnLast4: string;
  }>;
}>> {
  const result = await apiFetch<{
    weeks: Array<{
      week: DrawWeek;
      winners: Array<{
        id: string;
        position: number;
        prizeType: "cash" | "airtime";
        prizeAmount: number;
        ticketId: string | null;
        nickname: string | null;
        msisdnLast4: string;
      }>;
    }>;
  }>("/winners/published");

  return result.weeks ?? [];
}

export async function getMyWinnerStatus(playerId: string): Promise<{
  won: boolean;
  winnerId?: string;
  drawWeekId?: string;
  position?: number;
  prizeType?: "cash" | "airtime";
  prizeAmount?: number;
  kyc?: {
    identitySubmitted: boolean;
    bankSubmitted: boolean;
    verified: boolean;
    paymentProcessed: boolean;
  } | null;
}> {
  return apiFetch(`/winners/me?player_id=${encodeURIComponent(playerId)}`);
}

export async function getWeeklyLeaderboard(playerId?: string, limit = 10): Promise<{
  players: Array<{ id: string; name: string; puzzles: number; rankTier: string }>;
  totalPlayers: number;
  currentPlayer: { id: string; name: string; puzzles: number; rankTier: string; rank: number } | null;
  weekStartWat: string | null;
  weekEndWat: string | null;
  drawExecutesAt: string | null;
}> {
  return apiFetch(`/leaderboards/weekly?limit=${limit}${playerId ? `&player_id=${encodeURIComponent(playerId)}` : ""}`);
}

export async function getDailyLeaderboard(playerId?: string, limit = 50): Promise<{
  players: Array<{ id: string; name: string; puzzles: number; rankTier: string }>;
  totalPlayers: number;
  currentPlayer: { id: string; name: string; puzzles: number; rankTier: string; rank: number } | null;
  todayWat: string;
}> {
  return apiFetch(`/leaderboards/daily?limit=${limit}${playerId ? `&player_id=${encodeURIComponent(playerId)}` : ""}`);
}

// ──────────────────────────────────────────────────────────────────────────────
// KYC

export async function getPlayerKycStatus(playerId: string): Promise<{ kyc: KYC | null }> {
  return apiFetch(`/kyc/status?player_id=${encodeURIComponent(playerId)}`);
}

export async function submitIdentity(payload: {
  playerId: string;
  firstName: string;
  lastName: string;
  dob: string;
  idType: "NIN" | "BVN";
  idNumber: string;
}): Promise<{ success: boolean; kyc?: KYC }> {
  return apiFetch("/kyc/identity", {
    method: "POST",
    body: JSON.stringify({
      player_id: payload.playerId,
      first_name: payload.firstName,
      last_name: payload.lastName,
      dob: payload.dob,
      id_type: payload.idType,
      id_number: payload.idNumber,
    }),
  });
}

export async function submitBankDetails(payload: {
  playerId: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName?: string | null;
}): Promise<{ success: boolean }> {
  return apiFetch("/kyc/bank", {
    method: "POST",
    body: JSON.stringify({
      player_id: payload.playerId,
      bank_code: payload.bankCode,
      bank_name: payload.bankName,
      account_number: payload.accountNumber,
      account_name: payload.accountName ?? null,
    }),
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Admin

export async function adminLogin(email: string, password: string): Promise<{
  success: boolean;
  adminId: string;
  email: string;
}> {
  return apiFetch("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getAdminSessionFromServer(): Promise<{
  valid: boolean;
  session?: {
    adminId: string;
    email: string;
    role: string;
  };
  expiresAt?: number;
}> {
  return apiFetch("/admin/auth/session");
}

export async function requireAdminSession(): Promise<{
  adminId: string;
  email: string;
  role: string;
  expiresAt: number;
}> {
  const result = await getAdminSessionFromServer();
  if (!result.valid || !result.session) {
    throw new Error("Admin session missing");
  }
  return {
    adminId: result.session.adminId,
    email: result.session.email,
    role: result.session.role,
    expiresAt: result.expiresAt ?? Math.floor(Date.now() / 1000),
  };
}

export async function logoutAdmin(): Promise<{ success: boolean }> {
  return apiFetch("/admin/auth/logout", {
    method: "POST",
  });
}

export async function getAdminDashboardStats(adminId: string): Promise<Record<string, unknown>> {
  return apiFetch(`/admin/data/dashboard/stats?admin_id=${encodeURIComponent(adminId)}`);
}

export async function getAdminPlayers(
  adminId: string,
  search = "",
  page = 1,
  limit = 25,
): Promise<{ players: Array<Record<string, unknown>>; total: number }> {
  return apiFetch(
    `/admin/data/players?admin_id=${encodeURIComponent(adminId)}&search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`,
  );
}

export async function getAdminPlayerDetail(adminId: string, playerId: string): Promise<Record<string, unknown>> {
  return apiFetch(`/admin/data/players/${encodeURIComponent(playerId)}?admin_id=${encodeURIComponent(adminId)}`);
}

export async function getAdminBanners(adminId: string): Promise<{ banners: AdminBannerRow[] }> {
  return apiFetch(`/admin/data/banners?admin_id=${encodeURIComponent(adminId)}`);
}

export async function getAdminMissions(adminId: string): Promise<{ missions: Mission[] }> {
  return apiFetch(`/admin/data/missions?admin_id=${encodeURIComponent(adminId)}`);
}

export async function getAdminConfig(adminId: string): Promise<{ config: AdminConfigRow[] }> {
  return apiFetch(`/admin/data/config?admin_id=${encodeURIComponent(adminId)}`);
}

export async function getAdminDraws(adminId: string): Promise<Record<string, unknown>> {
  return apiFetch(`/admin/data/draws?admin_id=${encodeURIComponent(adminId)}`);
}

export async function getAdminDrawWinners(adminId: string, drawWeekId: string): Promise<Record<string, unknown>> {
  return apiFetch(`/admin/data/draws/${encodeURIComponent(drawWeekId)}/winners?admin_id=${encodeURIComponent(adminId)}`);
}

export async function getAdminHelpContent(adminId: string): Promise<{
  articles: AdminHelpArticle[];
}> {
  return apiFetch(`/admin/data/help?admin_id=${encodeURIComponent(adminId)}`);
}

export async function lockDrawWeek(adminId: string): Promise<Record<string, unknown>> {
  return apiFetch("/admin/draws/lock", {
    method: "POST",
    body: JSON.stringify({ admin_id: adminId }),
  });
}

export async function executeDrawWeek(adminId: string): Promise<Record<string, unknown>> {
  return apiFetch("/admin/draws/execute", {
    method: "POST",
    body: JSON.stringify({ admin_id: adminId }),
  });
}

export async function publishDrawWeek(adminId: string): Promise<Record<string, unknown>> {
  return apiFetch("/admin/draws/publish", {
    method: "POST",
    body: JSON.stringify({ admin_id: adminId }),
  });
}

export async function settleDrawWeek(adminId: string): Promise<Record<string, unknown>> {
  return apiFetch("/admin/draws/settle", {
    method: "POST",
    body: JSON.stringify({ admin_id: adminId }),
  });
}

export async function createBanner(payload: {
  adminId: string;
  title: string;
  subtitle: string;
  iconUrl?: string | null;
  isActive: boolean;
  displayOrder: number;
}): Promise<{ banner: { id: string } }> {
  return apiFetch("/admin/mutations/banners/create", {
    method: "POST",
    body: JSON.stringify({
      admin_id: payload.adminId,
      title: payload.title,
      subtitle: payload.subtitle,
      icon_url: payload.iconUrl ?? null,
      is_active: payload.isActive,
      display_order: payload.displayOrder,
    }),
  });
}

export async function updateBanner(payload: {
  adminId: string;
  bannerId: string;
  title?: string | null;
  subtitle?: string | null;
  iconUrl?: string | null;
  isActive?: boolean | null;
  displayOrder?: number | null;
}): Promise<{ success: boolean }> {
  return apiFetch("/admin/mutations/banners/update", {
    method: "POST",
    body: JSON.stringify({
      admin_id: payload.adminId,
      banner_id: payload.bannerId,
      title: payload.title ?? null,
      subtitle: payload.subtitle ?? null,
      icon_url: payload.iconUrl ?? null,
      is_active: payload.isActive ?? null,
      display_order: payload.displayOrder ?? null,
    }),
  });
}

export async function deleteBanner(payload: {
  adminId: string;
  bannerId: string;
}): Promise<{ success: boolean }> {
  return apiFetch("/admin/mutations/banners/delete", {
    method: "POST",
    body: JSON.stringify({
      admin_id: payload.adminId,
      banner_id: payload.bannerId,
    }),
  });
}

export async function createMission(payload: {
  adminId: string;
  title: string;
  gameType?: string | null;
  conditionType: string;
  conditionValue: number;
  rewardType: string;
  rewardAmount: number;
  isActive: boolean;
}): Promise<{ mission: { id: string } }> {
  return apiFetch("/admin/mutations/missions/create", {
    method: "POST",
    body: JSON.stringify({
      admin_id: payload.adminId,
      title: payload.title,
      game_type: payload.gameType ?? null,
      condition_type: payload.conditionType,
      condition_value: payload.conditionValue,
      reward_type: payload.rewardType,
      reward_amount: payload.rewardAmount,
      is_active: payload.isActive,
    }),
  });
}

export async function updateMission(payload: {
  adminId: string;
  missionId: string;
  title?: string | null;
  gameType?: string | null;
  conditionType?: string | null;
  conditionValue?: number | null;
  rewardType?: string | null;
  rewardAmount?: number | null;
  isActive?: boolean | null;
}): Promise<{ success: boolean }> {
  return apiFetch("/admin/mutations/missions/update", {
    method: "POST",
    body: JSON.stringify({
      admin_id: payload.adminId,
      mission_id: payload.missionId,
      title: payload.title ?? null,
      game_type: payload.gameType ?? null,
      condition_type: payload.conditionType ?? null,
      condition_value: payload.conditionValue ?? null,
      reward_type: payload.rewardType ?? null,
      reward_amount: payload.rewardAmount ?? null,
      is_active: payload.isActive ?? null,
    }),
  });
}

export async function updatePlatformConfig(payload: {
  adminId: string;
  key: string;
  value: unknown;
}): Promise<{ success: boolean }> {
  return apiFetch("/admin/mutations/config/update", {
    method: "POST",
    body: JSON.stringify({
      admin_id: payload.adminId,
      key: payload.key,
      value: payload.value,
    }),
  });
}

export async function verifyKyc(payload: { adminId: string; playerId: string }): Promise<{ success: boolean }> {
  return apiFetch("/admin/mutations/kyc/verify", {
    method: "POST",
    body: JSON.stringify({
      admin_id: payload.adminId,
      player_id: payload.playerId,
    }),
  });
}

export async function flagPlayer(payload: {
  adminId: string;
  playerId: string;
  flagged: boolean;
  reason: string;
}): Promise<{ success: boolean }> {
  return apiFetch("/admin/mutations/players/flag", {
    method: "POST",
    body: JSON.stringify({
      admin_id: payload.adminId,
      player_id: payload.playerId,
      flagged: payload.flagged,
      reason: payload.reason,
    }),
  });
}

export async function adjustPlayerCoins(payload: {
  adminId: string;
  playerId: string;
  amount: number;
  reason: string;
}): Promise<{ success: boolean; newBalance?: number }> {
  return apiFetch("/admin/mutations/players/coins", {
    method: "POST",
    body: JSON.stringify({
      admin_id: payload.adminId,
      player_id: payload.playerId,
      amount: payload.amount,
      reason: payload.reason,
    }),
  });
}

export async function adjustPlayerXp(payload: {
  adminId: string;
  playerId: string;
  amount: number;
  reason: string;
}): Promise<{ success: boolean; newXP?: number; newTier?: string }> {
  return apiFetch("/admin/mutations/players/xp", {
    method: "POST",
    body: JSON.stringify({
      admin_id: payload.adminId,
      player_id: payload.playerId,
      amount: payload.amount,
      reason: payload.reason,
    }),
  });
}

export async function createPayment(payload: {
  adminId: string;
  playerId: string;
  winnerId: string;
  drawWeekId: string;
  amountNaira: number;
  prizeType: string;
}): Promise<{ success: boolean; paymentId: string }> {
  return apiFetch("/admin/mutations/payments/create", {
    method: "POST",
    body: JSON.stringify({
      admin_id: payload.adminId,
      player_id: payload.playerId,
      winner_id: payload.winnerId,
      draw_week_id: payload.drawWeekId,
      amount_naira: payload.amountNaira,
      prize_type: payload.prizeType,
    }),
  });
}

export async function markPaymentPaid(payload: {
  adminId: string;
  paymentId: string;
  playerId: string;
}): Promise<{ success: boolean }> {
  return apiFetch("/admin/mutations/payments/mark-paid", {
    method: "POST",
    body: JSON.stringify({
      admin_id: payload.adminId,
      payment_id: payload.paymentId,
      player_id: payload.playerId,
    }),
  });
}

export async function flagWinner(payload: {
  adminId: string;
  winnerId: string;
  flagged: boolean;
}): Promise<{ success: boolean }> {
  return apiFetch("/admin/winners/flag", {
    method: "POST",
    body: JSON.stringify({
      admin_id: payload.adminId,
      winner_id: payload.winnerId,
      flagged: payload.flagged,
    }),
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Gameplay

export async function startGameSession(playerId: string, gameType: "checkmate" | "wisdomdrop") {
  return apiFetch("/sessions/start", {
    method: "POST",
    body: JSON.stringify({ player_id: playerId, game_type: gameType }),
  });
}

export async function submitGameMove(payload: {
  sessionId: string;
  puzzleId: string;
  answer: string;
  timeMs: number;
  nextPuzzleId?: string;
}) {
  return apiFetch("/sessions/move", {
    method: "POST",
    body: JSON.stringify({
      session_id: payload.sessionId,
      puzzle_id: payload.puzzleId,
      answer: payload.answer,
      time_ms: payload.timeMs,
      next_puzzle_id: payload.nextPuzzleId ?? null,
    }),
  });
}

export async function requestHint(payload: {
  playerId: string;
  puzzleId: string;
  tier: number;
}) {
  return apiFetch("/sessions/hint", {
    method: "POST",
    body: JSON.stringify({
      player_id: payload.playerId,
      puzzle_id: payload.puzzleId,
      tier: payload.tier,
    }),
  });
}

export async function closeGameSession(payload: {
  sessionId: string;
  playerId: string;
  gameType: "checkmate" | "wisdomdrop";
  drawWeekId?: string;
  puzzlesSolved: number;
  hintsUsed: number;
  durationSeconds: number;
  completionReason: "completed" | "lives_out" | "exited";
}) {
  return apiFetch("/sessions/close", {
    method: "POST",
    body: JSON.stringify({
      session_id: payload.sessionId,
      player_id: payload.playerId,
      game_type: payload.gameType,
      draw_week_id: payload.drawWeekId ?? null,
      puzzles_solved: payload.puzzlesSolved,
      hints_used: payload.hintsUsed,
      duration_seconds: payload.durationSeconds,
      completion_reason: payload.completionReason,
    }),
  });
}
