

## Ghost-style start-screen previews

Both previews become decorative watermarks — neutral, low-opacity, no card chrome.

### 1. CheckMate — `src/routes/_authed/checkmate.tsx`

In the start-screen preview block:

- Board wrapper: `w-[160px]` → `w-[180px]`; remove `border border-border/30` (keep `rounded-lg overflow-hidden grid grid-cols-4 grid-rows-4`).
- Square colours switch to neutral white-alpha tones:

```tsx
style={{
  backgroundColor: isHint
    ? "rgba(255,255,255,0.15)"
    : (row + col) % 2 === 0
      ? "rgba(255,255,255,0.08)"
      : "rgba(255,255,255,0.04)"
}}
```

- Both piece `<img>` tags get `opacity-40`:

```tsx
<img src="https://lichess1.org/assets/piece/staunty/wQ.svg" alt="" className="w-8 h-8 opacity-40" />
<img src="https://lichess1.org/assets/piece/staunty/bK.svg" alt="" className="w-8 h-8 opacity-40" />
```

- Caption (`Tap a piece · tap its destination`) stays unchanged.

### 2. WisdomDrop — `src/routes/_authed/wisdomdrop.tsx`

Replace the entire `flex-1 flex items-center justify-center w-full py-6` wrapper containing the card with a bare faded layout:

```tsx
<div className="flex-1 flex flex-col items-center justify-center gap-3 py-4 px-6">
  <p className="text-xs text-muted-foreground/40 uppercase tracking-wide font-semibold text-center">Example</p>
  <p className="text-sm text-muted-foreground/40 leading-relaxed text-center">
    "A child who is not taught at home will teach the village a ____"
  </p>
  <div className="grid grid-cols-2 gap-2 w-full max-w-[240px]">
    {["lesson", "song", "dance", "game"].map((opt) => (
      <div
        key={opt}
        className="h-8 flex items-center justify-center text-xs text-muted-foreground/30"
      >
        {opt}
      </div>
    ))}
  </div>
</div>
```

No card, no border, no background. Plain faded text.

### Layout invariant

`flex-1` wrapper preserved on both screens — the entry card and Start Game button stay anchored at the bottom; nothing else moves.

### Files touched

- `src/routes/_authed/checkmate.tsx` — preview board only
- `src/routes/_authed/wisdomdrop.tsx` — preview block only

No logic, state, or other UI changes.

