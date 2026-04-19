

## Region as a colored pill at the top

Currently the region (e.g. "Hausa") sits as plain muted text above the proverb, and is repeated below as "— Hausa" attribution under the original proverb in the reveal panel.

### Change

In `src/routes/_authed/wisdomdrop.tsx`, replace the plain region label at the top of the puzzle card with an emerald-tinted pill, matching the app's existing chip style (see the landing screen's stat chips and the hint chip for visual precedent).

**Before** (line ~149):
```tsx
<p className="text-xs text-muted-foreground mb-3">{puzzle.region}</p>
```

**After**:
```tsx
<div className="mb-4">
  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald/10 border border-emerald/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald">
    <Globe className="h-3 w-3" />
    {puzzle.region}
  </span>
</div>
```

- Reuses the `Globe` icon already imported from lucide for region context (consistent with the landing screen's "9 regions" chip).
- Uses the emerald token (`bg-emerald/10`, `border-emerald/20`, `text-emerald`) — the WisdomDrop signature color, distinct from the coin/amber hint chip below it.
- Uppercase tracking gives it an eyebrow/tag feel so it reads as metadata rather than competing with the proverb.

### Reveal panel (no change)

The "— Hausa" attribution under the original proverb in the reveal stays — it's contextual ("this is the original Hausa version of what you just answered") and reads naturally there.

### Out of scope

- Region color mapping per region (all regions use emerald for now — can be added later if useful).
- Checkmate or any other screen.
- Landing screen chips.

### File touched

- `src/routes/_authed/wisdomdrop.tsx` (one block, ~lines 147–151)

