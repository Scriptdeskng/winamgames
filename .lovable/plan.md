

# Remove All Glassmorphism

## Summary
Replace every `bg-glass` with `bg-surface-1`, replace every `border-glass-border` with `border-border`, and remove the glass-related CSS variables and utilities from `styles.css`.

## Files to change (17 files)

### `src/styles.css`
- Remove `--glass` and `--glass-border` CSS variables from `:root`
- Remove `--color-glass` and `--color-glass-border` from `@theme inline`
- Remove the `.bg-glass` utility class entirely

### Component files — find-and-replace `border-glass-border` → `border-border` and `bg-glass` → `bg-surface-1`:
1. `src/components/layout/TopBar.tsx` (2 occurrences)
2. `src/components/layout/MenuSheet.tsx` (1)
3. `src/components/games/GameHeader.tsx` (2)
4. `src/components/games/HintButton.tsx` (2)
5. `src/components/games/ChessBoard.tsx` (check for usage)
6. `src/components/profile/RankBadge.tsx` (check for usage)
7. `src/routes/login.tsx` (1)
8. `src/routes/verify.tsx` (1)
9. `src/routes/onboarding.tsx` (check for usage)
10. `src/routes/renew.tsx` (2)
11. `src/routes/_authed/index.tsx` (multiple)
12. `src/routes/_authed/profile.tsx` (5 — includes `bg-glass` → `bg-surface-1`)
13. `src/routes/_authed/entries.tsx` (2 — includes `bg-glass` → `bg-surface-1`)
14. `src/routes/_authed/leaderboard.tsx` (check for usage)
15. `src/routes/_authed/winners.tsx` (1)
16. `src/routes/_authed/results.tsx` (1)
17. `src/routes/_authed/wisdomdrop.tsx` (multiple)
18. `src/routes/_authed/checkmate.tsx` (check for usage)

### Mechanical change
Every instance of `glass-border` in class strings becomes `border` (the standard theme token). Every `bg-glass` becomes `bg-surface-1`. The backdrop-blur utility in `styles.css` is deleted. The CSS variables `--glass` and `--glass-border` are removed.

