

## Seed current draw week + auto-rollover (with addenda)

### 1. Database operations (via insert tool)

Two statements run together:

```sql
-- Close out stale row
UPDATE winam_draw_weeks
SET status = 'settled'
WHERE week_end_wat = '2026-04-19';

-- Seed current week with correct spec times (19:00 WAT lock, 20:00 WAT draw)
INSERT INTO winam_draw_weeks (
  week_start_wat, week_end_wat,
  entry_lock_at, draw_executes_at,
  status, total_entries
) VALUES (
  '2026-04-20', '2026-04-26',
  '2026-04-26 18:00:00+00',
  '2026-04-26 19:00:00+00',
  'open', 0
);
```

### 2. Add `ensureCurrentDrawWeek` helper in `src/utils/game.functions.ts`

Insert near top of file (above `startSession`). Lazy-imports `supabaseAdmin` to match existing server-fn pattern.

```ts
async function ensureCurrentDrawWeek(): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const nowWAT = new Date(Date.now() + 60 * 60 * 1000);
  const todayWAT = nowWAT.toISOString().split("T")[0];

  // TODO (schema): add unique index on winam_draw_weeks(week_start_wat)
  // to harden rollover against concurrent insert races — Phase 1 CTO task
  const { data: existing } = await supabaseAdmin
    .from("winam_draw_weeks")
    .select("id")
    .eq("status", "open")
    .gte("week_end_wat", todayWAT)
    .order("week_start_wat", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  // Compute current WAT week (Mon–Sun)
  const day = nowWAT.getUTCDay();           // 0 = Sunday
  const daysToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(nowWAT);
  monday.setUTCDate(nowWAT.getUTCDate() + daysToMonday);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  const weekStart = monday.toISOString().split("T")[0];
  const weekEnd   = sunday.toISOString().split("T")[0];

  const { data: newWeek, error } = await supabaseAdmin
    .from("winam_draw_weeks")
    .insert({
      week_start_wat: weekStart,
      week_end_wat:   weekEnd,
      entry_lock_at:    `${weekEnd}T18:00:00+00:00`, // 19:00 WAT
      draw_executes_at: `${weekEnd}T19:00:00+00:00`, // 20:00 WAT
      status: "open",
      total_entries: 0,
    })
    .select("id")
    .single();

  if (error || !newWeek) {
    console.error("ensureCurrentDrawWeek insert failed:", error);
    return null;
  }
  return newWeek.id;
}
```

### 3. Wire into `startSession` (lines 16–26)

Replace the current `winam_draw_weeks` lookup block:

```ts
const drawWeekId = await ensureCurrentDrawWeek();
if (!drawWeekId) {
  return { success: false as const, error: "No active draw week" };
}
```

Update the session insert (line 40) `draw_week_id: drawWeek.id` → `draw_week_id: drawWeekId`. Remove the now-unused `drawWeek`/`dwErr` variables.

### Why this is safe

- `closeSession` reads `draw_week_id` straight off the session row — no change needed.
- Leaderboard / Entries pages query `winam_draw_weeks` directly; once the new row exists they pick up correct `week_start_wat`/`week_end_wat` for date labels.
- Rollover triggers lazily on the first session of a new week — no cron required.
- SELECT uses `order by week_start_wat desc limit 1` so subsequent calls converge on one row even if a brief race produces duplicates.

### Files touched

- `src/utils/game.functions.ts` — add `ensureCurrentDrawWeek` (with TODO comment), replace draw-week lookup in `startSession`
- Two SQL statements via the insert tool: UPDATE stale row to `settled` + INSERT current week

No schema changes. No new dependencies.

