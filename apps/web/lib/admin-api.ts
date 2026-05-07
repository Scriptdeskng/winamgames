const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

type JsonValue = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

function get<T = any>(path: string): Promise<T> {
  return request<T>(path);
}

function post<T = any>(path: string, body?: JsonValue): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function adminLogin(email: string, password: string) {
  return post<{ success: boolean; error?: string; session?: { adminId: string; email: string; role: string } }>("/admin/auth/login", {
    email,
    password,
  });
}

export function verifyAdminSession(adminId: string) {
  return post<{ valid: boolean; session?: { adminId: string; email: string; role: string } }>("/admin/auth/verify", {
    admin_id: adminId,
  });
}

export function getDashboardStats(adminId: string) {
  return get(`/admin/data/dashboard/stats?admin_id=${encodeURIComponent(adminId)}`);
}

export function getPlayers(adminId: string, search = "", page = 1, limit = 25) {
  return get(`/admin/data/players?admin_id=${encodeURIComponent(adminId)}&search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`);
}

export function getPlayerDetail(adminId: string, playerId: string) {
  return get(`/admin/data/players/${encodeURIComponent(playerId)}?admin_id=${encodeURIComponent(adminId)}`);
}

export function flagPlayer(adminId: string, playerId: string, flagged: boolean, reason: string) {
  return post("/admin/mutations/players/flag", {
    admin_id: adminId,
    player_id: playerId,
    flagged,
    reason,
  });
}

export function adjustPlayerCoins(adminId: string, playerId: string, amount: number, reason: string) {
  return post("/admin/mutations/players/coins", {
    admin_id: adminId,
    player_id: playerId,
    amount,
    reason,
  });
}

export function adjustPlayerXP(adminId: string, playerId: string, amount: number, reason: string) {
  return post("/admin/mutations/players/xp", {
    admin_id: adminId,
    player_id: playerId,
    amount,
    reason,
  });
}

export function updateSubscription(adminId: string, playerId: string, action: "cancel" | "extend", days: number | null, reason: string) {
  return post("/admin/mutations/subscriptions/update", {
    admin_id: adminId,
    player_id: playerId,
    action,
    days,
    reason,
  });
}

export function getBanners(adminId: string) {
  return get(`/admin/data/banners?admin_id=${encodeURIComponent(adminId)}`);
}

export function createBanner(adminId: string, payload: { title: string; subtitle: string; icon_url: string | null; is_active: boolean; display_order: number }) {
  return post("/admin/mutations/banners/create", { admin_id: adminId, ...payload });
}

export function updateBanner(adminId: string, bannerId: string, payload: Partial<{ title: string; subtitle: string; icon_url: string | null; is_active: boolean; display_order: number }>) {
  return post("/admin/mutations/banners/update", { admin_id: adminId, banner_id: bannerId, ...payload });
}

export function deleteBanner(adminId: string, bannerId: string) {
  return post("/admin/mutations/banners/delete", { admin_id: adminId, banner_id: bannerId });
}

export function reorderBanners(adminId: string, order: string[]) {
  return Promise.all(
    order.map((bannerId, index) => updateBanner(adminId, bannerId, { display_order: index })),
  ).then(() => ({ success: true }));
}

export function getMissions(adminId: string) {
  return get(`/admin/data/missions?admin_id=${encodeURIComponent(adminId)}`);
}

export function createMission(adminId: string, payload: { title: string; game_type: string | null; condition_type: string; condition_value: number; reward_type: string; reward_amount: number; is_active: boolean }) {
  return post("/admin/mutations/missions/create", { admin_id: adminId, ...payload });
}

export function updateMission(adminId: string, missionId: string, payload: Partial<{ title: string; game_type: string | null; condition_type: string; condition_value: number; reward_type: string; reward_amount: number; is_active: boolean }>) {
  return post("/admin/mutations/missions/update", { admin_id: adminId, mission_id: missionId, ...payload });
}

export function getPlatformConfig(adminId: string) {
  return get(`/admin/data/config?admin_id=${encodeURIComponent(adminId)}`);
}

export function getIntelliEvents(adminId: string, eventType = "", page = 1, limit = 25) {
  return get(`/admin/data/intelli/events?admin_id=${encodeURIComponent(adminId)}&event_type=${encodeURIComponent(eventType)}&page=${page}&limit=${limit}`);
}

export function updatePlatformConfig(adminId: string, key: string, value: unknown) {
  return post("/admin/mutations/config/update", { admin_id: adminId, key, value });
}

export function getDrawWeeks(adminId: string) {
  return get(`/admin/data/draws?admin_id=${encodeURIComponent(adminId)}`);
}

export function lockDrawWeek(adminId: string, drawWeekId: string) {
  return post("/admin/draws/lock", { admin_id: adminId, draw_week_id: drawWeekId });
}

export function executeDrawWeek(adminId: string, drawWeekId: string) {
  return post("/admin/draws/execute", { admin_id: adminId, draw_week_id: drawWeekId });
}

export function publishWinners(adminId: string, drawWeekId: string) {
  return post("/admin/draws/publish", { admin_id: adminId, draw_week_id: drawWeekId });
}

export function settleDrawWeek(adminId: string, drawWeekId: string) {
  return post("/admin/draws/settle", { admin_id: adminId, draw_week_id: drawWeekId });
}

export function getWinners(adminId: string, drawWeekId: string) {
  return get(`/admin/data/draws/${encodeURIComponent(drawWeekId)}/winners?admin_id=${encodeURIComponent(adminId)}`);
}

export function flagWinner(adminId: string, winnerId: string, flagged: boolean) {
  return post("/admin/winners/flag", { admin_id: adminId, winner_id: winnerId, flagged });
}

export function getKycForPlayer(adminId: string, playerId: string) {
  return get(`/admin/data/players/${encodeURIComponent(playerId)}/kyc?admin_id=${encodeURIComponent(adminId)}`);
}

export function verifyKyc(adminId: string, playerId: string) {
  return post("/admin/kyc/verify", { admin_id: adminId, player_id: playerId });
}

export function getPayments(adminId: string, playerId: string) {
  return get(`/admin/data/players/${encodeURIComponent(playerId)}/payments?admin_id=${encodeURIComponent(adminId)}`);
}

export function createPaymentRecord(adminId: string, playerId: string, winnerId: string, drawWeekId: string, amountNaira: number, prizeType: string) {
  return post("/admin/mutations/payments/create", {
    admin_id: adminId,
    player_id: playerId,
    winner_id: winnerId,
    draw_week_id: drawWeekId,
    amount_naira: amountNaira,
    prize_type: prizeType,
  });
}

export function markPaymentPaid(adminId: string, paymentId: string, playerId: string) {
  return post("/admin/mutations/payments/mark-paid", {
    admin_id: adminId,
    payment_id: paymentId,
    player_id: playerId,
  });
}
