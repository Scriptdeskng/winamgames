

## Free up header space on game pages

### Problem

On `/wisdomdrop` (and `/checkmate`) the header packs three things into a tight row on a 390px viewport:
- Exit button (left)
- Centered title stack: `WisdomDrop` + `9 / 10`
- Timer + lives (right)

The game name in the center column squeezes the puzzle count and competes with the timer/lives on the right. The player already knows which game they're in — they just tapped "Start Game" 30 seconds ago. The title is decorative weight, not informational.

### Proposal

Drop the game-name line from `GameHeader` entirely. Promote the puzzle counter to the center role with a slightly larger, more legible treatment — it's the only piece of in-session info that actually changes and matters.

**Before** (center column, two stacked lines):
```
WisdomDrop
9 / 10
```

**After** (center column, single line):
```
9 / 10
```

Treatment: `text-sm font-semibold tabular-nums text-foreground` with the slash slightly muted (`text-muted-foreground`) for a subtle "current / total" visual rhythm — e.g. `9` strong, `/ 10` muted. This makes "where am I" instantly scannable without crowding the timer/lives.

### Changes

- **`src/components/games/GameHeader.tsx`**:
  - Remove the `<span>` rendering `{title}`.
  - Keep the `title` prop in the interface (still used for the document title / future use) but don't render it.
  - Restyle the counter: `9 / 10` becomes the center element with `text-sm font-semibold tabular-nums`, slash dimmed.
- No changes to `wisdomdrop.tsx`, `checkmate.tsx`, or any other consumer — they keep passing `title="WisdomDrop"` / `title="CheckMate"` and it just goes unused visually.

### Why not move the title elsewhere?

- TopBar isn't shown on game routes (game routes use `GameHeader` instead).
- Adding it back as a small eyebrow above the counter re-creates the same crowding.
- The session is short (≤10 puzzles, a few minutes) — the player won't forget what they're playing.

### Out of scope

- Exit button, timer, lives display — unchanged.
- Header background, border, padding — unchanged.
- The standalone landing screen (before `start()`) — unchanged; the big "WisdomDrop" hero stays there.

