

## Fix: /admin/login blank screen

### Root cause

`src/routes/admin.login.tsx` is registered as a **child** of `src/routes/admin.tsx` (the auth-guarded layout) because TanStack's flat-file router treats `admin.login.tsx` as nested under `admin.tsx`. This means visiting `/admin/login` runs the layout's auth guard, which:

1. Reads `getAdminSession()` → returns `null` (no session yet)
2. Calls `navigate({ to: "/admin/login" })` and returns early
3. Renders the loading spinner because `ready` stays `false`
4. The `<Outlet />` (which would contain the login form) never renders

The login page is mounted but invisible — the layout shows a spinner forever instead of rendering its child.

### Fix

Modify `src/routes/admin.tsx` to **skip the auth guard when the current path is `/admin/login`**. Read the current location with `useLocation()` from `@tanstack/react-router`. If the pathname is `/admin/login`, render `<Outlet />` immediately without running the session check, so the login route renders normally.

Logic:
```
const { pathname } = useLocation();
const isLoginRoute = pathname === "/admin/login";

useEffect(() => {
  if (isLoginRoute) { setReady(true); return; }
  // existing session check
}, [navigate, isLoginRoute]);

if (isLoginRoute) {
  return <Outlet />;  // bare outlet, no sidebar
}

// existing layout (sidebar + outlet) for authed admin pages
```

This keeps:
- The same flat-file route structure (no renames, no cascading import changes)
- The auth guard active for every other `/admin/*` route
- The login page free of sidebar chrome (it has its own centered layout)

### Files modified

- `src/routes/admin.tsx` — add `useLocation` import, add `isLoginRoute` short-circuit before the auth check and before the sidebar render

No other files change. No route tree regeneration needed (the file structure stays the same).

### Verification

After the fix:
- `/admin/login` → renders the login form immediately
- `/admin` (no session) → redirects to `/admin/login`
- `/admin` (with valid session) → renders dashboard with sidebar
- `/admin/draw`, `/admin/players`, etc. (no session) → redirect to `/admin/login`

