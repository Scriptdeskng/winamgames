

## Fix: View link appears non-functional on `/admin/players`

### Root cause

The `Link` in `admin.players.tsx` is already written exactly as the user requested — it does navigate, but the visible UI doesn't change, so it looks broken.

`src/routes/admin.players.tsx` and `src/routes/admin.players.$playerId.tsx` coexist in the flat-file router, which makes `admin.players.tsx` a **layout** for its `$playerId` child. The layout currently:

1. Renders the players table as its own content
2. Has **no `<Outlet />`** for child routes

So when you click View:
- URL changes to `/admin/players/{id}` ✓
- The layout (`admin.players.tsx`) keeps rendering the table
- The child detail route has nowhere to mount → invisible

This mirrors the earlier `/admin/login` blank-screen issue.

### Fix

Modify `src/routes/admin.players.tsx` so it renders the players index UI **only when on the index path**, and renders an `<Outlet />` for child routes.

```tsx
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";

function PlayersRoute() {
  const { pathname } = useLocation();
  const isIndex = pathname === "/admin/players" || pathname === "/admin/players/";

  if (!isIndex) {
    return <Outlet />;
  }

  return <PlayersIndex />; // existing component body moved here
}
```

Steps:
1. Add `Outlet` and `useLocation` to the existing `@tanstack/react-router` import.
2. Rename the existing `PlayersPage` function to `PlayersIndex` (keep all current logic — table, search, pagination — unchanged).
3. Add a new `PlayersRoute` wrapper that returns `<Outlet />` for non-index paths and `<PlayersIndex />` otherwise.
4. Point `createFileRoute("/admin/players")({ component: PlayersRoute })` at the new wrapper.

The existing `Link` (`<Link to="/admin/players/$playerId" params={{ playerId: p.id }}>View</Link>`) is **left exactly as-is** — it was already correct.

### Files modified

- `src/routes/admin.players.tsx` — add `Outlet`/`useLocation` imports, wrap with index-vs-child path branch.

No other files change. No route tree regeneration needed.

### Verification

- `/admin/players` → renders the players table (with sidebar from `admin.tsx`).
- Clicking View on a row → URL changes and the player detail page renders in place of the table.
- Direct load of `/admin/players/{id}` → renders the detail page.
- Back navigation → returns to the table.

