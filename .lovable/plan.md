Plan to fix the three mission bugs with changes limited to the requested files.

Files to change:
- `src/utils/mission.server.ts`
- `src/utils/mission.functions.ts`

Implementation:
1. In `evaluatePendingMissions()` in `src/utils/mission.server.ts`:
   - Stop ignoring the `_watDate` parameter.
   - Restrict the pending mission query to missions assigned on `_watDate`.
   - Order the query consistently with the visible slot logic.
   - Limit evaluation to 3 rows so only the visible daily mission slots can progress/complete/reward.

   Target query shape:
   ```ts
   .eq("player_id", playerId)
   .eq("status", "pending")
   .eq("assigned_date_wat", _watDate)
   .order("assigned_date_wat", { ascending: false })
   .order("id", { ascending: true })
   .limit(3)
   ```

2. In `getActiveMissions()` in `src/utils/mission.functions.ts`:
   - Replace the current slot refill calculation that fills whenever fewer than 3 missions are returned.
   - Add `hasAnyTodayMissions` based on `assigned_date_wat === todayWat`.
   - Set `slotsAvailable` to `0` when the player already has at least one mission assigned today.
   - Keep refill behavior only for a fresh WAT day when no missions exist for today.

   Target logic:
   ```ts
   const hasAnyTodayMissions = todaysMissions.some(
     (m) => m.assigned_date_wat === todayWat
   );
   const slotsAvailable = hasAnyTodayMissions
     ? 0
     : Math.max(0, TARGET_PENDING - todaysMissions.length);
   ```

3. Verification:
   - Run the project build after the code changes.
   - Do not edit any other source files.

No database changes are required.