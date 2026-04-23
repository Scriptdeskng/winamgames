

## Migrate CheckMate puzzles from hardcoded TS file to `winam_checkmate_puzzles` table

All edits land in **`src/utils/game.functions.ts`**. No client, schema, or dependency changes.

### 1. `startSession` — checkmate branch (replace lines 101–106)

Drop the `CHECKMATE_PUZZLES` shuffle and replace with rank-aware DB selection mirroring the WisdomDrop pattern:

- Fetch `rank_tier` from `winam_players`.
- Apply numeric difficulty mix (1/2/3) keyed by rank:
  ```ts
  const RANK_DIFFICULTY_MIX: Record<string, Record<1|2|3, number>> = {
    starter:  { 1: 7, 2: 2, 3: 1 },
    recruit:  { 1: 5, 2: 4, 3: 1 },
    sergeant: { 1: 3, 2: 5, 3: 2 },
    veteran:  { 1: 1, 2: 5, 3: 4 },
    champion: { 1: 1, 2: 5, 3: 4 },
    icon:     { 1: 1, 2: 5, 3: 4 },
    legend:   { 1: 1, 2: 5, 3: 4 },
    immortal: { 1: 1, 2: 5, 3: 4 },
  };
  ```
- Fetch seen IDs from `winam_puzzle_history` filtered to `puzzle_id LIKE 'lc_%'` (so WisdomDrop history doesn't pollute the checkmate filter, and vice versa).
- Query `winam_checkmate_puzzles` with `select('id, difficulty')`, `not('id','in',(seen…))` if any.
- If unseen pool < 15: delete only the `lc_`-prefixed history rows for this player (`like('puzzle_id','lc_%')`), then re-query the full pool.
- Bucket by integer `difficulty` (1/2/3), shuffle each, then take with the same shortfall cascade WisdomDrop uses: advanced (3) → intermediate (2) → beginner (1) → back-fill upward if beginner is short.
- Pick 10 IDs, then re-query `winam_checkmate_puzzles` for `id, fen, theme` for those IDs (preserving picked order via a Map).
- Map to `puzzleList`:
  ```ts
  { id, clientData: { fen, theme } }
  ```
  This adds `theme` to the client payload (`firstPuzzle` already spreads `clientData` into the response, so `theme` flows through to `checkmate.tsx`'s `GOAL_BY_THEME` lookup with no client change).
- No adaptive accuracy nudge for checkmate (chess sessions don't track `wisdom_accuracy`); rank mix alone drives difficulty.

### 2. `submitMove` — checkmate branch (lines 354, 357, 373–384, 425–427)

- Remove the `CHECKMATE_PUZZLES` import.
- Update prefix detection to:
  ```ts
  const isCheckmate = data.puzzleId.startsWith("lc_") || data.puzzleId.startsWith("cm-");
  ```
- Replace the in-memory lookup with:
  ```ts
  const { data: puzzle } = await supabaseAdmin
    .from("winam_checkmate_puzzles")
    .select("fen, solution_move")
    .eq("id", data.puzzleId)
    .maybeSingle();
  ```
  Use `puzzle.fen` for the `Chess` instance and compare `${from}${to}` against `puzzle.solution_move`.
- For `nextPuzzle` in the checkmate branch: query `winam_checkmate_puzzles` for `id, fen, theme` by `data.nextPuzzleId` and return `{ puzzleId, fen, theme }`.

### 3. `useHint` — checkmate branch (lines 466, 489, 492–501)

- Remove the `CHECKMATE_PUZZLES` import.
- Update prefix detection (same `lc_` || `cm-` rule).
- Replace lookup with:
  ```ts
  const { data: puzzle } = await supabaseAdmin
    .from("winam_checkmate_puzzles")
    .select("hint_piece, hint_destination, solution_move")
    .eq("id", data.puzzleId)
    .maybeSingle();
  ```
- Tier mapping: tier 1 → `puzzle.hint_piece`, tier 2 → `puzzle.hint_destination`, tier 3 → `solution_move.slice(0,2)` / `slice(2,4)`. Guard against null `hint_piece`/`hint_destination` by falling back to empty string so the response shape stays stable.

### 4. `closeSession` — puzzle history gate (lines 655–663, 702–710, 815–823)

Remove the `session.game_type === "wisdomdrop"` condition from all three history-write blocks (lock-window branch, zero-performance branch, performance branch). New gate is just:
```ts
if (data.servedPuzzleIds && data.servedPuzzleIds.length > 0) { … }
```
This makes both checkmate and wisdomdrop sessions populate `winam_puzzle_history`, which is required for the "exclude seen" query in `startSession` to work for checkmate.

### 5. Input validation widening

`puzzleId` validators currently cap at `max(30)`. Lichess IDs like `lc_xxxxx` fit, but bump to `max(40)` on `submitMove.puzzleId`, `submitMove.nextPuzzleId`, `useHint.puzzleId`, and `closeSession.servedPuzzleIds` items — defensive headroom only, no functional impact.

### 6. Remove dead import

Delete the three `await import("@/data/checkmate-puzzles")` lines (in `startSession`, `submitMove`, `useHint`). The file stays in the repo untouched — server simply no longer references it.

### Technical notes

- `winam_checkmate_puzzles` has 1304 / 1433 / 1259 rows across difficulties 1/2/3 — ample pool for rank-based selection without immediate cycle reset.
- The `lc_`-prefix filter on history reads/deletes is essential: `winam_puzzle_history` is shared with WisdomDrop, and unprefixed deletes would wipe wisdom history and re-serve already-seen proverbs.
- `puzzle_id` validation in attempt/history inserts already accepts text — no schema friction.
- The `theme` field flows from the new query into `clientData.theme`, which the existing `firstPuzzle: { puzzleId, ...clientData }` spread surfaces to the client. `checkmate.tsx`'s `GOAL_BY_THEME` map already keys on the Lichess theme strings ("Fork", "Pin", etc.), matching the table contents.
- Next-puzzle fetch on `submitMove` adds one DB round-trip per move. Acceptable for puzzle pacing; can be batched later if latency becomes an issue.
- No transition shim needed for `cm-` IDs in the wild: existing in-flight sessions still resolve via the `cm-` prefix branch fallback in `submitMove`/`useHint`, which now queries the same DB table — but those rows won't exist there. Acceptable because no live `cm-` sessions are expected; if any exist they fail gracefully (incorrect answer, no hint data) rather than crashing.

### Files touched
- `src/utils/game.functions.ts` — all four handlers, validator widening, dead-import removal

