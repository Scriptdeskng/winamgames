

## Fix leaderboard draw countdown

**Root cause:** `DrawCountdownCard` reads `drawExecutesAt` from `winam_draw_weeks`, but the only row in that table is for the week of Apr 13–19 (past). Target is in the past → `Math.max(0, target - now)` clamps to 0 → countdown displays `0d 0h 0m`.

The home page `DrawHeroCard` doesn't hit this — it uses `getNextEntriesLockWAT()` from `src/lib/draw-state.ts`, computed client-side from the current date, so it always points at the next Sunday.

### Fix — `src/routes/_authed/leaderboard.tsx`

Switch `DrawCountdownCard` to use the same client-side helper, matching the home page exactly:

1. Import `getNextEntriesLockWAT` from `@/lib/draw-state`.
2. Drop the `drawExecutesAt` prop from `DrawCountdownCard` (no longer needed). Keep `weekStartWat` / `weekEndWat` for the date-range label and progress bar.
3. Replace the `target` calculation:
   ```ts
   const target = React.useMemo(() => getNextEntriesLockWAT().getTime(), []);
   ```
4. Update the right-column label from `"ends Sun 8pm"` → `"locks Sun 7pm WAT"` to reflect the lock time the countdown is now targeting (consistent with the home card's "entries lock" framing).
5. Update the call site (line 137–142) to drop the `drawExecutesAt` prop.

For the progress bar (`pct`), keep the existing `weekStartWat`/`weekEndWat` logic — it correctly visualises week elapsed when those are present. When the DB row is stale (week already ended), `pct` will sit at 100% which is acceptable until the rollover lands; the countdown itself will be correct.

### Out of scope (flagged for follow-up)

- **Stale `winam_draw_weeks` rollover** — only one row exists, dated Apr 13–19. A new row should be inserted at week start (or via cron / on-read). This is a separate backend task; not fixing here so the countdown fix lands cleanly. Once rollover ships, `weekStartWat`/`weekEndWat` will refresh and the progress bar will tick correctly again.
- **Header label `"ends Sun 8pm"`** — replaced with the more accurate lock-time label as part of this fix; if you'd rather keep "ends Sun 8pm" (draw time, not lock time), say so and I'll only swap the target calculation.

### Files touched

- `src/routes/_authed/leaderboard.tsx` — import shared helper, swap target source, update label, drop unused prop

No DB changes. No new dependencies.

