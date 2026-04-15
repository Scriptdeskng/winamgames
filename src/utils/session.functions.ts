import { createServerFn } from "@tanstack/react-start";
import { useSession, updateSession, clearSession } from "@tanstack/react-start/server";
import { z } from "zod";

interface SessionData {
  playerId: string;
  msisdnLast4: string;
  nickname: string | null;
}

function getSessionConfig() {
  return {
    password: process.env.SESSION_SECRET || "dev-fallback-secret-change-me-in-production-32chars",
    name: "winam-session",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  };
}

export const getCurrentPlayer = createServerFn({ method: "GET" })
  .handler(async () => {
    const session = await useSession<SessionData>(getSessionConfig());
    if (!session.data.playerId) return null;
    return {
      playerId: session.data.playerId,
      msisdnLast4: session.data.msisdnLast4,
      nickname: session.data.nickname,
    };
  });

export const setPlayerSession = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    playerId: z.string().uuid(),
    msisdnLast4: z.string().min(1).max(4),
    nickname: z.string().nullable(),
  }))
  .handler(async ({ data }) => {
    await updateSession<SessionData>(getSessionConfig(), {
      playerId: data.playerId,
      msisdnLast4: data.msisdnLast4,
      nickname: data.nickname,
    });
    return { success: true };
  });

export const clearPlayerSession = createServerFn({ method: "POST" })
  .handler(async () => {
    await clearSession(getSessionConfig());
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
