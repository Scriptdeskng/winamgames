import type { Player } from "@/types";

const SESSION_KEY = "winam_session";

export interface Session {
  player: Player;
  expires_at: string;
}

export const sessionStore = {
  get: (): Session | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.sessionStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  },

  set: (session: Session): void => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // fail silently
    }
  },

  clear: (): void => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // fail silently
    }
  },

  isValid: (): boolean => {
    const session = sessionStore.get();
    if (!session) return false;
    return new Date(session.expires_at) > new Date();
  },

  getPlayer: (): Player | null => {
    const session = sessionStore.get();
    return session?.player ?? null;
  },
};
