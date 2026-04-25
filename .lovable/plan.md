Approved code-only implementation plan:

1. Update `src/utils/game.functions.ts`
   - Leave schema/migrations untouched because `streak` has already been added to `entry_source_type` manually.
   - Keep the existing combined cap calculation:
     - `rawEntries = baseEntries + streakBonus`
     - `entriesToAdd = min(rawEntries, weekCap - weekSoFar)`
     - `overflow = rawEntries - entriesToAdd`
   - Split the capped award across two ledger rows:
     - `awardedBaseEntries = min(baseEntries, entriesToAdd)`
     - `awardedStreakBonus = min(streakBonus, entriesToAdd - awardedBaseEntries)`
   - Insert `game_session` row only if `awardedBaseEntries > 0`:
     - `entries_delta = awardedBaseEntries`
     - `cap_overflow = 0`
     - `week_total_after = weekSoFar + awardedBaseEntries`
   - Insert `streak` row only if `awardedStreakBonus > 0`:
     - `entries_delta = awardedStreakBonus`
     - `cap_overflow = overflow`
     - `week_total_after = weekSoFar + awardedBaseEntries + awardedStreakBonus`
   - If only base tickets are awarded and overflow exists, keep overflow on the base row so cap overflow handling remains recorded.
   - Keep session `entries_awarded`, response totals, coins, XP, streak, and mission evaluation behavior unchanged.

2. Update `src/routes/_authed/entries.tsx`
   - Change `TicketSource` support to include `streak`.
   - Add `streak` metadata using the Flame icon and orange/fire styling.
   - Keep `streak_bonus` metadata as a legacy fallback so older ledger rows still render correctly.

3. Verify
   - Run the build/typecheck after editing.
   - Confirm only these two files are changed:
     - `src/utils/game.functions.ts`
     - `src/routes/_authed/entries.tsx`