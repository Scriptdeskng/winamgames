## Pass server-computed streakBonus through to results screen

Replace the inaccurate subtraction-based streak bonus calculation in the results screen with the server's authoritative value.

### Current state (verified)

- `src/utils/game.functions.ts` (line 1207): `closeSession()` already returns `streakBonus` in its payload — no server change needed.
- `src/components/games/useGameSession.ts` (line ~145–162): `endSession()` calls `navigate({ to: "/results", search: {...} })` and currently passes `baseEntries: result.baseEntries ?? 0` but **not** `streakBonus`.
- `src/routes/_authed/results.tsx`: search schema does not include `streakBonus`. Component derives it as `Math.max(0, entries - baseEntries - missionEntries)`, which is wrong when entries are capped at the weekly limit — capped streak bonus tickets get attributed inconsistently.

### Changes

**1. `src/components/games/useGameSession.ts`** — in the `endSession()` success branch, add one field to the navigate search object:
```ts
streakBonus: result.streakBonus ?? 0,
```
Place it next to `baseEntries`.

**2. `src/routes/_authed/results.tsx`**
- Add `streakBonus: fallback(z.number(), 0).default(0)` to `resultsSearchSchema`.
- Destructure `streakBonus` from `Route.useSearch()`.
- Replace:
  ```ts
  const streakBonusEntries = Math.max(0, entries - baseEntries - missionEntries);
  ```
  with:
  ```ts
  const streakBonusEntries = streakBonus;
  ```
- The existing `breakdownParts` line (`if (streakBonusEntries > 0) breakdownParts.push(...)`) stays as-is since it already references `streakBonusEntries`.
- Remove the now-unused `missionEntries` local if it's no longer referenced after the change. (Verify: it's still used to compute `missionEntries` value for the breakdown chip — keep it.)

**3. No change to `src/utils/game.functions.ts`** — `streakBonus` is already in the return payload.

### Verification

Build runs automatically after edits.