
## You’re right to be frustrated

This is not a “your phone number isn’t in the DB” issue. The prototype auth flow is still broken because the session is not being persisted after OTP verification.

## Do I know what the issue is?

Yes.

## What the problem actually is

From the current code and runtime evidence:

- `sendOtp` succeeds
- `verifyOtp` succeeds
- `setPlayerSession` returns `{ success: true }`
- the very next `getCurrentPlayer()` call returns `null`
- `_authed.tsx` then redirects to `/login`

So the failure is not OTP, not your number, and not player creation. It is session persistence.

The key mismatch is that the approved fix was to switch to raw request/response cookie headers, but the current `src/utils/session.functions.ts` still uses:

- `getCookie`
- `setCookie`
- `deleteCookie`

That means the real cookie persistence fix was not fully applied. The runtime behavior confirms it.

## Files involved

- `src/utils/session.functions.ts` — main root cause
- `src/routes/verify.tsx` — writes session then navigates
- `src/routes/_authed.tsx` — redirects to `/login` when session is missing
- `src/routes/onboarding.tsx` and `src/routes/renew.tsx` — both depend on session being readable

## Fix plan

### 1. Replace the current cookie helpers with raw header-based session handling
In `src/utils/session.functions.ts`:

- stop using `getCookie`, `setCookie`, `deleteCookie`
- use request header parsing to read cookies
- use explicit `Set-Cookie` response headers to write and clear the session
- keep the simple prototype-safe payload for now

This is the critical fix.

### 2. Make session read/write debuggable
While fixing `session.functions.ts`, add temporary logs for:

- when session is written
- whether request cookies are present on the next request
- whether decode/parse succeeds

That will let me verify the exact handoff instead of guessing again.

### 3. Keep the prototype OTP flow dependency-free
Retain the current prototype behavior:

- any valid Nigerian number can request OTP
- verification accepts `0000`
- no real SMS provider
- no real payment dependency

### 4. Re-check every transition that depends on session
After the session fix, verify these routes all use the same session successfully:

```text
/login
→ /verify
→ /onboarding (new player)
→ /   or /renew
→ /profile
→ logout → /login
```

### 5. Tighten fallback UX so you don’t hit silent loops again
If session is missing after verify, add clearer error handling instead of silently bouncing back to login. That way, if anything regresses, the app explains what failed.

## Expected result after implementation

```text
Enter phone
→ Get OTP
→ Enter 0000
→ Session persists
→ New user goes to onboarding
→ Returning user goes to home
→ Inactive user can renew and continue
→ Profile/logout also work
```

## Why I’m confident this is the right fix

The network trace already proves the sequence:

```text
verifyOtp: success
setPlayerSession: success
getCurrentPlayer: null
```

That isolates the issue to session storage, not OTP, not DB seeding, not missing users.

## What I will change once you approve

- `src/utils/session.functions.ts` — implement raw cookie header session handling
- `src/routes/verify.tsx` — keep navigation flow, add clearer failure handling if needed
- optionally `src/routes/onboarding.tsx` / `src/routes/renew.tsx` / `src/routes/_authed.tsx` only if small follow-up adjustments are needed after the real session fix
