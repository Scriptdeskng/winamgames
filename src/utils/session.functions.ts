import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
