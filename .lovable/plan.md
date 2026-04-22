

## Leaderboard — audit + redesign

### Audit of current page

**Keep:**
- Top bar with back button — consistent with other sub-pages.
- Tab-style filter (Today / All Time) — concept is good but visuals need a refresh.
- Per-row "rank, avatar, name, entries" structure — correct information density for mobile (390px).

**Drop / fix:**
1. **Mock data** — the page uses a hardcoded `mockLeaderboard` array. The real `getLeaderboard` server function already exists in `src/utils/mission.functions.ts` and returns `{ id, name, entries, rankTier }` for the open draw week. Wire it up.
2. **"Today" / "All Time" tabs** — neither is actually backed by data. The backend only exposes the current open draw week. Replace with a single, honest header: **"This Week"** + the WAT date range (matches `entries.tsx` and `winners.tsx` conventions).
3. **`TrendIcon` (up/down/same)** — purely fictional, no data source. Drop.
4. **`Trophy` import** — imported but unused. Drop.
5. **Avatar showing only the first letter on a flat circle** — flavorless. Replace with the player's `RankBadge` icon (Sprout/Swords/Trophy/Crown by tier) using the existing `RANK_CONFIG` colors. Reuses the design system already shipped on `/profile`.
6. **All ranks rendered identically** — top 3 deserve elevation. Add a podium treatment (gold/silver/bronze) for ranks 1–3.
7. **No "you" indicator** — players can't find themselves. Highlight the current player's row and pin it to the bottom if they're outside the top 10.
8. **No loading or empty state** — fetch fails silently today. Add a spinner during fetch and a friendly empty state ("Be the first to earn a ticket this week").
9. **Entries shown without context** — number floats with no unit. Suffix with a small "tickets" label, and add a top "prize pool" hero strip pointing to `/winners` for context (consistent with the `/winners` "Real people. Real wins." card pattern).

### New page structure (top to bottom)

```text
TopBar — back to /app, title "Leaderboard"

Hero strip (compact)
  ┌───────────────────────────────────────────┐
  │ 🏆  This Week                             │
  │     Apr 13 – 19 · ends Sun 8pm WAT        │
  │     Top players competing for cash prizes │
  └───────────────────────────────────────────┘

Podium (top 3, when ≥3 players exist)
  ┌─────────┬─────────┬─────────┐
  │   2nd   │   1st   │   3rd   │
  │ silver  │  gold   │ bronze  │   raised middle, larger 1st avatar
  │ avatar  │ avatar  │ avatar  │
  │ name    │ name    │ name    │
  │ 42 🎟   │ 48 🎟   │ 38 🎟   │
  └─────────┴─────────┴─────────┘

Ranks 4–10
  rounded list — rank · rank-tier icon · name · entries
  current player row highlighted with primary border + subtle glow

Your row (sticky, only if player not in visible list)
  ┌───────────────────────────────────────────┐
  │ #23  [tier]  You · CaptArice          5  │
  └───────────────────────────────────────────┘

Footer link → "How tickets work" → /entries
```

### Visual design (matches Refined Arena tokens)

- **Cards**: `rounded-2xl bg-surface-1 border border-border shadow-card` (matches `entries.tsx`/`winners.tsx`).
- **Podium 1st**: `bg-coin/10` with `ring-1 ring-coin/30` and `shadow-glow`-equivalent gold tint; crown icon overlay.
- **Podium 2nd**: neutral silver tint `oklch(0.75 0.01 250)/15`.
- **Podium 3rd**: bronze `oklch(0.55 0.05 55)/15` — same palette already used in `winners.tsx` `POSITION_STYLES`.
- **Rank tier icon** per row: pull `RANK_CONFIG[rankTier].icon` + `color` + `bgColor` from `src/components/profile/RankBadge.tsx` so a Champion's row visibly differs from a Starter's.
- **Current player row**: `border-primary/40 bg-primary/5` plus a tiny "YOU" pill on the right.
- **Numbers**: `tabular-nums` with a small `Ticket` icon next to the count.
- **Animations**: `RevealOnScroll` is overkill here; use a simple fade-in on the list (existing `tw-animate-css` `animate-in fade-in-0`).

### Data wiring

- Call `getLeaderboard({ data: { limit: 10 } })` on mount (same pattern as `entries.tsx` — `useEffect` + `useState`, no TanStack Query — staying consistent with neighbouring routes).
- Pull current player's `playerId` and `nickname` from `getSession()` to highlight the "you" row.
- If the current player is not in the returned top 10, fire a second small query — extend `getLeaderboard` to optionally return the requesting player's rank/entries when `playerId` is supplied (computed server-side from `winam_entry_ledger` for the open week). This keeps the "your position" feature accurate without overfetching.
- Pass the open `winam_draw_weeks.week_start_wat` / `week_end_wat` back from `getLeaderboard` so the hero strip can show the correct range. (Currently the function only returns `{ players: [] }`.)
- Empty state: when `players.length === 0`, render the empty card with a "Play now" CTA linking to `/app`.
- Loading state: same spinner pattern as `entries.tsx` (centered emerald ring).

### Files touched

- `src/routes/_authed/leaderboard.tsx` — rewrite using real data, podium, rank-tier icons, current-player highlight, loading/empty states.
- `src/utils/mission.functions.ts` — extend `getLeaderboard` to (a) accept optional `playerId`, (b) return `weekStartWat` / `weekEndWat`, (c) return `currentPlayer: { rank, entries } | null` when `playerId` is provided and they're outside the top N.

### Out of scope

- No DB schema changes.
- No changes to `/winners`, `/entries`, `/profile`, or any game route.
- No new `Today / All Time` filter — backend has no historical leaderboard data to support it; revisit when past-weeks aggregation is added.
- No realtime subscription — leaderboard updates on page load only (matches the rest of the app).

