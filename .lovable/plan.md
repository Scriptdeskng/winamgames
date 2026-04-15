
Goal: stop the redirect loop permanently and make the prototype auth flow reliable end-to-end without relying on fragile client-side RPC cookie writes.

What I found:
- The failure is not your phone number, OTP generation, player creation, or subscription setup.
- Preview logs prove this exact sequence:
  ```text
  [session] Wrote session for player: ...
  [session] No session cookie found
  ```
- So the app is writing a session during `setPlayerSession`, but the very next request still has no cookie.
- The weak point is the current design: session creation/clearing happens inside `createServerFn` calls. In this environment, that response path is not persisting the cookie reliably.

Plan to fix it properly:

1. Replace RPC-based login completion with a real server redirect flow
- Add dedicated server routes for auth completion/logout that return an actual HTTP response.
- Move these responsibilities out of `createServerFn` cookie writes:
  - verify OTP
  - set session cookie
  - redirect to `/onboarding` or `/`
  - clear session on logout
- Why: browser-handled redirects with `Set-Cookie` are much more reliable than setting cookies inside a background RPC call and then navigating separately.

2. Restructure session utilities around pure helpers
- Keep session parsing/serialization logic in `src/utils/session.functions.ts` (or a small server-only helper), but stop exposing “write session” as a client-called server function.
- Use the helpers from server routes only:
  ```text
  read cookie from request
  build Set-Cookie header
  clear Set-Cookie header
  ```
- Keep the prototype-safe plain cookie payload for now, with a TODO to sign/encrypt before launch.

3. Update the auth screens to use the new server endpoints
- `src/routes/verify.tsx`
  - submit to the new server auth-complete endpoint instead of calling `setPlayerSession`
  - keep `0000` prototype OTP behavior
  - show explicit failure states instead of silently bouncing
- `src/routes/_authed/profile.tsx`
  - logout should hit a server logout endpoint that clears the cookie in the response, then redirects to `/login`
- `src/routes/onboarding.tsx`
  - after nickname save, refresh the session via a server redirect endpoint or avoid depending on cookie rewrite in a server function

4. Make route protection safer and less surprising
- Keep `_authed.tsx` protection, but add clearer fallback behavior where session-dependent routes can fail.
- For onboarding/renew/home/profile flows, avoid hard assumptions like `session!` where possible and surface meaningful errors when auth state is missing.

5. Verify the whole prototype path, not just one screen
I’ll validate this sequence after implementation:
```text
/login
→ enter valid Nigerian number
→ /verify
→ enter 0000
→ session is created by server response
→ new user: /onboarding
→ save nickname
→ /
→ /profile
→ logout
→ /login

returning user:
→ /login
→ /verify
→ 0000
→ /

inactive user:
→ /login
→ /verify
→ 0000
→ /renew
→ activate prototype subscription
→ /
```

Files I expect to change:
- `src/utils/session.functions.ts` — convert to cookie helper/parsing utilities; remove client-called session write dependency
- `src/utils/auth.functions.ts` — keep OTP/player/subscription logic, but likely stop using it for final cookie persistence step
- `src/routes/verify.tsx` — send user through a real server completion flow
- `src/routes/onboarding.tsx` — avoid fragile post-save session rewrite
- `src/routes/_authed/profile.tsx` — logout through real server response
- likely add one or two auth server route files under `src/routes/api/...` for login completion and logout

Technical detail:
The core fix is architectural, not cosmetic:
```text
Current:
client -> verifyOtp() RPC
client -> setPlayerSession() RPC with Set-Cookie
client -> window.location

Planned:
browser navigation/form submit -> auth server route
server route -> verify player + Set-Cookie + redirect
browser follows redirect with cookie already persisted
```

Expected result:
- No phone-number preloading needed
- No real OTP provider needed
- No PSP/payment dependency needed
- No “success then back to login” loop
- One stable prototype flow you can actually test end-to-end before making adjustments
