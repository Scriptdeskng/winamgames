

# Switch Session to localStorage

## Problem
Server-side cookie persistence keeps failing in the Worker SSR environment. Every fix attempt has failed because `Set-Cookie` headers from server functions and server routes are not reliably persisted by the browser in this runtime.

## Solution
Move session state to localStorage. Keep server functions for database operations only (player creation, nickname, subscriptions, games, missions). Session = client-side concern only.

## Architecture Change
```text
Before: server writes cookie → SSR reads cookie → route guard
After:  client writes localStorage → client reads localStorage → client-side guard
```

## Files to create

**`src/lib/session.ts`** — localStorage session helpers
- `getSession(): { playerId, msisdnLast4, nickname } | null`
- `setSession(data)` 
- `clearSession()`
- `updateSessionNickname(nickname)`

## Files to change

**`src/routes/_authed.tsx`** — Remove server `beforeLoad`. Use client-side component that reads localStorage and redirects to `/login` if missing. Still call `getSubscriptionStatus` server function (DB query) but from client side.

**`src/routes/verify.tsx`** — After `verifyOtp()` succeeds, store result in localStorage via `setSession()`, then `navigate()` to `/onboarding` or `/`. No fetch to `/api/auth-complete`.

**`src/routes/onboarding.tsx`** — Read session from localStorage. After `setNickname()` succeeds, update localStorage and navigate to `/`.

**`src/routes/renew.tsx`** — Read session from localStorage instead of server `beforeLoad`. After `renewSubscription()` succeeds, navigate to `/`.

**`src/routes/_authed/profile.tsx`** — Read from localStorage. Logout = `clearSession()` + navigate to `/login`.

**`src/routes/_authed/index.tsx`** — Read playerId from localStorage instead of server session.

**`src/routes/login.tsx`** — Check localStorage on mount; if session exists, redirect to `/`.

**`src/utils/session.functions.ts`** — Remove `getCurrentPlayer` server function. Keep `getSubscriptionStatus` (needs DB).

## Files to delete

- `src/routes/api/auth-complete.ts`
- `src/routes/api/auth-session-update.ts`  
- `src/routes/api/auth-logout.ts`
- `src/utils/session.server.ts`

## What stays on the backend
All database operations remain as server functions:
- `verifyOtp`, `sendOtp`, `setNickname`, `renewSubscription` (auth.functions.ts)
- `getSubscriptionStatus` (session.functions.ts)
- All game/mission server functions (game.functions.ts, mission.functions.ts)

## SSR handling
Since localStorage is not available during SSR, `_authed.tsx` will render a loading state server-side and check auth client-side with `useEffect`. This avoids the cookie problem entirely.

## Expected flow after fix
```text
/login → enter phone → /verify → enter 0000 
→ verifyOtp() server call succeeds
→ localStorage.setItem("winam-session", JSON.stringify({...}))
→ navigate to /onboarding or /
→ _authed reads localStorage → renders page
```

