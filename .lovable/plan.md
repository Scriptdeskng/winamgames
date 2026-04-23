

## Center-align goal card piece icon

Change the goal card flex container from `items-start` to `items-center` so the pawn icon box sits vertically centered against the two lines of text.

### Change in `src/routes/_authed/checkmate.tsx`

On the goal card wrapper div:

```tsx
<div className="rounded-xl bg-surface-1 border border-border px-4 py-3 flex gap-3 items-center">
```

(was `items-start`)

### Files touched
- `src/routes/_authed/checkmate.tsx` — single attribute change.

No DB, schema, or dependency changes.

