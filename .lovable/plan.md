

# Phase 3 — Economy & Progression

## What gets built

### 1. Server functions for missions, streaks, and player data (`src/utils/mission.functions.ts`)
- `getPlayerData` — fetches player profile (coins, xp, rank, streak, nickname, msisdn_last4) plus current week entry total. Used by Home, Profile, and game screens.
- `getDailyMissions` — assigns 3 random missions for today (WAT) if not already assigned, returns them with progress status. Checks `winam_player_missions` for existing assignments, inserts new ones from `winam_missions` pool if missing.
- `evaluateMissions` — called after `closeSession`. Checks each pending mission's condition against today's session data:
  - `puzzles_solved`: sum of puzzles_solved from today's sessions
  - `no_hints`: any session today with hints_used = 0
  - `streak_day`: current_streak >= condition_value
  - `game_type_mix`: distinct game_types played today >= condition_value
  Awards rewards (coins or entries) and updates `winam_player_missions` status to "completed".

### 2. Wire `evaluateMissions` into `closeSession`
- After updating the player row in `closeSession`, call mission evaluation logic inline (not a separate server function call — just shared helper functions in a `.server.ts` file to avoid import issues).
- Add mission completion results to the `closeSession` return object so the results screen can display them.

### 3. Rank system components (`src/components/profile/RankBadge.tsx`)
- Chess piece icons for each rank tier (Pawn through King) using Lucide or simple SVG.
- XP thresholds displayed: Pawn 0, Knight 100, Bishop 400, Rook 1000, Queen 2500, King 5000.
- `RankBadge` — shows rank icon + name + tier color.
- `XpProgressBar` — shows current XP, progress to next rank, rank labels on either side.

### 4. Update Profile page (`src/routes/profile.tsx`)
- Fetch real player data via `getPlayerData` server function.
- Show `RankBadge` with actual rank tier, `XpProgressBar` with real XP.
- Display real coin balance, streak, and weekly entries from database.

### 5. Update Home dashboard (`src/routes/index.tsx`)
- Fetch player data and daily missions via server functions.
- Replace hardcoded streak, entries, missions, and leaderboard data with real data.
- Mission cards show actual progress and completion status.
- Draw countdown computed from `winam_draw_weeks.draw_executes_at`.

### 6. Update game screens to use real player data
- `checkmate.tsx` and `wisdomdrop.tsx`: fetch player coin balance before starting session; pass real player ID (still placeholder UUID until auth is wired, but structure is ready).

### 7. Update Results screen (`src/routes/results.tsx`)
- Add mission completions to search params and display them (e.g., "Mission Complete: Solve 5 puzzles — +10 coins").
- Show rank tier and whether rank changed.

## Technical details

**New files:**
- `src/utils/mission.functions.ts` — `getPlayerData`, `getDailyMissions`, `evaluateMissions`
- `src/utils/mission.server.ts` — shared helpers for mission condition evaluation (server-only)
- `src/components/profile/RankBadge.tsx` — rank icon + XP bar component

**Modified files:**
- `src/utils/game.functions.ts` — integrate mission evaluation into `closeSession`
- `src/routes/profile.tsx` — real data from server functions
- `src/routes/index.tsx` — real missions, streak, entries, countdown
- `src/routes/checkmate.tsx` — fetch coin balance
- `src/routes/wisdomdrop.tsx` — fetch coin balance
- `src/routes/results.tsx` — show mission completions + rank

**No database migrations needed.** All tables already exist. Mission assignment writes to `winam_player_missions` via `supabaseAdmin`.

**No new dependencies.**

