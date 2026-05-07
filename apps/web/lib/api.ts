const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

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

export function apiBaseUrl() {
  return API_BASE;
}

export function sendOtp(msisdn: string) {
  return request<{ success: boolean; message?: string; msisdnLast4?: string; error?: string }>("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ msisdn }),
  });
}

export function verifyOtp(msisdn: string, otp: string) {
  return request<{
    success: boolean;
    message?: string;
    playerId?: string;
    msisdnLast4?: string;
    msisdn?: string;
    needsOnboarding?: boolean;
    hasActiveSubscription?: boolean;
    activeSubscription?: any;
    redirectUrl?: string | null;
    data?: any;
    error?: string;
  }>("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ msisdn, otp }),
  });
}

export function setNickname(playerId: string, nickname: string) {
  return request<{ success: boolean; error?: string }>("/auth/nickname", {
    method: "POST",
    body: JSON.stringify({ playerId, nickname }),
  });
}

export function renewSubscription(player_id: string, plan: "daily" | "weekly") {
  return request<{ success: boolean; error?: string }>("/auth/renew", {
    method: "POST",
    body: JSON.stringify({ player_id, plan }),
  });
}

export function getDashboard(playerId: string) {
  return request<any>(`/players/dashboard?player_id=${encodeURIComponent(playerId)}`);
}

export function getSubscriptionStatus(playerId: string) {
  return request<any>(`/players/subscription?player_id=${encodeURIComponent(playerId)}`);
}

export function getActiveMissions(playerId: string) {
  return request<any>(`/missions/active?player_id=${encodeURIComponent(playerId)}`);
}

export function getActiveBanners() {
  return request<any>("/banners/active");
}

export function getWinnerStatus(playerId: string) {
  return request<any>(`/winners/me?player_id=${encodeURIComponent(playerId)}`);
}

export function getLeaderboard(playerId?: string, limit = 10) {
  const playerQuery = playerId ? `&player_id=${encodeURIComponent(playerId)}` : "";
  return request<any>(`/leaderboards/weekly?limit=${encodeURIComponent(String(limit))}${playerQuery}`);
}

export function getDailyLeaderboard(playerId?: string, limit = 50) {
  const playerQuery = playerId ? `&player_id=${encodeURIComponent(playerId)}` : "";
  return request<any>(`/leaderboards/daily?limit=${encodeURIComponent(String(limit))}${playerQuery}`);
}

export function getPlayerEntries(playerId: string) {
  return request<any>(`/players/entries?player_id=${encodeURIComponent(playerId)}`);
}

export function getPublishedWinners() {
  return request<any>("/winners/published");
}

export function getMyWinnerStatus(playerId: string) {
  return request<any>(`/winners/me?player_id=${encodeURIComponent(playerId)}`);
}

export function getKycStatus(playerId: string) {
  return request<any>(`/kyc/status?player_id=${encodeURIComponent(playerId)}`);
}

export function submitKycIdentity(payload: {
  playerId: string;
  firstName: string;
  lastName: string;
  dob: string;
  idType: string;
  idNumber: string;
}) {
  return request<any>("/kyc/identity", {
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

export function submitKycBankDetails(payload: {
  playerId: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName?: string | null;
}) {
  return request<any>("/kyc/bank", {
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

export function startGameSession(playerId: string, gameType: "checkmate" | "wisdomdrop") {
  return request<any>("/sessions/start", {
    method: "POST",
    body: JSON.stringify({ player_id: playerId, game_type: gameType }),
  });
}

export function submitGameMove(payload: {
  sessionId: string;
  puzzleId: string;
  answer: string;
  timeMs: number;
  nextPuzzleId?: string | null;
}) {
  return request<any>("/sessions/move", {
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

export function useGameHint(payload: {
  playerId: string;
  puzzleId: string;
  tier: 1 | 2 | 3;
}) {
  return request<any>("/sessions/hint", {
    method: "POST",
    body: JSON.stringify({
      player_id: payload.playerId,
      puzzle_id: payload.puzzleId,
      tier: payload.tier,
    }),
  });
}

export function closeGameSession(payload: {
  playerId: string;
  sessionId: string;
  gameType: "checkmate" | "wisdomdrop";
  durationSeconds: number;
  puzzlesSolved: number;
  hintsUsed: number;
}) {
  return request<any>("/sessions/close", {
    method: "POST",
    body: JSON.stringify({
      player_id: payload.playerId,
      session_id: payload.sessionId,
      game_type: payload.gameType,
      duration_seconds: payload.durationSeconds,
      puzzles_solved: payload.puzzlesSolved,
      hints_used: payload.hintsUsed,
    }),
  });
}
