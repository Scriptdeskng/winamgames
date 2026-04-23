

## Fix RANK_TIERS thresholds + correct stored tiers

### 1. Code fix — `src/utils/admin.functions.ts` (lines 289–298)

Replace the incorrect `RANK_TIERS` constant with the correct game-design values. The `tierFor()` helper below it works correctly with any ascending-min array, so no other code changes needed.

```ts
const RANK_TIERS = [
  { tier: "starter", min: 0 },
  { tier: "recruit", min: 150 },
  { tier: "sergeant", min: 500 },
  { tier: "veteran", min: 1200 },
  { tier: "champion", min: 2500 },
  { tier: "icon", min: 4500 },
  { tier: "legend", min: 7000 },
  { tier: "immortal", min: 10000 },
] as const;
```

This matches `RANK_CONFIG` in `src/components/profile/RankBadge.tsx` (the player-facing source of truth), so admin-side tier calculations on XP adjustments will agree with the profile UI going forward.

### 2. Database investigation — CaptArice's XP is NOT stale

Checked `winam_players` and `winam_admin_audit_log`:

- **CaptArice** (`2f0531f4-75eb-43d7-8cdd-1d817b877344`): `xp_total = 660`, `rank_tier = recruit`
- Last XP audit entry: `before: 650, after: 660, amount: +10` — the read-then-write was consistent. **No stale read occurred.** The stored `xp_total` of 660 is correct.

The only thing that's wrong on her record is the **rank_tier**, which was computed using the bad thresholds (660 < old `recruit` min of 1500 ⇒ stayed "recruit"). Under the correct thresholds, 660 XP ⇒ `sergeant`.

A second player on the current page also needs re-tiering:
- **Panda** (`75e1a26b-…`): `xp_total = 320`, currently `recruit` ⇒ correct under new thresholds (≥150). No change needed.
- **CaptArice**: `xp_total = 660`, currently `recruit` ⇒ should be `sergeant`.

### 3. Backfill all players' rank_tier

Since the bad thresholds have been live, any player with XP ≥ 150 may be on the wrong tier. Run a one-shot data update to recompute `rank_tier` for **every** player using the correct thresholds (single SQL `UPDATE` with a `CASE` expression, executed via the insert tool — not a migration since it's data, not schema):

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

This corrects CaptArice (`recruit` → `sergeant`) and any other affected player in one shot, and is idempotent.

### Files changed

- `src/utils/admin.functions.ts` — replace `RANK_TIERS` array (lines 289–298 only)

### Database operations

- One backfill `UPDATE` on `winam_players.rank_tier` (data update via insert tool — UPDATE access is needed; if the tool only allows insert/select, this will need to be run as a one-off migration instead).

### Out of scope

- No changes to `RankBadge.tsx`, no changes to `tierFor()` logic, no changes to audit log entries (historical `tier` field in `details` reflects what was computed at the time, which is fine for audit purposes).

