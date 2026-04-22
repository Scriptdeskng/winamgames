

## Three follow-on tasks: winners empty state, terminology audit, server-side lock enforcement

### 1. Winners page empty state — `src/routes/_authed/winners.tsx`

Hard-gate via `HAS_DRAWS = false` constant (no real draws yet — mock data stays in file for future wiring). When false:
- Hide hero card and past draws list entirely.
- Render centered empty block:
  - Large `Trophy` icon (lucide), primary tint
  - Headline: **"No draws yet"**
  - Subtext: **"The first draw happens this Sunday at 20:00 WAT. Play now to earn your entries."**
  - Dynamic line: `Next draw: Sunday {d MMM} at 20:00 WAT` — derived from `getNextEntriesLockWAT()` imported from `@/lib/draw-state` (use the date portion, append "20:00 WAT" literal)
  - CTA: **"Start playing"** → `Link to="/app"`, primary style

`TopBar` chrome unchanged.

### 2. Terminology + route audit

Replace user-facing "tickets" → "entries" across these files (JSX text, headers, meta, labels — internal identifiers like `TicketSource`, `ticketId`, `Ticket` icon stay as-is):

- `src/routes/_authed/entries.tsx` — page title, meta, TopBar title, all body copy ("View tickets", "No tickets yet", `n === 1 ? "ticket" : "tickets"`, "No tickets earned this week")
- `src/routes/_authed/profile.tsx` — "My Tickets" link → "My Entries"; coins explanation; accordion title + body (all "ticket"/"tickets" → "entry"/"entries"); WeeklyEntriesCard count; StreakTile bonus copy
- `src/routes/_authed/results.tsx` — streak pills, nudge copy, hero `entry/entries` ternary, `"No tickets this time"`, `"Tickets earned this week"` section header
- `src/routes/_authed/app.tsx` — DrawHeroCard "tickets this week" both branches → "entries this week"; "View my tickets" → "View my entries" both occurrences; rename helper `pluralizeTickets` → `pluralizeEntries` and update its call site in MissionRow
- `src/routes/_authed/checkmate.tsx` — meta description; start screen "5 tickets per round" → "5 entries per round"
- `src/routes/_authed/wisdomdrop.tsx` — same as checkmate
- `src/routes/renew.tsx` — "Keep playing & earning tickets" + chip "Tickets" → "Entries"
- `src/routes/index.tsx` — landing copy: "draw ticket" → "draw entry", "More tickets" → "More entries"
- `src/routes/__root.tsx` — three meta description tags: "earn draw tickets" → "earn draw entries"
- `src/components/layout/MenuSheet.tsx` — menu label "My Tickets" → "My Entries"; verify Home item targets `/app` (already correct per current code)

Leaderboard score label already says "puzzles" — confirmed, no change. No "How tickets work" links exist outside the profile accordion (canonical) — nothing to remove.

### 3. Server-side entry lock enforcement — `src/utils/game.functions.ts` (`closeSession`)

Replace the existing TODO comment with real enforcement. Insert between session lookup and the entry calculation block:

```ts
// Server-side entry lock enforcement
// Sessions completed between Sunday 19:00–20:00 WAT award coins only — no entries
const nowWAT = new Date(Date.now() + 60 * 60 * 1000);
const isLockWindow =
  nowWAT.getUTCDay() === 0 &&
  nowWAT.getUTCHours() >= 19 &&
  nowWAT.getUTCHours() < 20;
```

Reorder so `weekEntries` ledger query and `wisdomAccuracy` computation sit above the branch (both branches need them).

When `isLockWindow === true`, branch into:
- `coinsFromGameplay = data.puzzlesSolved * 5`, `xpGained = data.puzzlesSolved * 10`
- Update `winam_game_sessions`: puzzles_solved, hints_used, `entries_awarded: 0`, `coins_awarded: coinsFromGameplay`, duration, wisdom_accuracy
- Compute `newStreak` (same-day / +1 / reset), prefixed with required comment:
  ```ts
  // NOTE: streak/tier logic duplicated from performance branch — keep in sync if either changes
  ```
- Compute `newTier` from `player.xp_total + xpGained`, prefixed with the same comment:
  ```ts
  // NOTE: streak/tier logic duplicated from performance branch — keep in sync if either changes
  ```
- Update `winam_players`: xp_total, coin_balance + coinsFromGameplay, current_streak, last_session_date, rank_tier
- Record served wisdomdrop puzzles to `winam_puzzle_history` (same loop as zero-perf branch)
- **Skip** `winam_entry_ledger` insert
- **Skip** `evaluatePendingMissions`
- Return:
  ```ts
  {
    success: true as const,
    entries: 0, sessionEntries: 0, baseEntries: 0,
    streakBonus: 0, missionEntries: 0,
    coins: coinsFromGameplay, xp: xpGained,
    streak: newStreak,
    weekTotal: weekSoFar, weekCap, overflow: 0,
    rankTier: newTier, previousRank: player.rank_tier,
    completedMissions: [],
  }
  ```

Remove the original TODO comment block — replaced by working enforcement. Existing performance branch unchanged.

### Out of scope

- No DB or schema changes
- Internal code identifiers (`TicketSource`, `ticketId`, `FlatTicketList`, `Ticket` lucide icon, `winam_*` columns) stay as-is
- Mock `DRAW_WEEKS` array stays for future wiring; only `HAS_DRAWS` gate controls render
- No new dependencies

### Files touched

- `src/routes/_authed/winners.tsx` — empty state + dynamic next-draw date
- `src/utils/game.functions.ts` — lock window enforcement + duplication NOTE comments, remove TODO
- `src/routes/_authed/entries.tsx`, `profile.tsx`, `results.tsx`, `app.tsx`, `checkmate.tsx`, `wisdomdrop.tsx`
- `src/routes/renew.tsx`, `index.tsx`, `__root.tsx`
- `src/components/layout/MenuSheet.tsx`

