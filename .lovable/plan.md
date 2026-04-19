

## Adaptive difficulty nudge for WisdomDrop

### Current state (verified)

- `winam_puzzle_history` table **already exists** (visible in `<supabase-tables>`) with `id, player_id, puzzle_id, seen_at`. No migration needed.
- `winam_game_sessions.wisdom_accuracy` column **already exists** (`integer`, nullable). No migration needed.
- `startSession` wisdomdrop branch already does history exclusion, rank-based difficulty mix, region variety, and shortfall cascade — implemented in the prior task.
- `closeSession` already records `servedPuzzleIds` into `winam_puzzle_history`.
- **Missing pieces**: (1) `wisdom_accuracy` is never written, (2) no adaptive nudge reads it.

So the user's "two SQL statements" prerequisite is already satisfied — no manual DB work required. Plan covers only the code changes.

### Changes (all in `src/utils/game.functions.ts`)

#### 1. `closeSession` — compute and store `wisdom_accuracy`

For wisdomdrop sessions, compute accuracy from `winam_puzzle_attempts` rows for this session:

```ts
if (session.game_type === "wisdomdrop") {
  const { data: attempts } = await supabaseAdmin
    .from("winam_puzzle_attempts")
    .select("result")
    .eq("session_id", data.sessionId);
  const total = attempts?.length ?? 0;
  const correct = (attempts ?? []).filter(a => a.result === "correct").length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  // include in the existing session UPDATE
}
```

Add `wisdom_accuracy: accuracy` to the existing `winam_game_sessions` UPDATE call (currently sets `puzzles_solved, hints_used, entries_awarded, coins_awarded, duration_seconds`). Single extra field — no extra round-trip.

Why count attempts rather than use `puzzlesSolved / totalPuzzles`? `puzzlesSolved` is the input parameter from the client (which already equals correct count in current useGameSession logic), but pulling from `winam_puzzle_attempts` is the source of truth and handles partial sessions (player exits early) correctly. Total attempts = puzzles actually answered, not the 10 served.

#### 2. `startSession` wisdomdrop branch — read last accuracy and nudge mix

After computing `mix` from `RANK_DIFFICULTY_MIX[rankTier]`, before bucketing:

```ts
// Adaptive difficulty nudge based on previous session accuracy
const { data: lastSession } = await supabaseAdmin
  .from("winam_game_sessions")
  .select("wisdom_accuracy")
  .eq("player_id", data.playerId)
  .eq("game_type", "wisdomdrop")
  .not("wisdom_accuracy", "is", null)
  .order("completed_at", { ascending: false })
  .limit(1)
  .maybeSingle();

const lastAccuracy = lastSession?.wisdom_accuracy ?? null;
let adjustedMix = { ...mix };
if (lastAccuracy !== null) {
  if (lastAccuracy >= 90) {
    // Harder: move 2 from beginner → advanced (clamp at 0)
    const shift = Math.min(2, adjustedMix.beginner);
    adjustedMix = {
      beginner: adjustedMix.beginner - shift,
      intermediate: adjustedMix.intermediate,
      advanced: adjustedMix.advanced + shift,
    };
  } else if (lastAccuracy < 50) {
    // Easier: move 2 from advanced → beginner (clamp at 0)
    const shift = Math.min(2, adjustedMix.advanced);
    adjustedMix = {
      beginner: adjustedMix.beginner + shift,
      intermediate: adjustedMix.intermediate,
      advanced: adjustedMix.advanced - shift,
    };
  }
  // 50–89: no change
}
// use adjustedMix instead of mix in the bucketing block
```

Then replace the three `mix.beginner / mix.intermediate / mix.advanced` references downstream with `adjustedMix.*`.

Remove the `// TODO: adaptive difficulty nudge —` comment block now that it's implemented.

### Edge cases

- **First-ever session**: `lastSession` is null → no nudge, use base `mix`.
- **Veteran+ with low accuracy**: base mix is `{1,5,4}` → after easier shift `{3,5,2}`. Still ships full session.
- **Starter with high accuracy**: base mix is `{7,2,1}` → after harder shift `{5,2,3}`. Note: advanced pool is thin (36 total) — shortfall cascade already handles this.
- **Clamp protection**: `Math.min(2, mix.beginner)` and `Math.min(2, mix.advanced)` prevent negative counts in degenerate cases.
- **Session abandoned with 0 attempts**: accuracy = 0, gets stored as 0 → next session will nudge easier. Acceptable — abandoning likely means it was too hard anyway.

### Files touched

- `src/utils/game.functions.ts` — two additions: nudge block in `startSession`, accuracy compute + store in `closeSession`. ~30 lines total.

No DB migration. No changes to `wisdomdrop.tsx` or `useGameSession.ts`. No new dependencies.

