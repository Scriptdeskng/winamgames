Plan to fix mission carry-over behavior

Scope: `src/utils/mission.functions.ts` only.

1. Update `getActiveMissions()` mission loading flow
   - Load missions already assigned for today, limited to the 3 visible slots.
   - Load pending missions from previous WAT dates only if today has fewer than 3 rows.
   - Preserve each carried-over mission’s progress and update its `assigned_date_wat` to today.

2. Combine active slot rows before assignment
   - Build a combined list from today’s rows plus carried-over pending rows.
   - Use this combined list as the current visible 3-slot slate.

3. Fill only truly empty slots
   - Calculate `slotsAvailable` from `TARGET_PENDING - combinedMissions.length`.
   - Keep the existing new mission assignment/exclusion logic unchanged, except use `combinedMissions` for the `pendingIds` exclusion list.
   - Use `if (slotsAvailable > 0 && drawWeek)` as requested.

4. Return the correct active slate
   - After new mission insertion, reload the active rows so the final response includes today’s missions, carry-overs, and any newly assigned missions.
   - Map the final combined/current mission list in the return payload, not the old `todaysMissions` variable.

5. Verify
   - Run the project build after the edit.
   - Confirm only `src/utils/mission.functions.ts` changed.