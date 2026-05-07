export type AdminSession = {
  adminId: string;
  email: string;
  role: string;
};

const SESSION_KEY = "winam_admin_session";

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
