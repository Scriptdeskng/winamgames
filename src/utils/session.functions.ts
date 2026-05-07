import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { winamApiGet } from "@/lib/winam-api";

export const getSubscriptionStatus = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    playerId: z.string().uuid(),
  }))
  .handler(async ({ data }) => {
    return await winamApiGet<{ active: boolean; status?: string; validUntil?: string | null; graceUntil?: string | null; plan?: string | null }>(
      `/players/subscription?player_id=${encodeURIComponent(data.playerId)}`
    );
  });
