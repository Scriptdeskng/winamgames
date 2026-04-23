

## CheckMate — committed move display, feedback badges, hint arrow, sounds, drop tier 3 (CheckMate only)

Same plan as previously approved, with one scoping clarification: tier 3 removal is **CheckMate-only**. WisdomDrop keeps all three tiers untouched.

### 1. `src/utils/sound.ts` (new)

Lazy-loaded Lichess audio clips with cached `HTMLAudioElement` instances at volume 0.6. Exports: `playMove`, `playCapture`, `playCorrect`, `playIncorrect`. Each `.play()` is wrapped with `.catch(() => {})` so autoplay-block rejection is silent. SSR-safe via `typeof window !== "undefined"` guard.

### 2. `src/components/games/ChessBoard.tsx`

**New props**
- `committedMove?: { from: string; to: string } | null` — player's submitted move; piece displays on `to`, `from` shown empty.
- `arrowMove?: { from: string; to: string } | null` — drawn arrow overlay for tier-2 hint.
- `feedback?: "correct" | "incorrect" | null` — drives badge rendering on `committedMove.to`.

**Display board logic** — extend the existing `displayBoard` mapping. When `committedMove` is set, read piece on `from` from the original board, blank `from`, place that piece on `to`. This keeps the player's move visible during feedback even after `animatingMove` clears at 800ms.

**Feedback badge** — inside each square, when `feedback && committedMove?.to === square`, render an absolutely positioned badge top-right (`absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center z-20`):
- correct: `bg-green-500 text-white` + `<Check className="w-3 h-3" strokeWidth={3} />`
- incorrect: `bg-red-500 text-white` + `<X className="w-3 h-3" strokeWidth={3} />`

**Arrow overlay (tier-2 hint)** — absolutely positioned `<svg>` over the grid (`pointer-events-none absolute inset-0`). Only rendered when `arrowMove && squareSize > 0`:
- Compute centre pixels of `from` and `to`.
- Shorten the line endpoint by ~half the arrowhead length so the line doesn't poke through the tip.
- `<line>` with `stroke="rgba(0,200,100,0.85)"`, `strokeWidth={12}`, `strokeLinecap="round"`.
- `<polygon>` arrowhead at `to`, oriented via `Math.atan2(dy, dx)`, sized ~`squareSize * 0.4`.
- Subtle drop-shadow for legibility.

**Square highlight fix** — drop `hintTo` highlight (tier-2 destination) since the arrow replaces it. Keep `hintFrom` highlight for tier-1 (piece origin).

### 3. `src/routes/_authed/checkmate.tsx`

**State**
```ts
const [committedMove, setCommittedMove] = useState<{ from: string; to: string } | null>(null);
```

**Submit flow** — wrap `handleSquareClick` so when both squares are chosen:
- Parse destination FEN piece BEFORE submission to detect a capture (opponent piece on `to`).
- `setCommittedMove({ from: selectedSquare, to: square })`.
- Call `playCapture()` if capture, else `playMove()`.
- Then `session.submit(JSON.stringify(...))`.

**Clear committed move on puzzle change** — extend the existing `useEffect(() => setSelectedSquare(null), [puzzleFen])` to also `setCommittedMove(null)`. Fires when next puzzle's FEN arrives, exactly when badge + committed display should clear.

**Feedback sound effect**
```ts
useEffect(() => {
  if (session.feedback === "correct") playCorrect();
  else if (session.feedback === "incorrect") playIncorrect();
}, [session.feedback]);
```

**ChessBoard wiring**
```tsx
<ChessBoard
  fen={puzzle.fen}
  selectedSquare={selectedSquare}
  onSquareClick={handleSquareClick}
  lastMove={lastMove}
  legalMoves={legalMoves}
  hintFrom={session.hintData?.from}
  hintTo={undefined}
  committedMove={committedMove}
  feedback={session.feedback}
  arrowMove={
    session.currentHintTier >= 2 && session.hintData?.from && session.hintData?.destination
      ? { from: session.hintData.from, to: session.hintData.destination }
      : null
  }
  disabled={session.loading || session.gameOver || !!session.feedback}
/>
```

**Hint UI — drop tier 3 (CheckMate only)**
- `HINT_TIERS` becomes two entries: `{ tier: 1, label: "Piece", cost: 25 }`, `{ tier: 2, label: "Move", cost: 75 }`.
- Grid changes `grid-cols-3` → `grid-cols-2`.
- Hint chip: tier-1 shows "Move the **{piece}**". Tier-2 shows no extra text — the arrow communicates it. Remove the tier-3 branch entirely.

### 4. `src/utils/game.functions.ts` — game-type-scoped tier change

**`useHint` validator** — keep `tier: z.number().min(1).max(3)` at the schema level so WisdomDrop tier-3 still validates. Inside the handler, after looking up the session's `gameType`, enforce a CheckMate-specific cap:

```ts
if (sessionRow.game_type === "checkmate" && data.tier > 2) {
  return { success: false, error: "Tier 3 hint not available for CheckMate" };
}
```

**Tier-3 branch removal** — guard the existing tier-3 hint computation so it only runs when `gameType === "wisdomdrop"`. The CheckMate tier-3 branch (which previously revealed `from` + `to` coordinates) is removed/skipped.

**Costs map** — keep `{ 1: 25, 2: 75, 3: 150 }` intact. CheckMate never reaches tier 3 due to the guard above; WisdomDrop continues to charge 150 for tier 3 as today.

WisdomDrop UI (`src/routes/_authed/wisdomdrop.tsx`) and its `HintButton` usage remain completely untouched.

### Technical notes

- **Why merge committed move into `displayBoard`**: the existing slide-overlay already mutates `displayBoard` to blank the source. Reusing that mechanism for the committed move keeps a single source of truth and avoids two systems racing when feedback arrives mid-slide.
- **Capture detection timing**: read FEN piece on `to` from `puzzle.fen` (pre-move position) before calling `session.submit`. Opponent piece on `to` ⇒ capture.
- **Arrow geometry**: square centre is `(fileIdx + 0.5) * squareSize` for x, `(7 - rankIdx + 0.5) * squareSize` for y (rank 8 = row 0 from white's perspective). Arrowhead orientation uses `Math.atan2(dy, dx)`.
- **SSR safety for sounds**: `getSound` checks `typeof window` and returns a no-op stub with `.play()` returning a resolved promise off-window.
- **Game-type guard placement**: applied in the `useHint` server-fn handler (not just the validator) so the CheckMate two-tier UI cap is enforced server-side as well — prevents a crafted client request from buying tier 3 on a CheckMate session.

### Files touched
- `src/utils/sound.ts` — new file, four exported play functions, lazy `Audio` cache, SSR-safe.
- `src/components/games/ChessBoard.tsx` — `committedMove`/`arrowMove`/`feedback` props, displayBoard merge, feedback badge per square, SVG arrow overlay, drop hint-to highlight.
- `src/routes/_authed/checkmate.tsx` — `committedMove` state, capture detection + sound on submit, feedback sound effect, ChessBoard prop wiring, two-tier hint grid + simplified hint chip.
- `src/utils/game.functions.ts` — CheckMate-scoped tier-3 guard in `useHint` handler; WisdomDrop tier-3 logic and validator schema unchanged.

No DB, schema, or dependency changes. WisdomDrop UI and hint behaviour unchanged.

