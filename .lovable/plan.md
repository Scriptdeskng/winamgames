

# Fix End-to-End Auth Flow and Prototype Sessions

## Root Cause
The `useSession`/`updateSession` from `@tanstack/react-start/server` silently fails to persist cookies in the Worker sandbox environment. `setPlayerSession` returns `{ success: true }` but the cookie is never actually set. When the app navigates to `/onboarding` or `/`, `getCurrentPlayer` returns null, and `_authed.tsx` redirects back to `/login`.

## What Gets Fixed

### 1. Replace iron-session with plain cookie persistence
Rewrite `src/utils/session.functions.ts` to use raw `Set-Cookie`/`Cookie` headers via TanStack Start's `getWebRequest()` and `setResponseHeader()` instead of `useSession`/`updateSession`/`clearSession`. For the prototype, use a simple base64-encoded JSON cookie (no encryption needed — this is a prototype with no real auth secrets). Mark with `// TODO: sign/encrypt before go-live`.

### 2. Auto-renew expired subscriptions on `/renew` (prototype mode)
Update `src/routes/renew.tsx` to call a new server function `renewSubscription` that creates a new active subscription row in `winam_subscriptions` for the selected plan. This lets the prototype flow work end-to-end without carrier billing. The button currently just does `console.log` — it will now actually activate the subscription and redirect to `/`.

### 3. Handle returning players with expired subscriptions
In `verifyOtp` (`src/utils/auth.functions.ts`), for existing players whose subscription has expired, auto-create a fresh daily subscription so they don't immediately land on `/renew` every time. This keeps the prototype smooth.

### 4. Ensure onboarding → home flow works
The onboarding page reads session via `getCurrentPlayer()`. With the cookie fix, this will work. No additional changes needed beyond the session fix.

## Files Changed

| File | Change |
|------|--------|
| `src/utils/session.functions.ts` | Replace `useSession`/`updateSession`/`clearSession` with raw cookie read/write using `getWebRequest()` and `setResponseHeader()` |
| `src/utils/auth.functions.ts` | Auto-renew expired subscription for returning players in `verifyOtp` |
| `src/routes/renew.tsx` | Add working `renewSubscription` server function; Subscribe button creates real subscription row and redirects to `/` |

## Technical Details

Session cookie approach:
```typescript
// Write: base64-encode JSON, set as cookie
const payload = Buffer.from(JSON.stringify(data)).toString("base64");
setResponseHeader("Set-Cookie", `winam-session=${payload}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);

// Read: parse cookie header, decode base64
const cookies = getWebRequest().headers.get("cookie");
// extract winam-session value, JSON.parse(atob(value))
```

Returning player auto-renew in `verifyOtp`:
```typescript
if (existingPlayer) {
  // Check if subscription is expired, auto-create fresh daily if so
  const { data: activeSub } = await supabaseAdmin
    .from("winam_subscriptions")
    .select("id")
    .eq("player_id", existingPlayer.id)
    .eq("status", "active")
    .gte("valid_until", new Date().toISOString())
    .limit(1)
    .maybeSingle();

  if (!activeSub) {
    // Auto-renew daily subscription for prototype
    // ... insert new daily sub with WAT expiry
  }
}
```

## Expected Flow After Fix
```text
/login → enter phone → /verify → enter 0000 → session cookie set →
  → new player: /onboarding → set nickname → / (home)
  → returning player: / (home) directly
  → expired sub: /renew → tap Subscribe → / (home)
```

