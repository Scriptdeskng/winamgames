

## Implement four draw countdown states

State machine drives `DrawHeroCard` on `/app`; locked banner appears in both game screens during the entry-lock window.

### `src/routes/_authed/app.tsx`

- Add helper `getDrawState(now: Date): 'open' | 'locked' | 'drawn' | 'new_week'` using WAT shift logic (UTC + 1h, Sunday boundaries at 19:00 / 20:00 / 20:15).
- Replace `getNextSundayWAT()` with `getNextEntriesLockWAT()` — countdown now targets Sunday **19:00** WAT (entries lock), not 20:00.
- Refactor `DrawHeroCard`:
  - Two tickers: 1s for countdown digits, 60s for state-boundary recheck.
  - Branch render on `drawState`:
    - **`open` / `new_week`** — current UI unchanged (countdown + tickets bar + "View my tickets").
    - **`locked`** — replace countdown digits with text block: heading "Draw closing soon", subtext "Entries locked — draw executes at 20:00 WAT". Tickets bar + count remain but muted (`bg-muted-foreground/40`, `text-muted-foreground`). Footer "Draw every Sunday…" hidden.
    - **`drawn`** — hide countdown, bar, ticket count entirely. Show heading "Draw complete", subtext "This week's winners have been selected", primary button "See winners" → `Link to="/winners"`, muted line "New draw week opens in a moment".
- Card chrome (gradient, border, padding) identical across all states — no layout jump.

### `src/components/games/DrawLockBanner.tsx` (new)

- Self-contained component: computes `getDrawState(new Date())` on mount, re-checks every 60s.
- Renders only when state is `'locked'` AND `sessionStorage.getItem('winam_draw_lock_banner_dismissed') !== '1'`.
- Visual: amber strip — `bg-amber-500/10 border border-amber-500/30 text-amber-200`, rounded-lg, full width, `AlertTriangle` icon left, copy "Draw entries locked · Coins only this session", X button right that sets the sessionStorage flag and unmounts.
- Exports its own copy of `getDrawState` (or imports from a shared util — see note below).

Shared helper note: extract `getDrawState` and `getNextEntriesLockWAT` into `src/lib/draw-state.ts` so `app.tsx` and `DrawLockBanner.tsx` both import from one source of truth. Avoids drift between the home card and the in-game banner.

### `src/routes/_authed/checkmate.tsx`

- Import `DrawLockBanner` and render it as the first child inside the in-game body block (`px-4 pt-4 pb-8 space-y-4`), only when `session.sessionId` exists. Not on the start screen.

### `src/routes/_authed/wisdomdrop.tsx`

- Same: render `<DrawLockBanner />` at the top of the in-game scroll block, in-session only.

### `src/utils/game.functions.ts`

- Add the requested TODO comment in `closeSession` at the draw week status check:

```ts
// TODO: enforce entry lock window server-side before production
// Sessions completed between Sunday 19:00–20:00 WAT should award coins only
// Currently enforced UI-only via DrawLockBanner — server check needed for production
```

No logic change in this file — comment only.

### Out of scope

- No DB or schema changes.
- No server-side lock enforcement (tracked via the TODO above).
- Banner is per-session; resets on next visit (per spec).

### Files touched

- `src/lib/draw-state.ts` (new) — shared `getDrawState` + `getNextEntriesLockWAT`.
- `src/routes/_authed/app.tsx` — state-driven `DrawHeroCard`.
- `src/components/games/DrawLockBanner.tsx` (new) — amber locked banner.
- `src/routes/_authed/checkmate.tsx` — render banner in-session.
- `src/routes/_authed/wisdomdrop.tsx` — render banner in-session.
- `src/utils/game.functions.ts` — TODO comment only.

