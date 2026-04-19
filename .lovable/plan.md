

## Tighten breakdown line hierarchy

Currently the hero stack is three lines all sharing `text-sm text-muted-foreground`:
1. `+3 tickets` (hero — large, primary)
2. `Added to your weekly draw` (subtext — meaningful caption)
3. `Solved 9 puzzles +1 · Mission bonus +2` (breakdown — supporting detail)

Lines 2 and 3 look identical, so the breakdown competes with the subtext instead of sitting beneath it.

### Fix

Demote the breakdown line so the visual order matches the information hierarchy: hero → caption → supporting detail.

| Line | Current | Proposed |
|---|---|---|
| Hero subtext ("Added to your weekly draw") | `text-sm text-muted-foreground` | unchanged |
| Breakdown chips | `text-sm text-muted-foreground` (mt-2) | `text-xs text-muted-foreground/70` (mt-1.5) |

Also separate items with a thin-space dot for a lighter rhythm: keep the existing ` · ` separator but the smaller size will already do most of the work.

### Implementation

Single change in `src/routes/_authed/results.tsx` (the `<p>` rendering `breakdownParts.join(...)` directly under the "Added to your weekly draw" line):

```tsx
<p className="mt-1.5 text-xs text-muted-foreground/70">
  {breakdownParts.join("  ·  ")}
</p>
```

No other layout, spacing, or color changes. No data changes.

### Out of scope

- Zero-tickets state (no breakdown line shown there).
- Weekly progress, nudge, streak pill, buttons — all unchanged.

