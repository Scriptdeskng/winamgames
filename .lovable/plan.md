

## Subtle frame around WisdomDrop example preview

Single class-list change in `src/routes/_authed/wisdomdrop.tsx` on the ghost preview wrapper.

### Change

Locate the preview wrapper inside the `if (!session.sessionId)` start-screen block:

```tsx
<div className="flex-1 flex flex-col items-center justify-center gap-3 py-4 px-6">
```

Replace with:

```tsx
<div className="flex-1 flex flex-col items-center justify-center gap-3 py-4 px-6 mx-4 rounded-xl border border-white/5">
```

Adds `mx-4 rounded-xl border border-white/5` — a barely-visible frame. No background, no shadow, no padding/content changes.

### Files touched

- `src/routes/_authed/wisdomdrop.tsx` — one wrapper class list only.

