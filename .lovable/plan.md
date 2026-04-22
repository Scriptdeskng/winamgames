

## CheckMate visual upgrade — Lichess pieces, coordinates, yellow highlights, goal card

### 1. Replace Unicode pieces with Lichess CDN SVGs (`src/components/games/ChessBoard.tsx`)

Drop the `PIECE_MAP` Unicode constants and the per-colour `text-*` / drop-shadow styling. Replace with a URL map and `<img>` rendering:

```ts
const PIECE_URL: Record<string, string> = {
  K: "https://lichess1.org/assets/piece/cburnett/wK.svg",
  Q: "https://lichess1.org/assets/piece/cburnett/wQ.svg",
  R: "https://lichess1.org/assets/piece/cburnett/wR.svg",
  B: "https://lichess1.org/assets/piece/cburnett/wB.svg",
  N: "https://lichess1.org/assets/piece/cburnett/wN.svg",
  P: "https://lichess1.org/assets/piece/cburnett/wP.svg",
  k: "https://lichess1.org/assets/piece/cburnett/bK.svg",
  q: "https://lichess1.org/assets/piece/cburnett/bQ.svg",
  r: "https://lichess1.org/assets/piece/cburnett/bR.svg",
  b: "https://lichess1.org/assets/piece/cburnett/bB.svg",
  n: "https://lichess1.org/assets/piece/cburnett/bN.svg",
  p: "https://lichess1.org/assets/piece/cburnett/bP.svg",
};
```

Inside each square button, render `piece` as:
```tsx
{piece && (
  <img
    src={PIECE_URL[piece]}
    alt={piece}
    draggable={false}
    className="w-[80%] h-[80%] pointer-events-none select-none"
  />
)}
```

Drop the text-size / colour / drop-shadow classes since pieces are now images.

**External dependency note**: relies on `lichess1.org` CDN availability. If the team prefers self-hosting later, the same SVG set can be vendored into `public/pieces/` — flagged but not done now per "no new dependencies".

### 2. Coordinate labels (`src/components/games/ChessBoard.tsx`)

Render rank (1–8) and file (a–h) labels as tiny absolute-positioned text inside each edge square, matching Lichess style — labels live on the squares themselves, not in an outer gutter.

Inside the square render, after the piece:
```tsx
{ci === 0 && (
  <span
    className="absolute top-0.5 left-0.5 text-[9px] font-semibold leading-none pointer-events-none"
    style={{ color: isLight ? "#4A7C59" : "#B8D4A8" }}
  >
    {8 - ri}
  </span>
)}
{ri === 7 && (
  <span
    className="absolute bottom-0.5 right-0.5 text-[9px] font-semibold leading-none pointer-events-none"
    style={{ color: isLight ? "#4A7C59" : "#B8D4A8" }}
  >
    {files[ci]}
  </span>
)}
```
Add `relative` to the square button's class list so the absolute labels anchor correctly. Label colour inverts the square colour (dark text on light squares, light text on dark squares) for legibility without contrast loss.

### 3. Yellow highlight overlay (`src/components/games/ChessBoard.tsx`)

Replace the existing `ring-*` class-based highlights with inline `backgroundColor` overlays applied with priority: selected > hint > last-move > base square colour.

```tsx
let bg: string;
if (isSelected)        bg = "rgba(255, 255, 0, 0.7)";
else if (isHint)       bg = "rgba(255, 255, 0, 0.5)";
else if (isLastMove)   bg = isLight ? "rgba(155, 199, 100, 0.6)" : "rgba(110, 160, 80, 0.6)";
else                   bg = isLight ? "#B8D4A8" : "#4A7C59";

style={{ backgroundColor: bg }}
```

Remove the `ring-2 ring-primary ring-inset bg-primary/25` / `ring-coin/70` / `bg-primary/10` class fragments — the yellow overlay replaces all of them. Keep `disabled && "cursor-default"` and the base layout classes.

### 4. Goal card replacing the context line (`src/routes/_authed/checkmate.tsx`)

Above the board (where `<p className="text-center text-xs text-muted-foreground">{sideToMove} to move — find the best move</p>` currently sits), render a goal card.

Add a static map at module scope (before the component):

```ts
const GOAL_BY_THEME: Record<string, string> = {
  "Scholar's mate": "You have a checkmating idea. Can you find it?",
  "Fool's mate": "Black has a devastating queen move. Find it.",
  "Pin the knight": "You can pin an important piece. How?",
  "Fork the king": "You can attack two pieces at once. Find the fork.",
  "Attack f7": "The f7 square is weak. How do you exploit it?",
  "Knight fork": "Your knight can attack two pieces simultaneously. Find it.",
  "Develop calmly": "Find the move that develops your piece most effectively.",
  "Castle to safety": "Your king is exposed. How do you make it safe?",
  "Claim the centre": "Control the centre. What's the best pawn move?",
  "Pawn push, attack knight": "Push a pawn to gain space and attack. Which one?",
  "Open the bishop": "Your bishop is blocked. Find the move that opens its diagonal.",
  "Central exchange": "You can take a central pawn. Should you? Find the best way.",
  "Develop the bishop": "Find the best square for your bishop.",
  "Develop the knight": "Find the best square for your knight.",
};
```

Replace the `<p>` line with:

```tsx
{puzzle && (
  <div className="rounded-xl bg-surface-1 border border-border px-4 py-3 flex gap-3 items-start">
    <div className="text-2xl leading-none shrink-0">
      {puzzle.fen.split(" ")[1] === "w" ? "♙" : "♟"}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-foreground">
        {puzzle.fen.split(" ")[1] === "w" ? "White" : "Black"} to move
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {GOAL_BY_THEME[(puzzle as any).theme] ?? "Find the best move."}
      </p>
    </div>
  </div>
)}
```

Theme arrives via the puzzle payload from the server (already wired in the previous fix). The `?? "Find the best move."` fallback covers any theme not in the map.

### Why this is safe
- Lichess CDN URLs are public and CORS-permissive for `<img>` loading; no fetch/proxy needed.
- Image rendering removes the Unicode font-rendering inconsistencies entirely.
- Yellow overlay matches the universal chess UX convention (Lichess, chess.com).
- Coordinate labels follow Lichess's "label on edge squares" pattern — no extra layout space consumed.
- Goal card uses existing design tokens (`bg-surface-1`, `border-border`, `text-muted-foreground`).

### Out of scope / flagged
- **CDN dependency**: pieces fetched from `lichess1.org`. Acceptable for now; vendoring into `/public/pieces/` is a future hardening step.
- **Theme coverage**: 14 themes mapped; current pool has 14 unique themes among 20 puzzles, so all are covered. Future puzzles need a matching `GOAL_BY_THEME` entry or fall through to the generic fallback.
- **Coordinate label colour**: inverts square colour for contrast; if a designer wants a unified muted tone, easy follow-up.

### Files touched
- `src/components/games/ChessBoard.tsx` — `PIECE_URL` map + `<img>` rendering, coordinate labels on edge squares, yellow overlay highlight system replacing ring classes
- `src/routes/_authed/checkmate.tsx` — `GOAL_BY_THEME` constant, goal card replaces plain context line

No DB changes. No new dependencies.

