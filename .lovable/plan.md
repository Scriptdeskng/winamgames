Plan:

1. Update only `src/utils/game.functions.ts`.

2. In `closeSession()`, change the session fetch so it selects only the fields needed for the existing logic plus the closed-session signal:
   - Keep: `draw_week_id`, `session_date_wat`, `game_type`, `puzzles_solved`
   - Remove from the select: `hints_used`, `entries_awarded`, `coins_awarded`, `duration_seconds`

3. Replace the current multi-field idempotency guard:
   - Remove checks against `hints_used`, `entries_awarded`, `coins_awarded`, and `duration_seconds`.
   - Use only:
     ```ts
     if (session.puzzles_solved !== null) {
       return { success: false as const, error: "Session already closed" };
     }
     ```

4. Leave the ledger-based fallback check exactly where it is and unchanged.

5. Make no other code changes.

6. After implementation, run the build command to verify the app compiles successfully.