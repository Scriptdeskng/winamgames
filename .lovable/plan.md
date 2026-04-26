Plan:

1. Update `src/routes/__root.tsx`
   - Keep the server-rendered `<html className="dark">` default.
   - Change the inline startup script so selecting light always removes `dark` before adding `light`.
   - Change the dark path so it removes `light` and keeps/adds the dark theme consistently.
   - Preserve the existing `/admin` special case, but ensure it also leaves the root in dark mode only.

2. Update `src/hooks/useTheme.ts`
   - In the theme effect, use `const root = document.documentElement`.
   - For light mode: remove `dark`, add `light`.
   - For dark mode: remove `light`, add `dark`.
   - Keep persisting `winam-theme` exactly as before.

3. No other changes
   - Do not touch banner stack animation, CSS tokens, routes, or unrelated theme logic.

Technical detail:
```text
Before: <html class="dark light"> could happen.
After:  <html class="light"> or <html class="dark"> only.
```