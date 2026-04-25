Plan to redesign `src/routes/_authed/results.tsx` only:

1. Update the hero/header area
   - Keep the `Round Complete` label.
   - Keep the trophy icon, but remove its background card/glow wrapper so it appears cleaner.
   - Make the first major headline the puzzles-solved stat:
     - `No puzzles solved` when `puzzlesSolved === 0`
     - `1 puzzle solved` when `puzzlesSolved === 1`
     - `${puzzlesSolved} puzzles solved` otherwise

2. Adjust ticket earning display
   - Remove the current zero-ticket headline/subtext.
   - Show a single ticket line only when `entries > 0`, e.g. `+2 tickets earned` / `+1 ticket earned`.
   - Keep existing breakdown chips/text if present, but place them beneath the ticket-earned line.

3. Rework weekly progress as the motivating anchor
   - Replace the current label layout with a stronger line like: `39 of 50 tickets this week`.
   - Make the number/label larger and bolder than the current small uppercase treatment.
   - Keep the same progress calculation and `Progress` component.
   - Show the nudge only when `remainder > 0`, with copy: `${need} more puzzle(s) next round would earn another ticket`.
   - Omit the nudge entirely when `remainder === 0`.

4. Keep streak pill but reposition it
   - Leave streak pill logic/copy unchanged.
   - Place it directly under the weekly progress bar/nudge area.

5. Reduce secondary CTA weight
   - Keep `Play again` as the full green primary button.
   - Change `Back to Home` from bordered/background button styling to a plain text link.

Technical scope:
- Only edit JSX layout and player-facing copy in `src/routes/_authed/results.tsx`.
- No server function, data fetching, routing, search params, calculations, or game logic changes.