

## Wire opponent's last move into CheckMate board

The `winam_checkmate_puzzles` table already has `opponent_from` / `opponent_to` columns. Plumb them through the server response and use them directly on the client instead of guessing via FEN diffing.

### 1. `src/utils/game.functions.ts`

**`startSession` — checkmate branch**

Update the post-pick full-data fetch to include the two new columns, then surface them in `clientData`:

```ts
const { data: cmFull } = await supabaseAdmin
  .from("winam_checkmate_puzzles")
  .select("id, fen, theme, opponent_from, opponent_to")
  .in("id", cmPicked.map((p) => p.id));

// when building puzzleList:
{
  id: p.id,
  clientData: {
    fen: p.fen,
    theme: p.theme,
    opponentFrom: p.opponent_from,
    opponentTo: p.opponent_to,
  },
}
```

`firstPuzzle` already spreads `clientData`, so `opponentFrom` / `opponentTo` flow to the client without extra changes.

**`submitMove` — checkmate `nextPuzzle` branch**

Extend the next-puzzle lookup to include the same columns and return them camelCased:

```ts
const { data: nextPz } = await supabaseAdmin
  .from("winam_checkmate_puzzles")
  .select("id, fen, theme, opponent_from, opponent_to")
  .eq("id", data.nextPuzzleId)
  .maybeSingle();

nextPuzzle = {
  puzzleId: nextPz.id,
  fen: nextPz.fen,
  theme: nextPz.theme,
  opponentFrom: nextPz.opponent_from,
  opponentTo: nextPz.opponent_to,
};
```

No other server logic changes.

### 2. `src/routes/_authed/checkmate.tsx`

Remove the brittle FEN-diff approach entirely:

- Delete the `parseFenLocal` helper.
- Delete `prevFenRef` and the `useState` for `lastMove`.
- Delete the `useEffect` that computes `lastMove` by diffing previous vs current FEN.

Replace with a `useMemo` reading directly from the server-provided fields:

```ts
const lastMove = useMemo(() => {
  const p = session.currentPuzzle as
    | { opponentFrom?: string | null; opponentTo?: string | null }
    | null;
  if (!p?.opponentFrom || !p?.opponentTo) return null;
  return { from: p.opponentFrom, to: p.opponentTo };
}, [session.currentPuzzle]);
```

Keep one small side-effect: clear `selectedSquare` when the puzzle changes (previously handled inside the deleted FEN-diff effect). A tiny `useEffect` on `puzzleFen` that calls `setSelectedSquare(null)` covers it.

`legalMoves` computation, the `<ChessBoard lastMove={lastMove} … />` prop wiring, and the existing pulse animation on last-move squares stay exactly as-is. The pulse will now fire on every puzzle (including puzzle #1) because the server always provides the move.

### Technical notes

- `opponent_from` / `opponent_to` are nullable in the table — the `useMemo` guards against either being null (no pulse, no green tint, no crash).
- Pulse retrigger still relies on `pulseKey` in `ChessBoard`, which keys off the `from-to` string. New puzzle = new key = animation re-runs.
- No types.ts edit needed — Supabase types regenerate automatically; the new columns are already in the schema.

### Files touched
- `src/utils/game.functions.ts` — extend two checkmate puzzle selects, pass `opponentFrom`/`opponentTo` through `clientData` and `nextPuzzle`.
- `src/routes/_authed/checkmate.tsx` — remove FEN-diff logic, derive `lastMove` from server fields, keep a small effect to clear `selectedSquare` on puzzle change.

No DB, schema, or dependency changes.

