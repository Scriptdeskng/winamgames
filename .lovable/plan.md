

## Slow CheckMate piece slide animation to 700ms

Two trivial timing tweaks. No logic changes.

### 1. `src/styles.css`
Update `.animate-chess-piece-slide` duration from `400ms` → `700ms`:

```css
.animate-chess-piece-slide {
  animation: chess-piece-slide 700ms ease-out forwards;
}
```

### 2. `src/components/games/ChessBoard.tsx`
Update the `setAnimatingMove(null)` clear timer from `450ms` → `800ms`:

```ts
const timer = setTimeout(() => setAnimatingMove(null), 800);
```

The 100ms buffer (animation 700ms, clear 800ms) preserves the existing flicker-prevention margin between the overlay finishing and the static piece reappearing on the `from` square.

### Files touched
- `src/styles.css` — one duration value
- `src/components/games/ChessBoard.tsx` — one timeout value

No DB, schema, or dependency changes.

