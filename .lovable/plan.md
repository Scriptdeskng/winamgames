

## Pin "Your standing" card to the bottom of the viewport

Right now the player's "Your standing" card sits at the end of the scrolled content, so on a long list (especially the Today tab with up to 50 players) it scrolls out of view. The user always wants to see where they stand.

### The change

Make `YourStandingCard` a sticky bottom dock on both tabs:

- Position: `sticky bottom-0` inside the page scroll container, with a small bottom inset and horizontal padding so it floats above the list rather than sitting flush.
- Backdrop: `bg-surface-1/85 backdrop-blur-md` plus the existing emerald border + `shadow-glow` so it visually separates from list rows scrolling underneath.
- Z-index: above list content but below the `TopBar`.
- Bottom padding on the page content (`pb-32` instead of `pb-8`) so the last list row is never hidden behind the dock.
- Keep the same internal layout (rank, score, gap-to-next, progress bar, safety message) — only the positioning changes.

### Tab-specific behaviour

- **This week tab**: dock pinned to bottom; chase list scrolls behind it.
- **Today tab**: remove the inner `max-h-[60vh] overflow-y-auto` on `ChaseList` — let the page scroll naturally so the sticky dock works correctly (nested scroll containers break `position: sticky`).

### Edge cases

- If the player has no rank yet (empty leaderboard / hasn't played), don't render the dock — the existing `EmptyState` already covers that path.
- On the loading spinner state, no dock (unchanged).
- Reduced motion: no animation changes needed; sticky positioning is static.

### Files touched

- `src/routes/_authed/leaderboard.tsx` — wrap `YourStandingCard` render in a `sticky bottom-3 z-30` container, add backdrop styles, bump page `pb-8` → `pb-32`, drop the inner scroll cap on the Today chase list.

No backend changes. No new dependencies.

