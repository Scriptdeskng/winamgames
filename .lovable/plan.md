I’ll make only the requested light-mode contrast fixes for the leaderboard podium cards.

Plan:
1. Update `src/routes/_authed/leaderboard.tsx`
   - Keep player names using `text-foreground`.
   - Change the podium puzzle count row to use `text-foreground` so the numbers are clearly readable on light tinted cards.
   - Add a stable class to the podium avatar circles so light-mode CSS can override their transparent gradient backgrounds.
   - Keep existing dark-mode podium gradients and styling intact.

2. Update `src/styles.css`
   - Replace the current shared light-mode badge text override with explicit colors:
     - 1ST: `#92610A`
     - 2ND: `#1A5C3A`
     - 3RD: `#7A3A1A`
   - Add a light-mode-only avatar circle override using a visible token-based surface (`var(--surface-2)` / muted-style background) for podium avatar circles.
   - Leave all overrides scoped under `html.light` so dark mode is unchanged.

3. Verify
   - Confirm the scope is limited to `leaderboard.tsx` and `styles.css`.
   - Run the build after implementation.