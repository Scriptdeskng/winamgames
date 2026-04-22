

## Add daily tab + change weekly metric to puzzles solved

Two coordinated changes to make the leaderboard a true skill ranking, separate from draw position.

### Backend — `src/utils/mission.functions.ts`

**1. Rewrite `getLeaderboard` to rank by puzzles solved this week**

Replace the current `winam_entry_ledger` aggregation with a `winam_game_sessions` aggregation scoped to the open draw week.

- Keep the same input shape (`{ limit, playerId? }`) and the same return shape, but rename the per-row `entries` field to `puzzles` for clarity. Also add it as `puzzles` in `currentPlayer`.
- Query: select `player_id, puzzles_solved` from `winam_game_sessions` where `draw_week_id = drawWeek.id` and `puzzles_solved > 0`, limit 2000 (covers a busy week).
- Sum `puzzles_solved` per player into a Map → sort desc → take top N.
- Same player lookup against `winam_players` for nickname / msisdn_last4 / rank_tier.
- Same `currentPlayer` fallback when the requesting player is outside the top N.
- Keep returning `weekStartWat`, `weekEndWat`, `drawExecutesAt`, `totalPlayers`.

**2. Add `getDailyLeaderboard`**

New `createServerFn({ method: "POST" })` next to `getLeaderboard`.

- Input: `{ limit?: number (default 50, max 50), playerId?: string }`.
- Compute today's WAT date server-side: `new Date(Date.now() + 60*60*1000)` shifted to UTC, format `YYYY-MM-DD`. (WAT = UTC+1, no DST.)
- Query: select `player_id, puzzles_solved` from `winam_game_sessions` where `session_date_wat = todayWat` and `puzzles_solved > 0`, limit 2000.
- Sum per player → sort desc → take top N (default 50).
- Look up player rows for top N. Compute `currentPlayer` if requesting `playerId` is outside top N and has played today.
- Return `{ success, players: [{ id, name, puzzles, rankTier }], totalPlayers, todayWat, currentPlayer }`.

### Frontend — `src/routes/_authed/leaderboard.tsx`

**1. Tabs**

Add the existing `Tabs` primitive (`@/components/ui/tabs`, already in the project) at the top of the page, just under `TopBar`:

- Tab 1 — "This week" (default active)
- Tab 2 — "Today"

Both tabs share the same `DrawCountdownCard` at the top? No — the countdown is week-specific. Keep the countdown card visible only on the "This week" tab. The "Today" tab gets a small day-strip header instead: "Today · resets at midnight WAT" with `totalPlayers` count.

**2. Data fetching**

- On mount, fetch both `getLeaderboard({ limit: 10, playerId })` and `getDailyLeaderboard({ limit: 50, playerId })` in parallel via `Promise.all`. Store in two state slots; show the spinner until both resolve.
- No refetch on tab switch (matches the rest of the app).

**3. Score label + display**

- Replace every "tickets" / `Ticket` icon usage on rows, podium pillars, and "Your standing" with "puzzles" and the `Puzzle` (lucide) icon.
- Remove the "How tickets work" footer link from the leaderboard (it belongs on `/entries`, not here, now that the leaderboard isn't ticket-based).
- Update the empty-state copy: "Be first on the board" → keep, but change the hint to "Solve puzzles to climb the ranks." CTA still goes to `/app`.

**4. "Today" tab content**

Reuse the same components — `Podium`, `ChaseList`, `YourStandingCard` — by parameterising them on the score field name + label. Cleanest approach: rename the existing `entries` prop chain to `score`, and pass a `scoreLabel` ("puzzles this week" / "puzzles today") down from the page.

- Top 50 layout: podium (top 3) + chase list (4 → up to 50, scrollable inside the rounded surface — cap visual height at ~`max-h-[60vh]` with `overflow-y-auto` on the chase list when it exceeds 7 rows).
- "Your standing" card on Today uses today's rank/puzzles instead of weekly.

**5. State shape**

```ts
type LeaderRow = { id: string; name: string; score: number; rankTier: string };
type WeeklyData = { players: LeaderRow[]; totalPlayers: number; weekStartWat, weekEndWat, drawExecutesAt; currentPlayer: (LeaderRow & { rank: number }) | null };
type DailyData  = { players: LeaderRow[]; totalPlayers: number; todayWat: string;          currentPlayer: (LeaderRow & { rank: number }) | null };
```

The page maps server `puzzles` → `score` once at the fetch boundary so the inner components stay generic.

### Files touched

- `src/utils/mission.functions.ts` — rewrite `getLeaderboard` to read from `winam_game_sessions`; add `getDailyLeaderboard`.
- `src/routes/_authed/leaderboard.tsx` — add `Tabs`, fetch both, parameterise inner components on `score`/`scoreLabel`, swap Ticket → Puzzle icon, drop the "How tickets work" footer.

### Out of scope

- No DB schema changes.
- No realtime; both leaderboards refresh on page load only.
- `getPlayerData` and `/app` draw card stay on `winam_entry_ledger` — entry totals are unchanged everywhere except the leaderboard.
- No changes to `/entries`, `/winners`, `/profile`, or any game route.

### Why this works

| Concern | Resolution |
|---|---|
| Leaderboard flattens at 50-cap | Ranks by puzzles solved (uncapped) — top players differentiate even at the entry cap |
| Daily resets need cron/tz logic | `session_date_wat` is already a WAT calendar date → midnight reset is automatic |
| Ticket count still matters to users | Still visible on `/app` `DrawHeroCard` and `/entries` — leaderboard is now purely skill ranking |
| Two queries on tab switch | Avoided — both fetch in parallel on mount |

