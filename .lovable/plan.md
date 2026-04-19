

## Remove redundant bottom CTA on Winners page

The Winners page already has a strong hero card at the top with an Award icon, headline, subhead, and "Play Now" CTA linking to `/`. The bottom card ("Keep playing, keep winning" → "Back to Games") repeats the same intent — push users back to games — at a point where they've just finished scrolling through draw history.

### Change

In `src/routes/_authed/winners.tsx`, delete the bottom CTA block (the final `<div className="rounded-2xl bg-surface-1 border border-border p-4 text-center space-y-2">...</div>` containing "Keep playing, keep winning" and the "Back to Games" link).

The page now ends on the last `DrawWeekCard`, which feels natural — the user has reached the end of the winners list and the persistent app navigation (TopBar back button, bottom nav) handles their next move.

### Why not keep it

- Duplicates the hero CTA's "go play" message with weaker copy.
- Adds vertical scroll for no new info.
- The TopBar back arrow + global nav already provide an exit path.

### Out of scope

- Hero card at the top (stays as-is).
- Draw week cards.
- Any other page.

### File touched

- `src/routes/_authed/winners.tsx` — remove the trailing CTA block (~last 12 lines of the JSX return).

