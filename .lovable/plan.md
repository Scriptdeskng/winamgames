

## Fix goal card side-to-move indicator

Replace the Unicode pawn (which is both color-inverted and visually unclear) with a small styled square containing the matching Lichess staunty pawn SVG — same piece set used on the board.

### Change in `src/routes/_authed/checkmate.tsx`

In the goal card JSX (currently rendering `{puzzle.fen.split(" ")[1] === "w" ? "♙" : "♟"}` inside a `text-2xl` div), swap that single element for a styled 8x8 box:

```tsx
<div
  className="shrink-0 w-8 h-8 rounded flex items-center justify-center"
  style={{ backgroundColor: puzzle.fen.split(" ")[1] === "w" ? "#F0D9B5" : "#B58863" }}
>
  <img
    src={puzzle.fen.split(" ")[1] === "w"
      ? "https://lichess1.org/assets/piece/staunty/wP.svg"
      : "https://lichess1.org/assets/piece/staunty/bP.svg"
    }
    alt={puzzle.fen.split(" ")[1] === "w" ? "White" : "Black"}
    className="w-6 h-6"
  />
</div>
```

- White to move → light cream square (`#F0D9B5`) with `wP.svg`
- Black to move → brown square (`#B58863`) with `bP.svg`

The surrounding card layout (text "{Color} to move" + theme description) stays unchanged.

### Files touched
- `src/routes/_authed/checkmate.tsx` — single JSX swap in the goal card.

No DB, schema, or dependency changes.

