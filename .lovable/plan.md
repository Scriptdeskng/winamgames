

## Profile hero — restore XP meter, restyle rank pill, invert avatar colors

Three targeted fixes to `IdentityHero` in `src/routes/_authed/profile.tsx`.

### 1. Restore the XP progress meter

Bring back the thin progress bar that was removed. It gives the "X XP to Champion" line visual weight and shows progress at a glance — without it, the rank line feels like an orphaned caption.

- Thin bar (`h-1.5 rounded-full bg-surface-2`), full-width within a constrained container (`max-w-[240px] mx-auto`) so it doesn't stretch edge-to-edge under the centered name.
- Fill: `bg-primary` (emerald), width = `((xp - currentMin) / (nextMin - currentMin)) * 100%`.
- Sits **above** the muted "X XP to Champion" line.

### 2. Reposition + restyle the rank pill

Current pill at top-right with `ring-2 ring-background` reads as floating/disconnected. Move it to the **bottom-center** of the avatar so it visually anchors the circle.

- Position: `absolute -bottom-2 left-1/2 -translate-x-1/2`.
- Background: solid tier color (keep `RANK_CONFIG[tier].bgColor` + `color`) — drop the transparent feel by keeping the `ring-2 ring-background` so it sits cleanly on the page bg.
- **Reduce text size**: `text-[10px]` (down from `text-xs`), keep `font-semibold uppercase tracking-wide`.
- Padding stays compact: `px-2 py-0.5`.

### 3. Invert avatar colors

Currently: light primary tint background (`bg-primary/15`) + emerald icon (`text-primary`). Reference shows the opposite — solid color circle with a contrasting icon.

- Background: `bg-primary` (solid emerald).
- Icon: `text-primary-foreground` (white/contrast token).
- Keep size `h-20 w-20`.

### 4. Minor — reduce rank-advance note size

To keep hierarchy tight after restoring the bar, shrink the muted line one notch: `text-xs` (down from `text-sm`).

### Resulting structure

```
              ⊙ Avatar (solid emerald, white icon)
              [Veteran]              ← pill bottom-center, smaller text

           King Ed ✏️                ← name + pencil

         ▓▓▓▓▓░░░░░░░░░              ← restored progress bar
        440 XP to Champion           ← smaller muted line
```

### Files touched

- `src/routes/_authed/profile.tsx` — `IdentityHero` only.

No new imports, no other files.

