

## CheckMate — four polish fixes (approved, ready to implement)

### 1. Tier 1 hint highlights piece square — `src/utils/game.functions.ts`

In the `useHint` checkmate branch, set `hintData.from` at tier 1 so the board highlights the piece's origin square:

```ts
if (puzzle) {
  if (data.tier >= 1) {
    hintData.piece = puzzle.hint_piece ?? "";
    hintData.from = puzzle.solution_move.slice(0, 2);
  }
  if (data.tier >= 2) {
    hintData.destination = puzzle.hint_destination ?? "";
  }
}
```

### 2. Tier 2 button unlock — verify only

`useGameSession.requestHint` already sets `currentHintTier: tier` on success, and the gate `tier > session.currentHintTier + 1` already enables tier 2 immediately after tier 1 resolves. No code change needed; fix #1 is what makes tier 1 feel responsive.

### 3. Opponent premove sound — `src/routes/_authed/checkmate.tsx`

Add an effect next to the existing feedback-sound effect:

```ts
useEffect(() => {
  if (!lastMove) return;
  playMove();
}, [lastMove]);
```

`playMove` is already imported.

### 4. Illegal move client-side gate — `src/routes/_authed/checkmate.tsx`

Update `handleSquareClick` to deselect silently when the tapped destination is not in `legalMoves` — no committed move, no sound, no `session.submit`, no life lost. Add `legalMoves` to the `useCallback` deps.

```ts
const handleSquareClick = useCallback((square: string) => {
  if (!session.currentPuzzle || session.loading || session.gameOver) return;

  if (selectedSquare) {
    if (square === selectedSquare) {
      setSelectedSquare(null);
      return;
    }
    if (!legalMoves.has(square)) {
      setSelectedSquare(null);
      return;
    }
    const fen = (session.currentPuzzle as { fen?: string }).fen;
    let isCapture = false;
    if (fen) {
      try {
        const chess = new Chess(fen);
        const target = chess.get(square as Square);
        isCapture = !!target;
      } catch {
        isCapture = false;
      }
    }
    setCommittedMove({ from: selectedSquare, to: square });
    if (isCapture) playCapture();
    else playMove();
    session.submit(JSON.stringify({ from: selectedSquare, to: square }));
    setSelectedSquare(null);
  } else {
    setSelectedSquare(square);
  }
}, [selectedSquare, session, legalMoves]);
```

Side effect (intended): tapping a square that holds your own piece while another is selected will deselect rather than submit an illegal move. The player can then tap that piece to select it.

### Post-implementation verification (report all five)

1. Buy tier 1 hint → piece square highlights yellow, chip reads "Move the [piece]".
2. After tier 1 → tier 2 Move button is active (not greyed out).
3. New puzzle loads → move sound plays during opponent premove animation.
4. Select piece → tap illegal square → piece deselects, no move, no life lost, no server call.
5. Select piece → tap own piece → deselects cleanly.

### Files touched

- `src/utils/game.functions.ts` — tier 1 sets `hintData.from` in checkmate branch.
- `src/routes/_authed/checkmate.tsx` — opponent-premove sound effect; `legalMoves` gate in `handleSquareClick`.

No DB, schema, or dependency changes. No change to `useGameSession.ts`.

