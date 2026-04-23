

## Compact ghost-card preview on WisdomDrop start screen

The previous turn produced a plan but no code change — re-presenting it for approval so it can ship.

### Change

In `src/routes/_authed/wisdomdrop.tsx`, inside the `if (!session.sessionId)` start-screen branch, locate the current bare ghost preview wrapper:

```tsx
<div className="flex-1 flex flex-col items-center justify-center gap-3 py-4 px-6">
  <p className="text-xs text-muted-foreground/40 …">Example</p>
  <p className="text-sm text-muted-foreground/40 …">"A child who is not taught …"</p>
  <div className="grid grid-cols-2 gap-2 w-full max-w-[240px]">
    {["lesson", "song", "dance", "game"].map(...)}
  </div>
</div>
```

Replace the entire block with the compact ghost card:

```tsx
<div className="flex-1 flex items-center justify-center w-full py-4">
  <div className="w-full max-w-[280px] rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 space-y-2 mx-4">
    <p className="text-[10px] uppercase tracking-wide text-muted-foreground/40 font-semibold">Example</p>
    <p className="text-xs text-muted-foreground/40 leading-relaxed">
      "A child who is not taught at home will teach the village a ____"
    </p>
    <div className="grid grid-cols-2 gap-1.5">
      {["lesson", "song", "dance", "game"].map((opt) => (
        <div
          key={opt}
          className="h-7 rounded-lg border border-white/[0.05] bg-white/[0.02] flex items-center justify-center text-[11px] text-muted-foreground/30"
        >
          {opt}
        </div>
      ))}
    </div>
  </div>
</div>
```

### Notes

- Reintroduces a subtle card frame (`bg-white/[0.03]` + `border-white/[0.06]`) but keeps the watermark feel — no shadow, no surface token.
- Smaller max width (280px), tighter padding (`p-3 space-y-2`), shorter chips (`h-7`) — more compact than the original card.
- Option chips get faint borders/backgrounds so they read as button shapes without inviting taps.
- `flex-1` wrapper preserved — entry card and Start Game button stay anchored at the bottom.

### Files touched

- `src/routes/_authed/wisdomdrop.tsx` — preview block only. No logic, no other UI, no CheckMate changes.

