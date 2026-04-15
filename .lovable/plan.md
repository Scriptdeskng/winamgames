

# Phase 4 — Auth Wiring, Session Persistence & Secrets Setup

## Overview

Wire login/verify/onboarding to real server functions, persist player sessions via encrypted cookies, replace hardcoded `PLAYER_ID`, add subscription gate, and set up all secrets properly with env vars (no hardcoding).

## Secrets approach

All secrets read from `process.env` in server functions. No Edge Functions needed — this app uses TanStack Start server functions which run in the Worker runtime with `process.env`.

**Secrets to add via the add_secret tool:**
- `SESSION_SECRET` — a random 32+ char string for cookie encryption (generated, not user-provided)
- `TERMII_API_KEY` → `dev_placeholder_termii_key`
- `TERMII_SENDER_ID` → `dev_placeholder_sender_id`
- `FORTHSOFT_WEBHOOK_SECRET` → `dev_placeholder_forthsoft_secret`

`SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL` are already configured automatically.

**OTP SMS stub** in `auth.functions.ts`: Since `TERMII_API_KEY` is a placeholder, the SMS delivery remains a `console.log` with a clear TODO comment referencing the Termii endpoint and required env vars.

## What gets built

### 1. Session management (`src/utils/session.functions.ts`)
Server functions using TanStack Start's `useSession`/`updateSession`/`clearSession`:
- `getCurrentPlayer` — reads encrypted cookie, returns `{ playerId, msisdnLast4, nickname }` or `null`
- `setPlayerSession` — writes player data into cookie after OTP verification
- `clearPlayerSession` — logout
- `getSubscriptionStatus` — checks `winam_subscriptions` for active/grace status

Session secret: `process.env.SESSION_SECRET` (added via add_secret tool).

### 2. Wire login → `sendOtp`
`src/routes/login.tsx`: Call `sendOtp()` on submit. Navigate to `/verify` on success, show rate-limit errors.

### 3. Wire verify → `verifyOtp` + session
`src/routes/verify.tsx`: Call `verifyOtp()`, then `setPlayerSession()` to persist cookie. Navigate to `/onboarding` if new, `/` if returning. Wire "Resend code" to `sendOtp`.

### 4. Wire onboarding → `setNickname`
Add `setNickname` server function to `src/utils/auth.functions.ts`. Update `winam_players.nickname`. Navigate to `/`.

### 5. Auto-create subscription on first login
In `verifyOtp`, after creating a new player, insert a `winam_subscriptions` row with `status: 'active'` and `valid_until` 30 days out. Marked with TODO for Forthsoft billing webhook replacement.

### 6. Update OTP SMS stub
Update the TODO comment in `sendOtp` to reference Termii specifically:
```
// TODO: SMS_PROVIDER — replace with Termii API call before go-live
// Termii endpoint: https://api.ng.termii.com/api/sms/send
// Required: TERMII_API_KEY, TERMII_SENDER_ID env vars
console.log(`OTP for ${last4}: ${otpCode}`);
```

### 7. Auth context via router
- `src/router.tsx` — add `playerId: string | null` to context
- `src/routes/__root.tsx` — call `getCurrentPlayer` in `beforeLoad`, pass into context

### 8. Subscription gate (`src/routes/_authed.tsx`)
Pathless layout route with `beforeLoad`:
- No session → redirect to `/login`
- Session exists → check subscription → inactive → redirect to `/renew`
- Renders `<Outlet />` for child routes

### 9. Move protected routes under `_authed/`
Move 8 routes into `src/routes/_authed/`:
- `index.tsx`, `checkmate.tsx`, `wisdomdrop.tsx`, `results.tsx`, `profile.tsx`, `leaderboard.tsx`, `entries.tsx`, `winners.tsx`

Remove hardcoded `PLAYER_ID` from all — read from route context instead.

### 10. Forthsoft webhook route (`src/routes/api/forthsoft-webhook.ts`)
Server route with full HMAC-SHA256 validation using `process.env.FORTHSOFT_WEBHOOK_SECRET`. Uses Web Crypto API (compatible with Worker runtime). Stub handler that logs payload and updates subscription status. The validation logic works with the placeholder secret in dev and will work with the real secret when swapped.

## File changes

**New files:**
- `src/utils/session.functions.ts`
- `src/routes/_authed.tsx`
- `src/routes/_authed/index.tsx` (moved from `src/routes/index.tsx`)
- `src/routes/_authed/checkmate.tsx` (moved)
- `src/routes/_authed/wisdomdrop.tsx` (moved)
- `src/routes/_authed/results.tsx` (moved)
- `src/routes/_authed/profile.tsx` (moved)
- `src/routes/_authed/leaderboard.tsx` (moved)
- `src/routes/_authed/entries.tsx` (moved)
- `src/routes/_authed/winners.tsx` (moved)
- `src/routes/api/forthsoft-webhook.ts`

**Modified files:**
- `src/router.tsx` — add playerId to context
- `src/routes/__root.tsx` — beforeLoad with getCurrentPlayer
- `src/utils/auth.functions.ts` — add setNickname, subscription insert, update OTP TODO
- `src/routes/login.tsx` — wire to sendOtp
- `src/routes/verify.tsx` — wire to verifyOtp + session
- `src/routes/onboarding.tsx` — wire to setNickname

**Deleted files (moved to `_authed/`):**
- `src/routes/index.tsx`, `checkmate.tsx`, `wisdomdrop.tsx`, `results.tsx`, `profile.tsx`, `leaderboard.tsx`, `entries.tsx`, `winners.tsx`

**No database migrations needed.**

