

## CheckMate — last-move flash + legal move dots

### 1. `src/components/games/ChessBoard.tsx`

**New prop**: `legalMoves?: Set<string>`.

**Legal move indicators** (rendered inside each square button, after the piece `<img>`):
- Empty square in `legalMoves`: small filled dot — `pointer-events-none absolute w-[28%] h-[28%] rounded-full bg-black/30`.
- Square with a piece in `legalMoves` (capture target): ring overlay — `pointer-events-none absolute inset-[6%] rounded-full border-[3px] border-black/30` (no fill so the piece shows through).
- Both use `pointer-events-none` so taps still hit the underlying button.

**Last-move pulse on mount/change**: animate the green tint already applied to `lastMove.from` / `lastMove.to`. Implementation:
- Keep a `useRef` of the previous `lastMove` key (`${from}-${to}`). When it changes, set a local `pulseKey` state to force-remount a `<span>` overlay on those two squares.
- Overlay span on last-move squares: `absolute inset-0 pointer-events-none animate-checkmate-lastmove-pulse` keyed by `pulseKey` so it re-runs each time a new puzzle loads.
- Inline `<style>` block at the top of the component (or scoped via a `<style jsx>`-like inline tag) defining:
  ```css
  @keyframes checkmate-lastmove-pulse {
    0%   { background-color: rgba(255, 235, 59, 0.0); }
    30%  { background-color: rgba(255, 235, 59, 0.75); }
    100% { background-color: rgba(155, 199, 100, 0.6); }
  }
  .animate-checkmate-lastmove-pulse {
    animation: checkmate-lastmove-pulse 600ms ease-out 1;
  }
  ```
  Single 600ms run, then settles into the existing green last-move tint.

### 2. `src/routes/_authed/checkmate.tsx`

**Track previous puzzle FEN to derive last move**:
- `const prevFenRef = useRef<string | null>(null);`
- `const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);`
- `useEffect` on `puzzle?.fen`: compare current FEN board layout against `prevFenRef.current`. The two squares whose contents changed are `from` (now empty / different) and `to` (now holds the moved piece). Reuse `parseFen`-equivalent logic locally (small helper). Store result in `lastMove`. Clear `selectedSquare`. Update `prevFenRef` to current FEN.
- Edge case: first puzzle of the round has no previous FEN → `setLastMove(null)`. No flash on round start; flash kicks in from puzzle 2 onward. (Acceptable per the prompt's "simpler version".)

**Compute legal moves**:
```ts
import { Chess } from "chess.js";

const legalMoves = useMemo(() => {
  if (!selectedSquare || !puzzle?.fen) return new Set<string>();
  try {
    const chess = new Chess(puzzle.fen);
    return new Set(
      chess.moves({ square: selectedSquare as any, verbose: true }).map((m: any) => m.to)
    );
  } catch {
    return new Set<string>();
  }
}, [selectedSquare, puzzle?.fen]);
```

**Pass to ChessBoard**: add `lastMove={lastMove}` and `legalMoves={legalMoves}` to the existing `<ChessBoard …>` element.

### Technical notes

- FEN diff is purely client-side (no server changes) — `parseFen` returns 8x8 piece arrays; iterate both, collect coords where they differ. Castling/en-passant edge cases (3–4 changed squares) → take the two squares whose changes most plausibly represent the move (heuristic: square that became empty = `from`, square whose piece is new/changed = `to`). For the simplified MVP, just take the first two differing coords; misclassification only affects a cosmetic flash, never gameplay.
- `legalMoves` recomputes only when `selectedSquare` or `puzzle.fen` changes — cheap, chess.js move generation on a single position is sub-millisecond.
- The capture-ring style differs from the empty-square dot to match the universal chess UI convention (Lichess/Chess.com).
- No DB, schema, or dependency changes. `chess.js@^1.4.0` already installed.

### Files touched
- `src/components/games/ChessBoard.tsx` — `legalMoves` prop, dot/ring overlays, mount-pulse animation on last-move squares, scoped keyframe injection.
- `src/routes/_authed/checkmate.tsx` — derive `lastMove` from prev FEN diff, compute `legalMoves` via chess.js, pass both to `ChessBoard`.

