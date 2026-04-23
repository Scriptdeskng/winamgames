

## Force the server bundle to actually pick up the new RANK_TIERS

### Problem

CaptArice row right now: `xp_total = 660`, `rank_tier = recruit`. Audit log shows a `player_adjust_xp` at **17:48:23 UTC** (after the previous backfill + comment-touch) with `tier: recruit` written into details. That proves the running server bundle is still executing the **old** `RANK_TIERS` thresholds even though the source file has been correct for some time. Touching the file with a trailing comment was not enough to swap the live bundle.

### Why the comment touch failed

TanStack Start server functions are bundled by Vite into a server bundle. In the Lovable preview, a content-only change (whitespace/comment) to a server-only file does not always invalidate the server bundle — only the module graph for the client. The bundle that handles `adjustPlayerXP` kept serving the old code.

### Fix — make a real semantic change to the module so the bundle MUST rebuild

Two changes in `src/utils/admin.functions.ts`:

1. **Move `RANK_TIERS` and `tierFor` out of the closure** into a separately exported named constant + function (changes the module's exported surface, forcing a true server-bundle rebuild). Specifically:
   - Rename internal `tierFor` to `computeRankTier` and `export` it.
   - `export const RANK_TIERS = [...]` (already correct values).
   - Replace the existing `tierFor(xp)` call site inside `adjustPlayerXP` with `computeRankTier(xp)`.
   - Remove the no-op `// rank thresholds verified` trailing comment.

2. This is a **real** code change to the public module shape, which guarantees the Vite server bundle is invalidated and rebuilt on next request. No behavior change — same thresholds, same logic, same call site semantics.

### Then re-run the backfill

After the code change, re-run the same idempotent UPDATE to fix CaptArice (660 → `sergeant`):

```sql
UPDATE winam_players
SET rank_tier = CASE
  WHEN xp_total >= 10000 THEN 'immortal'::rank_tier
  WHEN xp_total >=  7000 THEN 'legend'::rank_tier
  WHEN xp_total >=  4500 THEN 'icon'::rank_tier
  WHEN xp_total >=  2500 THEN 'champion'::rank_tier
  WHEN xp_total >=  1200 THEN 'veteran'::rank_tier
  WHEN xp_total >=   500 THEN 'sergeant'::rank_tier
  WHEN xp_total >=   150 THEN 'recruit'::rank_tier
  ELSE 'starter'::rank_tier
END
WHERE rank_tier IS DISTINCT FROM (
  CASE
    WHEN xp_total >= 10000 THEN 'immortal'::rank_tier
    WHEN xp_total >=  7000 THEN 'legend'::rank_tier
    WHEN xp_total >=  4500 THEN 'icon'::rank_tier
    WHEN xp_total >=  2500 THEN 'champion'::rank_tier
    WHEN xp_total >=  1200 THEN 'veteran'::rank_tier
    WHEN xp_total >=   500 THEN 'sergeant'::rank_tier
    WHEN xp_total >=   150 THEN 'recruit'::rank_tier
    ELSE 'starter'::rank_tier
  END
);
```

Expected: 1 row affected (CaptArice `recruit` → `sergeant`).

### Verify the bundle actually swapped

After the backfill, do a tiny test XP adjust on CaptArice (e.g. +1 then -1) and re-query. If the new audit entry's `details.tier` reads `sergeant` and the row stays `sergeant`, the new bundle is live. If it flips back to `recruit`, the bundle still didn't swap and the user will need to hit "Update" in the publish dialog (or restart the preview from the project settings) to force a hard redeploy.

### Files changed

- `src/utils/admin.functions.ts` — export `RANK_TIERS`, rename `tierFor` → `computeRankTier` and export it, update the one call site inside `adjustPlayerXP`, remove the trailing no-op comment.

### Database operations

- One `UPDATE` on `winam_players.rank_tier` (1 row affected: CaptArice).

### Out of scope

- No changes to `RankBadge.tsx`, `tierFor`'s logic, audit log shape, or any other call paths.

