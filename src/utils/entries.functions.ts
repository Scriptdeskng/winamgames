import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { winamApiGet } from "@/lib/winam-api";

export type TicketSource = "game_session" | "mission" | "streak_bonus";

export interface PlayerTicket {
  ticketId: string;
  source: TicketSource;
  earnedAt: string; // ISO
}

export interface PlayerEntryWeek {
  drawWeekId: string;
  weekStartWat: string; // YYYY-MM-DD
  weekEndWat: string;
  drawExecutesAt: string;
  status: "open" | "locked" | "drawn" | "settled";
  totalTickets: number;
  tickets: PlayerTicket[];
}

// ── getPlayerEntries ──────────────────────────────────────────────────
// Returns the player's tickets grouped by draw week. Current open week first,
// then past weeks in reverse chronological order.
export const getPlayerEntries = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      playerId: z.string().uuid(),
    })
  )
  .handler(async ({ data }) => {
    return await winamApiGet<{
      success: boolean;
      weeks: PlayerEntryWeek[];
      weekCap: number;
      error?: string;
    }>(`/players/entries?player_id=${encodeURIComponent(data.playerId)}`);
  });
