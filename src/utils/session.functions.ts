import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";

// TODO: sign/encrypt cookie payload before go-live
const COOKIE_NAME = "winam-session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

interface SessionData {
  playerId: string;
  msisdnLast4: string;
  nickname: string | null;
}

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

function readSessionFromRequest(): SessionData | null {
  try {
    const request = getRequest();
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

function writeSessionToResponse(data: SessionData) {
  const payload = encodeURIComponent(btoa(JSON.stringify(data)));
  const cookie = `${COOKIE_NAME}=${payload}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}`;
  setResponseHeader("Set-Cookie", cookie);
  console.log("[session] Wrote session for player:", data.playerId);
}

function clearSessionFromResponse() {
  const cookie = `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  setResponseHeader("Set-Cookie", cookie);
  console.log("[session] Cleared session cookie");
}

export const getCurrentPlayer = createServerFn({ method: "GET" })
  .handler(async () => {
    const session = readSessionFromRequest();
    if (!session) return null;
    return {
      playerId: session.playerId,
      msisdnLast4: session.msisdnLast4,
      nickname: session.nickname,
    };
  });

export const setPlayerSession = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    playerId: z.string().uuid(),
    msisdnLast4: z.string().min(1).max(4),
    nickname: z.string().nullable(),
  }))
  .handler(async ({ data }) => {
    writeSessionToResponse({
      playerId: data.playerId,
      msisdnLast4: data.msisdnLast4,
      nickname: data.nickname,
    });
    return { success: true };
  });

export const clearPlayerSession = createServerFn({ method: "POST" })
  .handler(async () => {
    clearSessionFromResponse();
    return { success: true };
  });

export const getSubscriptionStatus = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    playerId: z.string().uuid(),
  }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: sub } = await supabaseAdmin
      .from("winam_subscriptions")
      .select("status, valid_until, grace_until")
      .eq("player_id", data.playerId)
      .in("status", ["active", "grace"])
      .order("valid_from", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) return { active: false };

    const now = new Date();
    if (sub.status === "active") {
      if (sub.valid_until && new Date(sub.valid_until) < now) {
        return { active: false };
      }
      return { active: true };
    }
    if (sub.status === "grace") {
      if (sub.grace_until && new Date(sub.grace_until) < now) {
        return { active: false };
      }
      return { active: true };
    }

    return { active: false };
  });
