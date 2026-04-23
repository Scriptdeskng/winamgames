

## Re-run rank_tier backfill + force fresh server bundle

### Current state

- 1 row mismatched: **CaptArice** — `xp_total = 650`, `rank_tier = recruit` (should be `sergeant`).
- All other players are already on the correct tier.
- `RANK_TIERS` source in `src/utils/admin.functions.ts` is already correct — no code change needed for the threshold fix itself.

### Actions (in order)

1. **Run the backfill UPDATE** on `winam_players` via the data tool:

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

2. **Force a fresh server bundle** so the running preview server uses the corrected `RANK_TIERS`. Server functions in TanStack Start are bundled — a source save doesn't always swap the live bundle. To guarantee freshness, touch `src/utils/admin.functions.ts` with a no-op change (add/adjust a trailing comment line) and save it. This causes the Vite server to rebuild the server bundle so the next `adjustPlayerXP` call uses the new thresholds.

   - The edit is a single trailing comment line at the end of the file (e.g. `// rank thresholds verified`). No logic change.
   - After the edit, the preview server picks up the new bundle on the next request.

3. **Verify**: re-query `winam_players` to confirm 0 rows mismatch the expected tier.

### Why not a full preview restart

The Lovable preview environment doesn't expose a manual "restart server" control to me — the way to guarantee a fresh server bundle from this side is to trigger a rebuild by modifying a file the bundler watches. A trailing comment in `admin.functions.ts` is the smallest, safest trigger that targets exactly the bundle in question. The user can additionally hit "Update" in the publish dialog if they want to force the published deployment to refresh, but the preview will already be on the new bundle.

### Files changed

- `src/utils/admin.functions.ts` — append a single trailing comment line to force bundle rebuild. No logic change.

### Database operations

- One `UPDATE` on `winam_players.rank_tier` (1 row affected: CaptArice).

### Verification step

- Post-backfill SELECT showing 0 mismatched rows.
- Note to user: next admin XP adjust on any player will run on the new bundle and write the correct tier.

