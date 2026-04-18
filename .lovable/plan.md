

## Home page cleanup — keep streak strip, drop dynamic tip

Confirmed: navigation is the hamburger `MenuSheet` in the TopBar, not a bottom nav. So the Play Now grid is the only on-screen entry to games and stays.

### Change

Remove only `DynamicTip` from `src/routes/_authed/index.tsx`:
- Delete the `<DynamicTip ... />` JSX usage at the bottom of `HomePage`.
- Delete the `DynamicTip` component definition.
- Delete the `ONBOARDING_TIPS` constant and `RANK_ORDER` constant (only used by the tip).
- Drop now-unused imports: `Lightbulb`, `RANK_CONFIG` (still used by `StreakRankStrip` — keep it), recheck before removing.
- Drop now-unused destructured values from `data`: `totalSessions`, `bestSession`, `xpTotal`.

Keep: `StreakRankStrip` (visual separator + identity touch between hero and banners), everything else unchanged.

### Resulting home flow

```
TopBar
DrawHeroCard
StreakRankStrip   ← kept as separator
BannerStack
MissionsSection
Play Now grid
```

### Files touched

- `src/routes/_authed/index.tsx` — single-file cleanup, ~40 lines removed, no behavior change elsewhere.

