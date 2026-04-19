import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Derive a short, stable, human-friendly ticket ID from the ledger row id + index within that row.
// Uses the first 6 hex chars of the UUID (stripped of dashes) + a 2-digit index suffix.
function ticketIdFor(ledgerId: string, index: number): string {
  const compact = ledgerId.replace(/-/g, "").toUpperCase();
  const base = compact.slice(0, 6);
  const suffix = String(index + 1).padStart(2, "0");
  return `WG-${base}-${suffix}`;
}

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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Pull all ledger rows for the player (most recent first)
    const { data: ledger, error: ledgerErr } = await supabaseAdmin
      .from("winam_entry_ledger")
      .select("id, draw_week_id, source_type, entries_delta, created_at")
      .eq("player_id", data.playerId)
      .order("created_at", { ascending: false });

    if (ledgerErr) {
      return { success: false as const, error: "Could not load entries" };
    }

    const rows = ledger ?? [];
    const weekIds = Array.from(new Set(rows.map((r) => r.draw_week_id)));

    // Always include the currently open draw week even if the player has no tickets yet
    const { data: openWeek } = await supabaseAdmin
      .from("winam_draw_weeks")
      .select("id, week_start_wat, week_end_wat, draw_executes_at, status")
      .eq("status", "open")
      .limit(1)
      .maybeSingle();

    if (openWeek && !weekIds.includes(openWeek.id)) {
      weekIds.unshift(openWeek.id);
    }

    let weeks: Array<{
      id: string;
      week_start_wat: string;
      week_end_wat: string;
      draw_executes_at: string;
      status: "open" | "locked" | "drawn" | "settled";
    }> = [];

    if (weekIds.length > 0) {
      const { data: weekRows } = await supabaseAdmin
        .from("winam_draw_weeks")
        .select("id, week_start_wat, week_end_wat, draw_executes_at, status")
        .in("id", weekIds);
      weeks = (weekRows ?? []) as typeof weeks;
    }

    // Group ledger rows by draw_week_id, expanding entries_delta into individual tickets
    const grouped = new Map<string, PlayerTicket[]>();
    for (const row of rows) {
      const arr = grouped.get(row.draw_week_id) ?? [];
      const count = Math.max(0, row.entries_delta ?? 0);
      for (let i = 0; i < count; i++) {
        arr.push({
          ticketId: ticketIdFor(row.id, i),
          source: row.source_type as TicketSource,
          earnedAt: row.created_at,
        });
      }
      grouped.set(row.draw_week_id, arr);
    }

    const result: PlayerEntryWeek[] = weeks
      .map((w) => ({
        drawWeekId: w.id,
        weekStartWat: w.week_start_wat,
        weekEndWat: w.week_end_wat,
        drawExecutesAt: w.draw_executes_at,
        status: w.status,
        tickets: grouped.get(w.id) ?? [],
        totalTickets: (grouped.get(w.id) ?? []).length,
      }))
      // Open week first, then most recent week_start_wat
      .sort((a, b) => {
        if (a.status === "open" && b.status !== "open") return -1;
        if (b.status === "open" && a.status !== "open") return 1;
        return b.weekStartWat.localeCompare(a.weekStartWat);
      });

    return {
      success: true as const,
      weeks: result,
      weekCap: 50,
    };
  });
