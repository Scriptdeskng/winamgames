

## Gate streak, missions, and ledger writes behind real performance

Fix `closeSession` in `src/utils/game.functions.ts` so a player who solves fewer than 5 puzzles cannot earn streak bonuses, advance their daily streak, complete missions, or receive any entries.

### The change

In `closeSession`, immediately after `baseEntries = Math.floor(puzzles_solved / 5)` is computed, branch on whether `baseEntries === 0`.

**Zero-performance branch (`baseEntries === 0`)**

1. Compute `wisdomAccuracy` from `winam_puzzle_attempts` (audit signal).
2. UPDATE `winam_game_sessions` with `entries_awarded: 0`, `coins_awarded: 0`, plus the submitted `puzzles_solved`, `hints_used`, `duration_seconds`, and `wisdom_accuracy`.
3. INSERT `winam_puzzle_history` rows for wisdomdrop (so served puzzles aren't re-served — anti-fraud, not a reward).
4. Do NOT write to `winam_entry_ledger`.
5. Do NOT update `winam_players` at all — no XP, no coins, no streak, no `last_session_date`, no rank tier.
6. Do NOT call `evaluatePendingMissions`.
7. Return early with the same response shape as the success path, all reward fields zeroed and identity fields preserved from the existing player row:

   ```
   {
     success: true,
     entries: 0, sessionEntries: 0, baseEntries: 0,
     streakBonus: 0, missionEntries: 0,
     coins: 0, xp: 0,
     streak: player.current_streak,
     weekTotal: weekSoFar, weekCap,
     overflow: 0,
     rankTier: player.rank_tier,
     previousRank: player.rank_tier,
     completedMissions: [],
   }
   ```

   `weekSoFar` is read from the ledger before the gate (existing query stays where it is — it's cheap and used by both branches).

**Performance branch (`baseEntries >= 1`) — unchanged**

Streak bonus, ledger insert, player update (XP/coins/streak/last_session_date/rank), and `evaluatePendingMissions` all run exactly as today. No threshold changes (3/7/14 → +1/+2/+3). No formula changes.

### Handler ordering

```text
1. Load player + session
2. Compute baseEntries
3. Read weekSoFar from ledger (both branches)
4. Compute wisdomAccuracy (both branches)
5. if baseEntries === 0:
     UPDATE winam_game_sessions with zeros
     INSERT winam_puzzle_history (wisdomdrop only)
     return zeroed result
6. else:
     streakBonus, rawEntries, entriesToAdd, overflow
     XP, coins
     UPDATE winam_game_sessions
     INSERT winam_entry_ledger (if entriesToAdd > 0)
     UPDATE winam_players (streak, last_session_date, XP, coins, rank)
     INSERT winam_puzzle_history (wisdomdrop only)
     evaluatePendingMissions
     return full result
```

### Why this shape

- Single early return keeps the success path readable.
- Same response shape on both branches → `useGameSession.endSession` and `/results` need zero changes (results page already tolerates zero values).
- Session row + puzzle history still written on zero → audit trail intact, exploit closed.
- Skipping the entire `winam_players` update is the cleanest guarantee that streak / XP / coins / rank don't move.

### Files touched

- `src/utils/game.functions.ts` — `closeSession` only.

### Out of scope

- No DB schema or migration changes.
- No changes to `evaluatePendingMissions` (`src/utils/mission.server.ts`).
- No UI changes (`results.tsx`, `useGameSession.ts` untouched).
- Streak thresholds unchanged.
- `startSession`, `submitMove`, `useHint` untouched.

### Verification (after implementation, before closing)

Manually walk all four scenarios and report results in the follow-up message:

1. Start session → immediately exit. Confirm: no `winam_entry_ledger` row, `winam_players.current_streak` and `last_session_date` unchanged, no `winam_player_missions` progress change, `winam_game_sessions` row exists with `entries_awarded=0`, `coins_awarded=0`.
2. Solve 4 puzzles → exit. Same expectations as #1 (4 < 5 → baseEntries still 0).
3. Solve 5 puzzles → exit. baseEntries=1, streak bonus + mission eval run, ledger row written, `current_streak` incremented (or held if same WAT day).
4. Solve 10 puzzles → exit. baseEntries=2, full reward path, entry count matches `2 + streakBonus + missionEntries` capped at 50/week.

Task is not marked complete until all four are confirmed.

