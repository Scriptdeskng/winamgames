

## Simplify entry earning system end-to-end

Sweeping cleanup: drop hint-deduction logic, rename "cap" → "limit/this week" in user-facing copy, redesign results screen, add Profile explainer, scrub coins/XP from results.

### 1. Database — drop `net_puzzles`

New migration: `ALTER TABLE winam_game_sessions DROP COLUMN net_puzzles;` Types regenerate automatically.

### 2. Server — `src/utils/game.functions.ts` (`closeSession`)

- Remove `netPuzzles` variable and concept entirely.
- New formula: `baseEntries = Math.floor(data.puzzlesSolved / 5)`.
- Drop `net_puzzles` from the session UPDATE payload.
- Drop `netPuzzles` from the return shape.
- Keep `weekCap = 50` internally as a numeric ceiling — that's a server constant, not user copy.

### 3. Server — `src/utils/mission.server.ts`

- The `no_hints` aggregate query still legitimately reads `hints_used` for the "no hints" mission condition — that's mission gameplay logic, not entry calculation. Keep it.
- Remove `hintsUsed` from `SessionDelta` interface? It's only used for the no-hints check. Keep — semantically a mission signal, not entry math. (Spec says remove "hints_used deduction from any entry calculation" — mission detection is not entry deduction.)
- Internal var `weekCap` stays (server constant).

### 4. Results screen — `src/routes/_authed/results.tsx`

Already mostly aligned with spec from prior turns. Remaining gaps to fix:

- Add the **streak pill** (was removed in earlier turn — spec now explicitly requires it back). Conditional on `streak`:
  - `streak >= 14`: "🔥 Day {n} — earning +3 bonus entries per session"
  - `streak >= 7`: "+2 bonus"
  - `streak >= 3`: "+1 bonus"
  - `streak >= 1 && < 3`: "🔥 Day {n} — reach day 3 for bonus entries"
  - `streak === 0`: hide
- Re-add `streak` to search-param destructure (already in schema).
- Re-import `Flame` from lucide-react.
- Pill placement: between the unified card and the Play again button, centered.
- No "cap" wording anywhere — current "weekTotal / weekCap" rendering is fine since "weekCap" is just a variable name; the visible UI reads "12 / 50 entries this week" which matches spec. Good.

### 5. Home page — `src/routes/_authed/index.tsx`

- `DynamicTip` line 428 reads: `${weekCap - weekTotal} more entries to hit your weekly cap` → change to `${weekCap - weekTotal} more entries this week`.
- `DrawHeroCard` already says "entries this week" — fine.

### 6. Profile page — `src/routes/_authed/profile.tsx`

Add a permanent "How entries work" card at the bottom of the page (above nothing, below the My Entries / Winners links). Plain styling: `rounded-2xl bg-surface-1 border border-border p-5`, heading `text-sm font-semibold mb-3`, body in `text-sm text-muted-foreground space-y-3 leading-relaxed`. No icons. Exact copy from spec, broken into 4 paragraphs.

### 7. Hook — `src/components/games/useGameSession.ts`

No changes needed — already passes through what results needs. (`netPuzzles` is not referenced here.)

### 8. `src/utils/mission.functions.ts`

- `getPlayerData` returns `weekCap: 50`. Keep as-is — it's a numeric value, not user copy. UI components decide how to label it.

### Files touched (6 + 1 migration)

1. `supabase/migrations/<new>.sql` — drop `net_puzzles` column
2. `src/utils/game.functions.ts` — remove `netPuzzles`, simplify formula
3. `src/routes/_authed/results.tsx` — re-add streak pill + Flame import
4. `src/routes/_authed/index.tsx` — reword "weekly cap" tip
5. `src/routes/_authed/profile.tsx` — add "How entries work" card
6. (`src/utils/mission.server.ts` and `useGameSession.ts` — no changes)

### Out of scope

- `src/routes/_authed/entries.tsx` is hardcoded mock data ("12 / 50") — no "cap" wording present, leave alone unless you also want a real-data wire-up (separate task).
- `cap_overflow` column in `winam_entry_ledger` — internal field, not user-facing, stays.
- `mem://features/games` memory file — should be updated post-implementation to reflect the new formula.

