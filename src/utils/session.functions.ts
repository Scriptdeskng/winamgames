/**
 * Server functions for reading session state.
 * Writing/clearing sessions is now done via real server routes
 * (/api/auth-complete, /api/auth-logout, /api/auth-session-update).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { readSession } from "@/utils/session.server";
import { getRequest } from "@tanstack/react-start/server";

export const getCurrentPlayer = createServerFn({ method: "GET" })
  .handler(async () => {
    const request = getRequest();
    const session = readSession(request);
    if (!session) return null;
    return {
      playerId: session.playerId,
      msisdnLast4: session.msisdnLast4,
      nickname: session.nickname,
    };
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
