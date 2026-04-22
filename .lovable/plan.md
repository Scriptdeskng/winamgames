

## Fix CheckMate piece deselection

### Change

In `src/routes/_authed/checkmate.tsx`, update `handleSquareClick` (lines 71–79) so tapping the already-selected square deselects it instead of submitting a no-op move that costs a life.

```ts
const handleSquareClick = useCallback((square: string) => {
  if (!session.currentPuzzle || session.loading || session.gameOver) return;

  if (selectedSquare) {
    if (square === selectedSquare) {
      setSelectedSquare(null);
      return;
    }
    session.submit(JSON.stringify({ from: selectedSquare, to: square }));
    setSelectedSquare(null);
  } else {
    setSelectedSquare(square);
  }
}, [selectedSquare, session]);
```

### Why
- Current code always submits when a square is already selected, so re-tapping the same piece sends `{from: "e2", to: "e2"}` — chess.js rejects it, server marks it wrong, player loses a life.
- Early-return on the same-square case restores the standard chess UX (tap to select, tap again to cancel).

### Files touched
- `src/routes/_authed/checkmate.tsx` — `handleSquareClick` only

No DB, schema, or dependency changes.

