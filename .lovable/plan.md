

## Smarter WisdomDrop puzzle selection — confirmed, with scarcity note

Proceeding exactly as previously approved, with the additional comment above `RANK_DIFFICULTY_MIX` flagging the advanced-pool scarcity for Veteran+ players.

### Final comment block (placed directly above the constant)

```ts
// Difficulty values in winam_wisdom_puzzles: beginner (144), intermediate (120), advanced (36)
// Note: advanced pool is thin — Veteran+ (4/session) exhausts it in ~9 sessions before cascade kicks in.
// Expand advanced pool in winam_wisdom_puzzles to 80+ for better Veteran+ experience.

// TODO: adaptive difficulty nudge — read last session wisdom_accuracy from
// winam_game_sessions and shift mix one step harder (>=90%) or easier (<50%)
// before applying RANK_DIFFICULTY_MIX. Implement as follow-up task.
const RANK_DIFFICULTY_MIX = { ... };
```

### Recap of changes (unchanged from prior approval)

**`src/utils/game.functions.ts`**
- `startSession` (wisdomdrop branch): fetch `rank_tier`, query `winam_puzzle_history` for seen IDs, exclude via `.not("id","in", ...)`, cycle-reset if `<15` unseen, bucket by difficulty using `RANK_DIFFICULTY_MIX`, shortfall cascade (advanced→intermediate→beginner), region variety pass (cap 4/region, target ≥3 regions), then fetch full puzzle data for the 10 picked.
- `closeSession`: add `servedPuzzleIds` to input validator, insert one history row per ID for wisdomdrop sessions only, with `// TODO: switch to batch insert for puzzle history on session close`.

**`src/components/games/useGameSession.ts`**
- Pass `servedPuzzleIds: state.puzzleIds` to `closeSession`.

No DB migration. No schema changes. No UI changes. Checkmate flow untouched.

