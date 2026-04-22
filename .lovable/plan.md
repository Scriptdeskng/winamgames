

## Fix CheckMate submission format bug

### Pre-flight checks
- **chess.js**: not installed (grep on `package.json` + `package-lock.json` returned no results). Need to add it.
- **cm-003 / cm-008 share `c1g5`**: verified against both FENs — the dark-squared bishop is on c1 in both positions and the c1→g5 diagonal is clear in both. The mappings are **correct**; the duplicate is a content-design issue (two near-identical positions in the pool), not a translation error. Flagged below, not changed.

### 1. Add dependency
Add `chess.js` (`^1.0.0-beta.8` or latest stable) to `package.json`.

### 2. `src/data/checkmate-puzzles.ts` — convert all 20 `solutionMove` to UCI

| ID | Old | New |   | ID | Old | New |
|----|-----|-----|---|----|-----|-----|
| cm-001 | Qxf7 | h5f7 | | cm-011 | e5 | e4e5 |
| cm-002 | Qh4 | d8h4 | | cm-012 | e3 | e2e3 |
| cm-003 | Bg5 | c1g5 | | cm-013 | O-O | e1g1 |
| cm-004 | Bxf7 | c4f7 | | cm-014 | Be3 | c1e3 |
| cm-005 | Ng5 | f3g5 | | cm-015 | cxd5 | c4d5 |
| cm-006 | Nxf7 | e5f7 | | cm-016 | Be3 | c1e3 |
| cm-007 | Be2 | f1e2 | | cm-017 | e3 | e2e3 |
| cm-008 | Bg5 | c1g5 | | cm-018 | Nf3 | g1f3 |
| cm-009 | O-O | e1g1 | | cm-019 | Bd3 | f1d3 |
| cm-010 | d4 | d2d4 | | cm-020 | e3 | e2e3 |

Add comment: `// solutionMove uses UCI format: <from-square><to-square>, e.g. "h5f7"`.

### 3. `src/utils/game.functions.ts` — `submitMove` (lines 372–376)
Add `import { Chess } from "chess.js";` at top. Replace the equality check:

```ts
if (isCheckmate) {
  const puzzle = CHECKMATE_PUZZLES.find((p) => p.id === data.puzzleId);
  if (puzzle) {
    try {
      const { from, to } = JSON.parse(data.answer) as { from: string; to: string };
      const chess = new Chess(puzzle.fen);
      const move = chess.move({ from, to, promotion: "q" });
      isCorrect = move !== null && `${from}${to}` === puzzle.solutionMove;
    } catch {
      isCorrect = false;
    }
  }
}
```

### 4. `src/utils/game.functions.ts` — `useHint` tier 3 (line 489)
```ts
if (data.tier >= 3) {
  hintData.from = puzzle.solutionMove.slice(0, 2);
  hintData.to   = puzzle.solutionMove.slice(2, 4);
}
```
Tiers 1 (`piece`) and 2 (`destination`) unchanged.

### 5. `src/routes/_authed/checkmate.tsx` — `handleSquareClick`
```tsx
if (selectedSquare) {
  session.submit(JSON.stringify({ from: selectedSquare, to: square }));
  setSelectedSquare(null);
} else {
  setSelectedSquare(square);
}
```
Update hint display to render `from → to` for tier 3, and pass hint coords to the board:
```tsx
<ChessBoard
  fen={puzzle.fen}
  selectedSquare={selectedSquare}
  onSquareClick={handleSquareClick}
  hintFrom={session.hintData?.from}
  hintTo={session.hintData?.to ?? session.hintData?.destination}
  disabled={session.loading || session.gameOver || !!session.feedback}
/>
```
Fallback to `destination` so tier-2 hints also light up the target square.

### 6. `src/components/games/ChessBoard.tsx` — hint highlighting
Add optional props `hintFrom?: string | null` and `hintTo?: string | null`. In the square render:
```tsx
const isHint = square === hintFrom || square === hintTo;
// ...
isHint && !isSelected && "ring-2 ring-coin/70 ring-inset bg-coin/15",
```

### Why this is safe
- chess.js rejects illegal `{from,to}` pairs before equality check — random clicks can't accidentally match.
- Castling works: `{from:"e1",to:"g1"}` → chess.js accepts as castling → UCI matches `e1g1`.
- UCI is unambiguous (no SAN disambiguation edge cases).
- No schema or DB changes.

### Out of scope (flagged)
- **cm-003 / cm-008 share `c1g5` solution** — both FENs are legitimately solved by the same bishop move; the positions are near-duplicates (cm-008 has both sides castled + Black rook on e8). Content-design issue worth reviewing in a future puzzle-curation pass; not a translation bug.
- **Promotion** hardcoded to queen (`promotion:"q"`) — none of the 20 puzzles need underpromotion.
- **Client-side legality preview** (greying illegal moves) — server stays the authority; UI polish for later.

### Files touched
- `package.json` — add `chess.js`
- `src/data/checkmate-puzzles.ts` — 20 UCI conversions + format comment
- `src/utils/game.functions.ts` — chess.js validation in `submitMove`; tier-3 hint shape in `useHint`
- `src/routes/_authed/checkmate.tsx` — submit `{from,to}` JSON; render new hint shape; pass hint props to board
- `src/components/games/ChessBoard.tsx` — `hintFrom`/`hintTo` props with coin-tinted ring

