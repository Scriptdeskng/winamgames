## Show all settled draw weeks on the public Winners screen

Currently `getPublishedWinners()` returns only the single week stored in `winners_published_week_id` config, and `winners.tsx` renders one collapsible card. Switch to a list of all settled weeks with winners, ordered most-recent first.

### 1. `src/utils/admin.functions.ts` — rewrite `getPublishedWinners()`

Replace the single-week query (lines 1002–1058) with an aggregate that returns `{ weeks: Array<{ week, winners[] }> }`:

- Query `winam_draw_weeks` where `status = 'settled'`, ordered by `week_start_wat desc`.
- Fetch all non-flagged winners across those week IDs in one `.in("draw_week_id", weekIds)` query (more efficient than per-week round-trips). Note: cannot use PostgREST embed `winam_players(nickname)` because there is no FK between `winam_winners` and `winam_players` in the schema — keep the existing two-step lookup pattern.
- Resolve player nicknames + `msisdn_last4` via a single `.in("id", playerIds)` query against `winam_players`.
- Group winners by `draw_week_id`, drop weeks with zero winners, return `{ weeks: [...] }`.
- Return shape per winner mirrors today's: `{ id, position, prizeType, prizeAmount, ticketId, nickname, msisdnLast4 }`. Keeps `ticketId` and `msisdnLast4` so the existing `WinnersList` rendering (ticket hash chip, masked phone fallback) still works.
- Empty state shape: `{ weeks: [] }`.

### 2. `src/routes/_authed/winners.tsx` — render a list of weeks

- Loader still calls `getPublishedWinners()`; data shape changes to `{ weeks }`.
- Empty state: when `weeks.length === 0`, keep the existing "No draws yet" empty-state block unchanged.
- Populated state:
  - Keep the hero card ("Real people. Real wins.") at the top, unchanged.
  - Map `weeks` into a stacked list of `<WinnersList>` collapsibles — one per week, same component and styling as today.
  - `weekLabel` derived per-week via the existing `formatWeekLabel(week_start_wat, week_end_wat)`.
  - First card defaults open (`defaultOpen={i === 0}`), the rest collapsed.
- Nickname masking: the user asked for "first 2 chars + ***" masking on the nickname. The current `WinnersList` displays `w.nickname ?? maskPhone(w.msisdnLast4)` (i.e., shows the full nickname, falls back to `***1234`). Update the display to also mask nicknames: `nickname ? nickname.slice(0, 2) + "***" : maskPhone(msisdnLast4)` in both render sites inside `WinnersList` (cash row and tier sub-list).

### 3. Unused code cleanup

- The `winners_published_week_id` config key is no longer read here. Leave the admin publish action that writes it untouched (out of scope) — it just becomes unused for the public screen; that's acceptable.
- Old return fields `weekId` / `week` on `getPublishedWinners` are removed; only the Winners route consumes this function (verified by usage), so no other callsite to update.

### Verification

Build runs automatically after edits.