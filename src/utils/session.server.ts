/**
 * Pure server-only cookie helpers for session management.
 * These are NOT createServerFn — they are plain functions
 * called from server routes that return real HTTP responses.
 */

const COOKIE_NAME = "winam-session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionData {
  playerId: string;
  msisdnLast4: string;
  nickname: string | null;
}

/** Parse a Cookie header string into key/value pairs */
function parseCookieHeader(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  for (const pair of cookieHeader.split(";")) {
    const eqIdx = pair.indexOf("=");
    if (eqIdx === -1) continue;
    const key = pair.substring(0, eqIdx).trim();
    const value = pair.substring(eqIdx + 1).trim();
    cookies[key] = value;
  }
  return cookies;
}

/** Read session from a raw Request object */
export function readSession(request: Request): SessionData | null {
  try {
    const cookieHeader = request.headers.get("cookie");
    const cookies = parseCookieHeader(cookieHeader);
    const raw = cookies[COOKIE_NAME];
    if (!raw) {
      console.log("[session] No session cookie found");
      return null;
    }
    const decoded = atob(decodeURIComponent(raw));
    const parsed = JSON.parse(decoded) as SessionData;
    if (!parsed.playerId) {
      console.log("[session] Session cookie missing playerId");
      return null;
    }
    console.log("[session] Read session for player:", parsed.playerId);
    return parsed;
  } catch (err) {
    console.error("[session] Failed to read session:", err);
    return null;
  }
}

/** Build a Set-Cookie header string that sets the session */
export function buildSessionCookie(data: SessionData): string {
  const payload = encodeURIComponent(btoa(JSON.stringify(data)));
  return `${COOKIE_NAME}=${payload}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

/** Build a Set-Cookie header string that clears the session */
export function buildClearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
