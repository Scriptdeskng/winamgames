

## Profile hero — final adjustments to match reference

Two changes to the prior plan based on your feedback:

### 1. Pill shows rank name, not a number

Replace the numeric level badge (`"5"`) with the **rank name** (`"Veteran"`, `"Champion"`, etc.) — same data the original pill showed, just restyled as a small chip at the avatar's top-right.

- Shape: small rounded pill (`rounded-full px-2 py-0.5`), not a circle.
- Content: just the rank label text — no icon inside.
- Color: use `RANK_CONFIG[tier].bgColor` + `RANK_CONFIG[tier].color` so each tier keeps its identity color (emerald for Champion, orange for Veteran, etc.).
- Position: absolute, top-right of avatar (`-top-1 -right-2`), with a thin `ring-2 ring-background` so it visually detaches from the avatar circle.

### 2. Keep "to {RankName}" in the XP line

Restore the next-tier name in the muted status line. Final copy:
- Normal: **"440 XP to Champion"**
- Max rank: **"Maximum rank reached"**

### Everything else from prior plan stands

- **Drop the card wrapper** — hero sits flat on page background, just vertical padding (`py-4`).
- **Remove MSISDN line.**
- **Add `Pencil` icon** (h-3.5, muted) inline after nickname, non-functional.
- **Remove the progress bar** — single muted XP line only.
- Avatar stays `h-20 w-20` with `bg-primary/15`.

### Resulting structure

```
                              
           ⊙ Avatar [Veteran]      ← rank pill top-right
                                   
         King Ed ✏️                ← name + pencil
                                   
       440 XP to Champion          ← single muted line
                              
   (flat — no card border/shadow)
```

### Files touched

- `src/routes/_authed/profile.tsx` — rewrite `IdentityHero` only.
- Add `Pencil` to lucide-react imports; remove unused `User` if no longer referenced elsewhere in the file (keep if still used).

### Out of scope

- Pencil edit functionality (visual only).
- `msisdnLast4` prop stays in signature but unused — clean up in a follow-up if desired.

