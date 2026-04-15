

# Phase 2 — Games, Sessions & Results

## What gets built

### 1. Mock puzzle data files
- `src/data/checkmate-puzzles.ts` — 20 chess puzzles with FEN positions, solution moves, difficulty ratings. Solutions stored here but NEVER sent to client.
- `src/data/wisdomdrop-puzzles.ts` — 20 African proverbs with blank word, 4 options, correct answer index. Correct answer NEVER sent to client.

### 2. Chess board renderer (`src/components/games/ChessBoard.tsx`)
- Pure client-side FEN parser — render 8x8 grid using Unicode chess pieces (no `chess.js` dependency needed for display-only).
- Tap-to-move: tap piece to select (highlight square), tap destination to submit move. Minimum 44px touch targets.
- Visual: dark/light squares using emerald theme tokens, selected piece glow, last-move highlight.

### 3. Game session state management (`src/components/games/useGameSession.ts`)
- React hook managing: timer (count-up), lives (3 max, wrong answer = -1 life), puzzles solved, hints used, current puzzle index.
- Calls server function to validate moves / answers.
- Session ends on: 0 lives, all puzzles done, or player exits.

### 4. Shared game UI components
- `src/components/games/GameHeader.tsx` — timer, lives display (hearts), exit button. Replaces BottomNav during play.
- `src/components/games/HintButton.tsx` — 3-tier hint system with coin cost display.
- `src/components/games/LivesDisplay.tsx` — 3 hearts, animate on loss.
- `src/components/games/GameTimer.tsx` — elapsed time counter.

### 5. CheckMate game screen (`src/routes/checkmate.tsx`)
- Full rewrite of the stub. Shows chess board, game header, hint button.
- On move submission: calls `submitMove` server function which validates against stored solution.
- No bottom nav during play.

### 6. WisdomDrop game screen (`src/routes/wisdomdrop.tsx`)
- Full rewrite. Shows proverb with blank, 4 option buttons.
- On selection: calls `submitAnswer` server function.
- Same session structure (timer, lives, hints).

### 7. Server functions (`src/utils/game.functions.ts`)
- `startSession` — creates a game session row (locks `draw_week_id` at start), returns session ID and first puzzle (FEN only / proverb + options only, NO solution).
- `submitMove` — validates player's move against stored solution server-side. Records puzzle attempt. Returns correct/incorrect + next puzzle if correct. Flags attempts under 3000ms.
- `useHint` — deducts coins from player balance, returns hint data for the tier requested, records hint usage.
- `closeSession` — full entry calculation per spec:
  ```
  net_puzzles = puzzles_solved - hints_used
  base_entries = floor(net_puzzles / base_N)
  streak_bonus from current_streak thresholds
  mission_bonus from today's completed missions
  raw_entries = base + streak + mission
  entries_to_add = MIN(raw_entries, weekly_cap - week_so_far)
  overflow → coins
  ```
  Writes `winam_game_sessions`, appends to `winam_entry_ledger`, updates `winam_players` (xp, coins, streak, last_session_date). Returns result object only.

### 8. Results screen (`src/routes/results.tsx`)
- Full rewrite. Reads session results from route search params (passed from game screen after closeSession).
- Shows: entries earned, coins earned, streak day, weekly total, XP gained.
- "Back to Home" button.

### 9. Database migration
- Create an initial `winam_draw_weeks` row for the current week so sessions can reference a valid `draw_week_id`.
- Seed `winam_missions` with 6 sample missions.

## Technical details

**No new npm dependencies.** Chess board is rendered with a simple FEN parser using Unicode pieces — no `chess.js` needed. Move validation is server-side string comparison against the stored solution move.

**Puzzle serving pattern:**
- Server function selects the next puzzle from the mock data array.
- For CheckMate: returns `{ fen, puzzleId }` — never the solution.
- For WisdomDrop: returns `{ proverb, options, puzzleId }` — the options are shuffled server-side, correct answer index is NOT sent.

**Session flow:**
1. Player taps "Start Game" → `startSession()` → gets session ID + first puzzle
2. Player submits answer → `submitMove()` → server validates → returns result + next puzzle
3. On 0 lives / exit / puzzles complete → `closeSession()` → entry calculation → navigate to `/results`

**File changes summary:**
- Create: `src/data/checkmate-puzzles.ts`, `src/data/wisdomdrop-puzzles.ts`
- Create: `src/components/games/ChessBoard.tsx`, `src/components/games/GameHeader.tsx`, `src/components/games/HintButton.tsx`, `src/components/games/LivesDisplay.tsx`, `src/components/games/GameTimer.tsx`, `src/components/games/useGameSession.ts`
- Create: `src/utils/game.functions.ts`
- Rewrite: `src/routes/checkmate.tsx`, `src/routes/wisdomdrop.tsx`, `src/routes/results.tsx`
- Migration: seed current draw week + sample missions

