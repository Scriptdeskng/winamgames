

## CheckMate — opponent piece slide animation

When a new puzzle loads, animate the opponent's moved piece sliding from `from` → `to` over ~400ms before the board settles. Reuses the existing `lastMove` props and `pulseKey` retrigger mechanism.

### 1. `src/components/games/ChessBoard.tsx`

**New state + ref**
- `gridRef = useRef<HTMLDivElement>(null)` — attached to the 8-col grid div, used to measure square size at animation time.
- `animatingMove` state: `{ piece: string; fromSquare: string; toSquare: string } | null`.

**Trigger effect** — runs whenever `pulseKey` changes (already increments on every new last-move):
- Read the current FEN board, look up the piece now sitting on `lastMove.to` (that's the opponent's piece post-move).
- Set `animatingMove` to `{ piece, fromSquare: lastMove.from, toSquare: lastMove.to }`.
- `setTimeout(450ms)` clears it. Cleanup on unmount.

**Helper** — `getSquareOffset(from, to)` returns `{ dx, dy }` in square units (file/rank deltas). Multiplied by measured square size at render time.

**Display board** — while `animatingMove` is set, the `from` square in the static render is forced to `null` so the piece doesn't appear in two places. Build `displayBoard` from `board` with that one square cleared, render squares from `displayBoard` instead of `board`.

**Animated overlay** — absolutely positioned `<img>` of the moved piece, placed inside the board wrapper after the grid:
- Wrapper div needs `relative` (already is via the existing structure — confirm).
- Overlay positioned at the `to` square's pixel coords (`left = toFile * squareSize`, `top = toRank * squareSize`), sized `squareSize × squareSize`, with `pointer-events-none`.
- Inline CSS vars `--slide-x: ${dx * squareSize}px` and `--slide-y: ${dy * squareSize}px` feed the keyframe.
- Class `animate-chess-piece-slide` runs the 400ms keyframe.
- Conditionally rendered only when `animatingMove && gridRef.current` (avoids first-paint with `squareSize=0`). Use a single `requestAnimationFrame` or render fallback `squareSize = gridRef.current?.offsetWidth / 8 ?? 0` and skip rendering if 0.

**Square-size measurement nuance** — `gridRef.current` is null on the first render after `animatingMove` is set. Two-pass fix: in the trigger effect, set `animatingMove` only after `gridRef.current` is available (which it is, since the effect runs post-mount). Read `offsetWidth` inside the render lambda each time — fresh on every render.

### 2. `src/styles.css`

Add under `@layer utilities`, alongside the existing `checkmate-lastmove-pulse`:

```css
@keyframes chess-piece-slide {
  0% {
    transform: translate(var(--slide-x), var(--slide-y));
    opacity: 0.85;
  }
  100% {
    transform: translate(0, 0);
    opacity: 0;
  }
}

.animate-chess-piece-slide {
  animation: chess-piece-slide 400ms ease-out forwards;
}
```

Piece starts at the `from` square (translated by negative delta) and slides to its natural `to`-square position, fading out by the end because the static board already shows it sitting on `to`.

### Technical notes

- **Why 400ms slide + 450ms clear timer**: 50ms buffer prevents flicker between overlay disappearing and the static piece re-appearing on the `from` square (which is forced empty during animation).
- **Promotion / en-passant / castling**: ignored. The overlay just slides the piece on `to`; castling rooks won't animate (only the king visually moves), en-passant captured pawn won't show — acceptable because Lichess puzzles' opponent moves are overwhelmingly normal moves and this is a cosmetic flourish.
- **Reduced motion**: not adding a `prefers-reduced-motion` guard in this pass — existing pulse animation also doesn't have one. Can add later if needed.
- **No layout shift**: overlay is absolutely positioned; grid and squares unchanged.

### Files touched
- `src/components/games/ChessBoard.tsx` — `gridRef`, `animatingMove` state + trigger effect, `getSquareOffset` helper, `displayBoard` swap, absolutely positioned animated overlay.
- `src/styles.css` — `chess-piece-slide` keyframe + `.animate-chess-piece-slide` utility.

No DB, schema, or dependency changes.

