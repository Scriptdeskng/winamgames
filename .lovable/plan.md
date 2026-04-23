

## Strip the CheckMate example preview card

Single change in `src/routes/_authed/checkmate.tsx`. Replace the existing wrapped preview (lines ~177–207 in the start-screen branch) with a bare mini board sitting directly in the middle flex space — no card chrome.

### Change

In the `if (!session.sessionId)` block, locate the preview wrapper:

```tsx
<div className="flex-1 flex items-center justify-center w-full py-6">
  <div className="w-full max-w-[320px] rounded-xl bg-surface-1 border border-border p-4 space-y-3">
    <p className="text-[11px] uppercase tracking-wide …">Example</p>
    <div className="mx-auto w-[176px] grid grid-cols-4 grid-rows-4 …">
      …
    </div>
    <p className="text-sm font-semibold …">Find the winning move</p>
    <p className="text-[10px] …">Tap a piece, then tap its destination</p>
  </div>
</div>
```

Replace the entire block with the bare version:

```tsx
<div className="flex-1 flex flex-col items-center justify-center gap-3 py-4">
  <div className="w-[160px] grid grid-cols-4 grid-rows-4 rounded-lg overflow-hidden border border-border/30">
    {Array.from({ length: 16 }).map((_, i) => {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const isQueen = row === 2 && col === 2;
      const isKing = row === 0 && col === 0;
      const isHint = row === 0 && col === 2;
      return (
        <div
          key={i}
          className="relative aspect-square flex items-center justify-center"
          style={{
            backgroundColor: isHint
              ? "rgba(255,255,0,0.5)"
              : (row + col) % 2 === 0
                ? "#F0D9B5"
                : "#B58863"
          }}
        >
          {isQueen && (
            <img src="https://lichess1.org/assets/piece/staunty/wQ.svg" alt="" className="w-8 h-8" />
          )}
          {isKing && (
            <img src="https://lichess1.org/assets/piece/staunty/bK.svg" alt="" className="w-8 h-8" />
          )}
        </div>
      );
    })}
  </div>
  <p className="text-xs text-muted-foreground/60 text-center">Tap a piece · tap its destination</p>
</div>
```

### Notes

- `cn` import no longer needed for this block (uses inline `style` for the yellow hint + warm wood tones); the existing `cn` import elsewhere in the file stays.
- `flex-1` keeps the entry card + Start Game button anchored at the bottom — same layout invariant as before.
- No changes to logic, state, or any other section.

### Files touched

- `src/routes/_authed/checkmate.tsx` — start-screen preview block only.

