Plan:

1. Update only `src/utils/game.functions.ts`.

2. In `closeSession()`, extend the session fetch to include `puzzles_solved`:
   - Current fetch selects `draw_week_id, session_date_wat, game_type`.
   - Change it to also select `puzzles_solved` so the function can detect an already-closed session.

3. Immediately after the existing `if (!session)` validation, add the primary idempotency guard:
   - If `session.puzzles_solved !== null`, return:
     ```ts
     return { success: false as const, error: "Session already closed" };
     ```
   - This runs before any writes, so duplicate XP, coins, ticket ledger rows, streak updates, missions, and puzzle history are skipped.

4. Add the requested ledger-based fallback guard immediately after the `puzzles_solved` guard:
   - Query `winam_entry_ledger` for `source_id = data.sessionId` and `source_type = "game_session"`.
   - If a row exists, return the same `Session already closed` response.
   - This is redundant once `puzzles_solved` is set, but keeps the extra protection requested for existing sessions where ledger rows may already exist.

5. Run `bun run build` after the edit to verify TypeScript and production build compatibility.

No other files will be changed.