I’ll make a single targeted change in `src/utils/game.functions.ts`.

Plan:
1. Update `ensureCurrentDrawWeek()` so the new draw-week insert uses a named `insertError` result.
2. If the insert fails with database error code `23505` (unique constraint violation on `week_start_wat`), query `winam_draw_weeks` for that same `week_start_wat` and return the existing week ID.
3. For any other insert error, preserve the current failure behavior by logging/throwing or returning `null` consistently with the function’s existing pattern.
4. Leave all draw timing, game logic, session flow, and other files unchanged.
5. Run TypeScript validation after the edit.