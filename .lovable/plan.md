Implement the requested admin Players table ticket totals with no database schema changes.

Technical plan:
1. Update `src/utils/admin.functions.ts` in `getPlayers`:
   - Keep the existing admin authorization, pagination, search, and player query unchanged.
   - After retrieving the paginated players, call the existing `getOpenOrLockedDrawWeek()` helper to get the current `open` or `locked` draw week.
   - If there is a current week and returned players, fetch `player_id, entries_delta` from `winam_entry_ledger` in one query using:
     - `draw_week_id = currentWeek.id`
     - `player_id IN (<current page player ids>)`
   - Aggregate `entries_delta` per player in memory.
   - Return each player with a new numeric `week_tickets` field, defaulting to `0` when no ledger rows exist or no current week exists.

2. Update `src/routes/admin.players.tsx` table rendering:
   - Add a `Tickets` header between `XP` and `Streak`.
   - Render `p.week_tickets ?? 0` between XP and Streak, formatted as a right-aligned tabular number.
   - Increase the loading and empty-state `colSpan` from `8` to `9`.

3. Verification:
   - Run the relevant type/build check if available to confirm the server function return type and table JSX remain valid.
   - No other files, UI sections, database rows, or schema will be changed.