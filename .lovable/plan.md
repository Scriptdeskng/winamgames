

## Plan

Adopt StaySharp's global viewport lock + per-route opt-in scroll pattern.

### 1. Global CSS lock — `src/styles.css`

Add inside `@layer base`:

```css
html, body {
  height: 100dvh;
  overflow: hidden;
}
html.allow-scroll, html.allow-scroll body {
  height: auto !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
}
```

### 2. New hook — `src/hooks/useAllowScroll.ts`

```ts
import { useEffect } from "react";
export function useAllowScroll() {
  useEffect(() => {
    document.documentElement.classList.add("allow-scroll");
    return () => document.documentElement.classList.remove("allow-scroll");
  }, []);
}
```

### 3. Opt-in routes — add `useAllowScroll()` call

Routes whose content can exceed viewport height:
- `src/routes/_authed/index.tsx` (home — banners, missions, tip)
- `src/routes/_authed/leaderboard.tsx`
- `src/routes/_authed/entries.tsx`
- `src/routes/_authed/results.tsx`
- `src/routes/_authed/winners.tsx`
- `src/routes/_authed/profile.tsx`
- `src/routes/renew.tsx` (plan list + features can overflow on small screens)

### Routes deliberately left locked (no scroll)

- `src/routes/login.tsx`, `src/routes/verify.tsx`, `src/routes/onboarding.tsx` — single-viewport auth screens
- `src/routes/_authed/checkmate.tsx`, `src/routes/_authed/wisdomdrop.tsx` — game screens designed to fit one viewport

### Notes

- No `#root` in the CSS rule — TanStack Start renders directly into `<body>`.
- Hook cleanup removes the class on unmount, so navigating from a scroll page back to a locked page (e.g. results → home → login on logout) restores the lock automatically.
- No DB changes. No new dependencies.

