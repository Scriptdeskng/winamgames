const SESSION_KEY = "winam-session";

export interface SessionData {
  playerId: string;
  msisdnLast4: string;
  nickname: string | null;
}

export function getSession(): SessionData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SessionData;
    if (!data.playerId) return null;
    return data;
  } catch {
    return null;
  }
}

export function setSession(data: SessionData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function updateSessionNickname(nickname: string): void {
  const session = getSession();
  if (!session) return;
  session.nickname = nickname;
  setSession(session);
}
