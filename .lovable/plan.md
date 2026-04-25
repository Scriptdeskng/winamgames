Plan for `src/routes/_authed/results.tsx` only:

1. Update nudge copy
   - Change the generated nudge text to:
     `${need} more puzzle${need === 1 ? "" : "s"} this round would have earned another ticket`
   - Keep the existing `remainder > 0` condition and calculation unchanged.

2. Reduce empty vertical gap before CTAs
   - Adjust the results page flex layout so the hero, weekly progress/streak area, and CTA section are distributed more evenly vertically.
   - Keep “Play again” as the full green button and “Back to Home” as a plain text link.
   - Avoid changing any data fetching, ticket logic, route behavior, or other files.

Technical scope:
- One file only: `src/routes/_authed/results.tsx`
- JSX/classes/copy only
- No server functions, backend changes, or logic changes beyond the text string.