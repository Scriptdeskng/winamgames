

## Improve XP-to-next-rank copy

Current: `"140 XP to Recruit"` — terse, reads like a debug label. Could be warmer, clearer, and more motivating without getting verbose.

### Options considered

1. `"140 XP until Recruit"` — minor, still flat.
2. `"Earn 140 XP to reach Recruit"` — action-led, clearer intent. Slightly longer but still one line on mobile.
3. `"140 XP to unlock Recruit"` — game-y, implies reward.
4. `"Next: Recruit · 140 XP to go"` — two-part, scannable.

### Recommendation

Go with **option 3**: `"140 XP to unlock Recruit"`.

Why:
- "Unlock" frames rank-up as a reward (matches the gamified tone of the app — coins, streaks, draws).
- Still concise — fits on one line under the progress bar at mobile widths.
- "to" + verb + noun reads more naturally than "to Recruit" alone.
- Max-rank state stays as `"Maximum rank reached"` (already good).

### Change

In `src/routes/_authed/profile.tsx` → `IdentityHero`, the muted line under the XP bar:

```tsx
// before
`${(nextConfig!.minXp - xp).toLocaleString()} XP to ${nextConfig!.label}`

// after
`${(nextConfig!.minXp - xp).toLocaleString()} XP to unlock ${nextConfig!.label}`
```

One-line change, no other files affected.

