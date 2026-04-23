

## Fix CheckMate last-move pulse animation

The keyframe defined inside an inline `<style>` block in `ChessBoard.tsx` isn't applying reliably. Move it to the global stylesheet so the `.animate-checkmate-lastmove-pulse` class always resolves.

### 1. `src/styles.css`

Add inside `@layer utilities` (alongside the existing landing animations):

```css
@keyframes checkmate-lastmove-pulse {
  0%   { background-color: rgba(255, 235, 59, 0.0); }
  30%  { background-color: rgba(255, 235, 59, 0.75); }
  100% { background-color: rgba(155, 199, 100, 0.6); }
}

.animate-checkmate-lastmove-pulse {
  animation: checkmate-lastmove-pulse 600ms ease-out forwards;
}
```

Note: `forwards` (vs the previous `1` iteration count) keeps the final green tint after the animation ends, so the last-move highlight stays visible.

### 2. `src/components/games/ChessBoard.tsx`

- Remove the `PULSE_STYLE` string constant (top of file, ~lines 41–51).
- Remove the `<style>{PULSE_STYLE}</style>` tag inside the board wrapper.
- Confirm the existing pulse overlay span keeps `key={\`pulse-${pulseKey}-${square}\`}` so React unmounts/remounts on every puzzle transition, retriggering the CSS animation. Current code already does this — no change needed beyond verification.

### Files touched
- `src/styles.css` — add keyframe + utility class under `@layer utilities`
- `src/components/games/ChessBoard.tsx` — remove inline style block

No DB, schema, or dependency changes.

