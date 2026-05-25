export interface AdminSession {
  adminId: string;
  email: string;
  expires_at: string;
}

const ADMIN_SESSION_KEY = "winam_admin_session";

export function setAdminSession(session: AdminSession): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  } catch {
    // fail silently
  }
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // fail silently
  }
}
