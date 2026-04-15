import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { z } from "zod";

// TODO: sign/encrypt cookie payload before go-live
const COOKIE_NAME = "winam-session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

interface SessionData {
  playerId: string;
  msisdnLast4: string;
  nickname: string | null;
}

function readSession(): SessionData | null {
  try {
    const raw = getCookie(COOKIE_NAME);
    if (!raw) return null;
    const decoded = atob(raw);
    const parsed = JSON.parse(decoded) as SessionData;
    if (!parsed.playerId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(data: SessionData) {
  const payload = btoa(JSON.stringify(data));
  setCookie(COOKIE_NAME, payload, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: MAX_AGE,
  });
}

export const getCurrentPlayer = createServerFn({ method: "GET" })
  .handler(async () => {
    const session = readSession();
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
    writeSession({
      playerId: data.playerId,
      msisdnLast4: data.msisdnLast4,
      nickname: data.nickname,
    });
    return { success: true };
  });

export const clearPlayerSession = createServerFn({ method: "POST" })
  .handler(async () => {
    deleteCookie(COOKIE_NAME, { path: "/" });
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
