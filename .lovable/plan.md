

## CheckMate board — Staunty pieces + Lichess classic palette

### Changes to `src/components/games/ChessBoard.tsx`

**1. Piece set → Staunty, larger pieces**

Replace every `/cburnett/` URL in `PIECE_URL` with `/staunty/`:
```ts
const PIECE_URL: Record<string, string> = {
  K: "https://lichess1.org/assets/piece/staunty/wK.svg",
  Q: "https://lichess1.org/assets/piece/staunty/wQ.svg",
  R: "https://lichess1.org/assets/piece/staunty/wR.svg",
  B: "https://lichess1.org/assets/piece/staunty/wB.svg",
  N: "https://lichess1.org/assets/piece/staunty/wN.svg",
  P: "https://lichess1.org/assets/piece/staunty/wP.svg",
  k: "https://lichess1.org/assets/piece/staunty/bK.svg",
  q: "https://lichess1.org/assets/piece/staunty/bQ.svg",
  r: "https://lichess1.org/assets/piece/staunty/bR.svg",
  b: "https://lichess1.org/assets/piece/staunty/bB.svg",
  n: "https://lichess1.org/assets/piece/staunty/bN.svg",
  p: "https://lichess1.org/assets/piece/staunty/bP.svg",
};
```

Bump `<img>` sizing from `w-[80%] h-[80%]` → `w-[90%] h-[90%]`.

**2. Lichess classic warm palette**

- Base square colours: light `#F0D9B5`, dark `#B58863` (replaces sage/forest greens).
- Last-move tints stay green-toned — they read fine on the warm board and remain distinct from yellow hint/selection. No change.
- Coordinate label colour inverts: `isLight ? "#B58863" : "#F0D9B5"`.
- Board wrapper border: `border-emerald-900/50` → `border-amber-900/30`.

Yellow hint/selection overlays unchanged (universal across both palettes).

### Files touched
- `src/components/games/ChessBoard.tsx`

No DB, schema, or dependency changes.

