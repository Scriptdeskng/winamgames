

## Three updates: hint button hierarchy + start-screen previews

### 1. Hint button three-state styling (both files)

Apply the new conditional className treatment to the hint tier buttons in both game screens. Keep the existing base classes; only the state branches change.

**`src/routes/_authed/checkmate.tsx`** — replace the `cn(...)` block inside `HINT_TIERS.map`:

```tsx
className={cn(
  "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-xs font-medium transition-all border min-h-[72px]",
  purchased
    ? "bg-success/10 border-success/30 text-success"
    : locked
      ? "bg-surface-1/30 border-border/30 text-muted-foreground/40 cursor-not-allowed opacity-40"
      : !canAfford
        ? "bg-surface-1/50 border-border/40 text-muted-foreground/50 cursor-not-allowed opacity-50"
        : "bg-primary/10 border-primary/40 text-foreground hover:bg-primary/20 hover:border-primary/60 active:scale-95"
)}
```

(CheckMate currently collapses `locked` and `!canAfford` into a shared `disabled` branch — split it into two distinct branches as above. Define `locked` locally: `const locked = tier > session.currentHintTier + 1;`, which already exists.)

**`src/routes/_authed/wisdomdrop.tsx`** — same three-way treatment applied to its existing `purchased`/`locked`/`!canAfford` branches (lines 333–339). Available branch becomes the new primary tint.

### 2. WisdomDrop start screen — example proverb preview

Insert a static, non-interactive example block in the empty middle space between the stat chips and the entry card. Replace the spacer `<div className="flex-1 min-h-6" />` with a wrapped layout that keeps spacing balanced:

```tsx
<div className="flex-1 flex items-center justify-center w-full py-6">
  <div className="w-full max-w-[320px] rounded-xl bg-surface-1 border border-border p-4 space-y-3">
    <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70 font-semibold">Example</p>
    <p className="text-sm text-foreground leading-relaxed">
      "A child who is not taught at home will teach the village a ____"
    </p>
    <div className="grid grid-cols-2 gap-2">
      {["lesson", "song", "dance", "game"].map((opt) => (
        <div
          key={opt}
          className="h-10 rounded-lg border border-border bg-surface-2 flex items-center justify-center text-xs text-muted-foreground"
        >
          {opt}
        </div>
      ))}
    </div>
    <p className="text-[10px] text-muted-foreground/50 text-center">Tap the correct word to complete the proverb</p>
  </div>
</div>
```

Purely illustrative. No `onClick`, no state.

### 3. CheckMate start screen — example mini board preview

Insert a similar non-interactive example in the empty middle space (replace the existing `<div className="flex-1 min-h-6" />` spacer in `checkmate.tsx`).

A static 4×4 mini board with two pieces and a directional cue:

```tsx
<div className="flex-1 flex items-center justify-center w-full py-6">
  <div className="w-full max-w-[320px] rounded-xl bg-surface-1 border border-border p-4 space-y-3">
    <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70 font-semibold">Example</p>
    <div className="mx-auto w-[176px] grid grid-cols-4 grid-rows-4 rounded-lg overflow-hidden border border-border">
      {Array.from({ length: 16 }).map((_, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        const dark = (row + col) % 2 === 1;
        // White queen on c2 (row 2, col 2), black king on a4 (row 0, col 0)
        const isQueen = row === 2 && col === 2;
        const isKing = row === 0 && col === 0;
        const isHint = row === 0 && col === 2; // suggested destination
        return (
          <div
            key={i}
            className={cn(
              "relative aspect-square flex items-center justify-center",
              dark ? "bg-[#B58863]" : "bg-[#F0D9B5]",
              isHint && "ring-2 ring-inset ring-emerald/70"
            )}
          >
            {isQueen && (
              <img src="https://lichess1.org/assets/piece/staunty/wQ.svg" alt="" className="w-7 h-7" />
            )}
            {isKing && (
              <img src="https://lichess1.org/assets/piece/staunty/bK.svg" alt="" className="w-7 h-7" />
            )}
          </div>
        );
      })}
    </div>
    <p className="text-sm font-semibold text-foreground text-center">Find the winning move</p>
    <p className="text-[10px] text-muted-foreground/50 text-center">Tap a piece, then tap its destination</p>
  </div>
</div>
```

The board uses the same Staunty piece set and light/dark colours as the live `ChessBoard`. The emerald ring on the destination square gives a subtle visual hint without animation. Purely illustrative.

### Layout note

The start screens currently use `flex flex-col items-center` with a `flex-1 min-h-6` spacer that pushes the entry card and CTA to the bottom. Replacing the spacer with a `flex-1 flex items-center justify-center` wrapper preserves that bottom-anchored CTA while filling the middle with the preview card. Both screens stay within the `max-w-[430px]` shell and don't introduce scroll on a 390×844 viewport.

### Files touched

- `src/routes/_authed/wisdomdrop.tsx` — hint button styles + start-screen example proverb
- `src/routes/_authed/checkmate.tsx` — hint button styles (split locked/can't-afford) + start-screen example board

No backend, schema, shared component, or game-logic changes.

