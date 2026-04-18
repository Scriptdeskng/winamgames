

## Goal
Add back navigation to pages currently missing it. Reuse the existing TopBar `backTo` pattern (already styled with `ArrowLeft` icon in a 10×10 surface-1 rounded square — matches the staysharp lucide icon-button convention).

## Findings
- `TopBar` already renders a back button when `backTo` is provided.
- Pages **with** back button: `entries`, `profile`, `winners` → all `backTo="/"`.
- Pages **without** back button (showing avatar/menu only):
  - `/` (home) — root, no back needed ✓
  - `/leaderboard` — missing, should go to `/`
  - `/checkmate`, `/wisdomdrop` — use `GameHeader` with X-exit (intentional, leave as-is)
  - `/results` — has Link home in body, no header back button
- Pages with **no TopBar at all**:
  - `/renew` — needs back to `/` (or `/profile`)
  - `/login`, `/verify`, `/onboarding` — auth flow, back is contextual (verify → login already exists)

## Changes

**1. `src/routes/_authed/leaderboard.tsx`**
- `<TopBar />` → `<TopBar backTo="/" />`

**2. `src/routes/_authed/results.tsx`**
- Add `<TopBar backTo="/" />` at top of page (currently has no TopBar).

**3. `src/routes/renew.tsx`**
- Add a standalone back button in top-left (matches TopBar styling: 10×10, rounded-xl, bg-surface-1, border, ArrowLeft icon) linking to `/profile`. Standalone (not TopBar) since renew is outside `_authed` layout and has its own centered layout.

**4. `src/routes/onboarding.tsx`**
- No back button — onboarding is mandatory after signup. Skip.

**5. `src/routes/login.tsx`** and **`/verify.tsx`**
- `verify` already has back-to-login link. `login` is the entry point. Skip both.

## Styling
Reuse exact TopBar back-button classes for consistency:
```
h-10 w-10 rounded-xl bg-surface-1 border border-border 
flex items-center justify-center hover:border-primary/30 transition-colors
```
with `<ArrowLeft className="h-5 w-5 text-foreground" />` inside.

## Files touched
- `src/routes/_authed/leaderboard.tsx`
- `src/routes/_authed/results.tsx`
- `src/routes/renew.tsx`

