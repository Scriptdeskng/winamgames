

## Plan: Persistent missions, entries-only rewards, auto-replacement (12 missions)

### A. Schema migration

`winam_player_missions`:
- `DROP COLUMN assigned_date_wat`
- `DROP COLUMN coins_awarded`
- `ADD COLUMN progress_current int NOT NULL DEFAULT 0`
- Add unique partial index `(player_id, mission_id) WHERE status = 'pending'`
- Truncate existing rows (clean slate)

`winam_missions`:
- Delete all existing rows
- Insert 12 seed rows, all `reward_type = 'entries'` (see seed list below)

Keep `mission_status` enum as-is (don't remove `expired`); code just stops writing it.

### B. Mission seed (12 rows)

| Title | condition_type | condition_value | reward |
|---|---|---|---|
| Solve 5 CheckMate puzzles | puzzles_solved | 5 | 2 |
| Play WisdomDrop today | game_type_mix | 1 | 1 |
| Solve 3 puzzles without using any hints | no_hints | 1 | 1 |
| Play both CheckMate and WisdomDrop | game_type_mix | 2 | 1 |
| Achieve a 3-day streak | streak_day | 3 | 1 |
| Solve 10 CheckMate puzzles | puzzles_solved | 10 | 3 |
| Complete 5 WisdomDrop questions | puzzles_solved | 5 | 1 |
| Solve 3 puzzles in a single session | puzzles_solved | 3 | 1 |
| Solve a puzzle without using any hints | no_hints | 1 | 1 |
| Achieve a 5-day streak | streak_day | 5 | 2 |
| Solve 20 puzzles total | puzzles_solved | 20 | 3 |
| Achieve a 7-day streak | streak_day | 7 | 3 |

Skipped (require new condition types): "3 sessions in one day", "no lives lost", "tier-1 hints only".

### C. Progress logic (`src/utils/mission.server.ts`)

Rewrite `evaluatePendingMissions` for incremental, persistent tracking:

- For each pending mission, compute new `progress_current`:
  - `puzzles_solved` → `progress_current + session.puzzles_solved`
  - `streak_day` → `player.current_streak` (set, not increment)
  - `game_type_mix` → distinct game types ever played by player (recompute)
  - `no_hints` → 1 if any session ever had `hints_used=0 AND puzzles_solved>0`, else 0
- If `progress_current >= condition_value`: mark `completed`, set `completed_at`, set `entries_awarded`, write to `winam_entry_ledger` respecting 50/week cap (overflow → coins, same path `closeSession` already uses).
- Return list of completed missions for the results screen.

No replacement here — done lazily by `getActiveMissions`.

### D. Active mission management (`src/utils/mission.functions.ts`)

Rename `getDailyMissions` → `getActiveMissions`. New behaviour:

1. Fetch player's `pending` missions.
2. If fewer than 3, pick from `winam_missions WHERE is_active=true` excluding currently pending + 3 most recently completed (variety guard). Insert as `pending`.
3. Return shape: `{ id, title, conditionType, conditionValue, progressCurrent, status, rewardAmount }` (no `rewardType` — always entries).

Drop all `assigned_date_wat` / today / draw-week-required logic. Missions exist independent of draw weeks.

### E. closeSession update (`src/utils/game.functions.ts`)

- Remove `assigned_date_wat` filter on mission queries.
- Remove `coins_awarded` writes on `winam_player_missions`.
- Mission bonus calc: count missions completed during this session (those returned from `evaluatePendingMissions`) — already the correct semantic.
- Coins still awarded only via cap overflow (existing logic preserved).

### F. UI rewrite (`src/routes/_authed/index.tsx`)

Replace `DailyMissionsSection` with `MissionsSection`:

- **Header**: `MISSIONS` + muted `· N of 3 done` (only when N>0). No countdown.
- **Row**: 40×40 tinted icon tile + title + (right side) `progress_current/condition_value` tabular-nums + ticket reward chip with proper pluralization (`1 entry` / `2 entries`).
- **Icon map**:
  - `puzzles_solved` → Swords, `bg-primary/15 text-primary`
  - `no_hints` → Sparkles, `bg-xp/15 text-xp`
  - `streak_day` → Flame, `bg-streak/15 text-streak`
  - `game_type_mix` → Shuffle, `bg-primary/15 text-primary`
- **Completed state**: `border-success/30 bg-success/5`, Check icon + "Reward claimed" replaces progress number, reward chip stays.
- **Auto-replacement animation** (client-only): when a mission's status is `completed` on mount, hold 3s, fade/slide it out, refetch via server fn to get the replacement, slide it in. Use `setTimeout` + Tailwind `transition-all opacity translate-y`. No new deps.
- **Empty state**: `<Calendar /> New missions coming soon` when API returns empty array.

### G. Results screen (`src/routes/_authed/results.tsx`)

Tighten mission display to entries-only — drop the `rewardType` branch, always render Ticket icon + "+N entries".

### H. Files touched

- New migration: schema changes + seed data
- `src/utils/mission.server.ts` — rewrite progress evaluation
- `src/utils/mission.functions.ts` — rename + lazy-replacement logic
- `src/utils/game.functions.ts` — drop daily filters + coin mission writes
- `src/routes/_authed/index.tsx` — new MissionsSection + helpers
- `src/routes/_authed/results.tsx` — entries-only mission display
- `src/components/games/useGameSession.ts` — verify no `rewardType` assumption (likely no change)

No new dependencies. No cron jobs. No midnight WAT logic anywhere.

