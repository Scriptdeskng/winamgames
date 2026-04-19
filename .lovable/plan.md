

## Switch WisdomDrop to DB-backed puzzles + reveal answer with cultural context

### Current state

- `winam_wisdom_puzzles` table has **300 rows** with columns: `id`, `display_text`, `options` (jsonb array), `correct_index`, `blank`, `difficulty`, `region`, `original_proverb`. IDs look like `yd_yor_001`.
- All three server functions (`startSession`, `submitMove`, `useHint` in `src/utils/game.functions.ts`) read from the **hardcoded TS file** `src/data/wisdomdrop-puzzles.ts` using fields `proverb / options / correctIndex / origin`.
- Client (`src/routes/_authed/wisdomdrop.tsx`) renders `puzzle.proverb` and `puzzle.origin` — fields the DB doesn't return.
- Puzzle-type detection uses `puzzleId.startsWith("cm-")` and falls through to wisdom — works fine since DB IDs don't start with `cm-`.

### Changes

#### 1. `src/utils/game.functions.ts` — read from DB, not TS file

Replace all three `WISDOMDROP_PUZZLES` import sites with Supabase queries against `winam_wisdom_puzzles` using the exact column names the user listed. Drop the import line in each handler.

**`startSession` (wisdomdrop branch):**
- Query: `select id, display_text, options, correct_index, blank, region from winam_wisdom_puzzles` then JS-shuffle and take 10. (No `original_proverb` here — only revealed after answer.)
- For each puzzle: shuffle the `options` array, remap `correct_index` to the new shuffled position, build `clientData` as `{ displayText, options, region }`. Do **not** send `correctIndex`, `blank`, or `originalProverb` to the client at this stage.
- Persist the shuffled order + correct index server-side? Currently the code re-shuffles on every submit/hint lookup, which means the client-shown options and server-graded options can differ. Fix: **store the shuffled options + correctIndex inline in the client payload as a server-signed token? Too heavy.** Simpler and consistent with current behavior: grade by comparing the submitted answer **string** against the DB's `options[correct_index]`. Order doesn't matter for grading since we compare text. Keep this approach — it already works in the existing code.

**`submitMove`:**
- Replace `WISDOMDROP_PUZZLES.find(...)` with `supabaseAdmin.from("winam_wisdom_puzzles").select("options, correct_index, blank, original_proverb, region").eq("id", data.puzzleId).maybeSingle()`.
- Grade: `isCorrect = data.answer === options[correct_index]`.
- **New:** include `revealData` in the response: `{ correctAnswer: options[correct_index], blank, originalProverb: original_proverb, region }`. Sent regardless of correct/incorrect — the user wants the reveal shown after every answer.
- For `nextPuzzle` lookup: same query shape, return `{ puzzleId, displayText, options (shuffled), region }`.

**`useHint`:**
- Replace lookup with same DB query (need `options`, `correct_index`).
- Hint logic unchanged (eliminate 2 wrong / first letter / full answer).

**Type for `puzzleId`:** the input validator currently allows `z.string().min(1).max(20)`. DB IDs like `yd_yor_001` are 10 chars — fits. Keep, but bump max to 30 to be safe for future regions.

#### 2. `src/components/games/useGameSession.ts` — surface reveal data

- Update the `submit` response type to include the new `revealData` field.
- Add `lastReveal: { correctAnswer, blank, originalProverb, region } | null` to `GameSessionState`.
- On submit response, set `lastReveal` from `revealData`. Clear `lastReveal` when the next puzzle starts (i.e. when `result.correct` advances to next puzzle, OR after a delay on incorrect).
- Expose `lastReveal` in returned state.

**Display timing:** keep it simple — reveal is visible while `feedback` is set (between answer and next puzzle / game over). On correct answers the existing flow advances quickly; we'll briefly show the reveal then move on. To give the player time to read, **delay the next-puzzle advance** by ~1.8s when reveal data is present. Currently the correct-answer path advances immediately — we'll add a setTimeout to push the state update for `currentPuzzle/currentPuzzleIndex` so the reveal stays visible.

Simpler alternative: keep advance immediate but render the reveal as part of the **feedback banner area**, which already persists for the existing 1.5s game-over delay. For per-puzzle (non-final) correct answers there is currently no delay — we'll add one (~1.8s) before advancing so the reveal is readable. This is the cleanest UX.

#### 3. `src/routes/_authed/wisdomdrop.tsx` — render reveal panel + use new field names

- Rename references: `puzzle.proverb` → `puzzle.displayText`, `puzzle.origin` → `puzzle.region`.
- Replace the existing tiny green/red feedback strip with an **expanded reveal panel** when `session.lastReveal` is present and `session.feedback` is set. Layout:
  ```
  ┌────────────────────────────────────────┐
  │ ✓ Correct!  /  ✗ Wrong answer          │  (existing colored header)
  │                                        │
  │ Answer: "blank"                        │  (large, bold, primary color)
  │                                        │
  │ "original_proverb"                     │  (italic, muted, smaller —
  │                                         │   the original-language proverb)
  │ — region                                │  (tiny muted label)
  └────────────────────────────────────────┘
  ```
- Disable option buttons while reveal is showing (already gated by `loading`).

#### 4. Optionally: keep or delete `src/data/wisdomdrop-puzzles.ts`

After the switch, the TS data file is dead code. Leave it in place for this task (could be useful for offline tests or seed reference) — note it as "no longer wired in" and remove on a later cleanup. Out of scope for this change.

### Files touched

- `src/utils/game.functions.ts` — replace 3 hardcoded lookups with DB queries; add `revealData` to `submitMove` response.
- `src/components/games/useGameSession.ts` — add `lastReveal` state + delayed advance on correct.
- `src/routes/_authed/wisdomdrop.tsx` — switch field names (`displayText`, `region`), expand feedback into reveal panel.

No DB migration. No schema changes. No new dependencies.

