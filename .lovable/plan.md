Plan to fix `closeSession()` idempotency

1. Update `src/utils/game.functions.ts`
   - In `closeSession()`, remove the `session.puzzles_solved !== null` guard entirely.
   - Keep the session fetch for the fields still needed later in the function: `draw_week_id`, `session_date_wat`, and `game_type`.
   - Keep the existing `winam_entry_ledger` lookup unchanged as the only idempotency guard:
     - `source_id = data.sessionId`
     - `source_type = 'game_session'`
     - return `Session already closed` only if a ledger row exists.

2. Do not make any other code or database changes.

3. Verification
   - Run the build after the code change to confirm the project still compiles.