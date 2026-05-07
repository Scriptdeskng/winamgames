export type WinamSession = {
  playerId: string;
  nickname: string | null;
  msisdnLast4: string;
  msisdn?: string;
  subscriptionActive?: boolean;
  subscriptionRedirectUrl?: string | null;
};

const SESSION_KEY = "winam.session";

export function getSession(): WinamSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WinamSession;
  } catch {
    return null;
  }
}

export function setSession(session: WinamSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function updateSessionNickname(nickname: string) {
  const session = getSession();
  if (!session) return;
  setSession({ ...session, nickname });
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
