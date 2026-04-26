I’ll make a focused light-mode contrast fix for `src/routes/_authed/leaderboard.tsx` and `src/styles.css` with no dark-mode changes.

Plan:
1. Update the podium card styling in `leaderboard.tsx`
   - Add stable podium background class names for 1st, 2nd, and 3rd place cards while keeping their existing dark-mode gradient classes unchanged.
   - Ensure the rank badge pills use dark, readable text in light mode via light-only CSS overrides.

2. Add light-mode-only CSS overrides in `src/styles.css`
   - `html.light .leaderboard-podium-first` background: `#FFF3CC`
   - `html.light .leaderboard-podium-second` background: `#D4EDE0`
   - `html.light .leaderboard-podium-third` background: `#FFE8D6`
   - Add matching light-mode rank-pill text overrides so `1ST`, `2ND`, and `3RD` remain readable.

3. Update “Your Standing” progress bar track
   - Change the progress track from the current border-opacity background to `bg-black/10` so it is visible on light cards.
   - Leave the progress fill unchanged.

4. Verify scope
   - Confirm changes are limited to `leaderboard.tsx` and `styles.css`.
   - Run a build/typecheck if available after implementation.