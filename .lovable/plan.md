Plan to apply the mission slate fixes exactly as requested:

1. Update `src/utils/mission.functions.ts`
   - Add a hard `.limit(3)` to `loadTodaysMissions`.
   - Keep ordering as:
     - `assigned_date_wat DESC`
     - `completed_at ASC NULLS FIRST`
     - existing stable `id ASC` tie-breaker, unless it conflicts with the requested order.
   - This ensures the server only returns the current 3-slot slate instead of all historical pending/today-completed rows.

2. Update `src/routes/_authed/app.tsx`
   - Cap the rendered mission list with `missions.slice(0, 3)`.
   - Use that capped list for the displayed rows and the header count, so the UI cannot show more than 3 cards even if extra rows are returned.

3. Clean stale historical mission data
   - Run the requested data cleanup SQL:

```sql
UPDATE winam_player_missions
SET assigned_date_wat = '2000-01-01'
WHERE status = 'completed'
AND assigned_date_wat = CURRENT_DATE;
```

4. Validation
   - Run TypeScript/build checks after the code changes.
   - No changes to `mission.server.ts`, `game.functions.ts`, or other files.