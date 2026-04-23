

## Restore WisdomDrop hint button labels

### Root cause

`src/components/games/HintButton.tsx` has CheckMate-specific labels hardcoded in its `HINT_TIERS` constant ("Which piece", "Destination", "Full answer"). WisdomDrop uses this shared component, so it inherited the wrong labels. CheckMate has its own inline `HINT_TIERS` in `checkmate.tsx` and does NOT use the shared component, so changing it only affects WisdomDrop.

### Fix — `src/components/games/HintButton.tsx`

Replace the `HINT_TIERS` constant with the correct WisdomDrop labels (matching the actual tier behavior in `game.functions.ts`):

```ts
const HINT_TIERS = [
  { tier: 1, label: "Eliminate 2", cost: 25 },
  { tier: 2, label: "First letter", cost: 75 },
  { tier: 3, label: "Reveal answer", cost: 150 },
] as const;
```

No prop or interface changes. No other files touched.

### Verification

1. WisdomDrop hint button shows "Eliminate 2 — 25 coins" before any hint is bought, advances to "First letter — 75 coins", then "Reveal answer — 150 coins".
2. CheckMate hint area still shows its own two-tier grid ("Piece 25 coins" / "Move 75 coins") with no change.

### Files touched

- `src/components/games/HintButton.tsx` — relabel the three hint tiers.

No DB, schema, or other component changes.

