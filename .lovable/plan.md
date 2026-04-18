

Update the viewport meta tag in `src/routes/__root.tsx` to disable iOS Safari's auto-zoom on input focus, matching StaySharp's behaviour.

### Change

In `src/routes/__root.tsx` (line 31), replace:

```ts
{ name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
```

with:

```ts
{ name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
```

### Effect

- iOS Safari will no longer auto-zoom into the phone input (or any other input) on focus across the entire app.
- Pinch-zoom is disabled app-wide. This is the same trade-off StaySharp made.
- No other files change. No DB changes. No new dependencies.

### Files touched

- `src/routes/__root.tsx` — single-line edit to the viewport meta tag.

