

# Phase 4 — Auth Wiring, Session Persistence & Subscription Gate

## Overview

Wire the login/verify/onboarding screens to real server functions, persist player sessions via encrypted cookies, replace all hardcoded `PLAYER_ID` references with the authenticated player ID, and add a subscription gate that redirects inactive subscribers to `/renew`.

## What gets built

### 1. Session persistence via encrypted cookies

Create `src/utils/session.functions.ts` with server functions using TanStack Start's `useSession`/`updateSession`/`clearSession` from `@tanstack/react-start/server`:
- `getCurrentPlayer` — reads the encrypted session cookie, returns `{ playerId, msisdnLast4, nickname }` or `null`
- `setPlayerSession` — called after OTP verification, writes player ID into the encrypted cookie
- `clearPlayerSession` — logout, clears the cookie
- `getSubscriptionStatus` — checks `winam_subscriptions` for active/grace status for the current player

Session secret stored via `process.env.SESSION_SECRET` (need to add this secret).

### 2. Wire login screen to `sendOtp`
- `src/routes/login.tsx`: Replace the `console.log` TODO with actual `sendOtp()` call. On success, navigate to `/verify`. On rate-limit error, show the error message.

### 3. Wire verify screen to `verifyOtp`
- `src/routes/verify.tsx`: Replace the `console.log` TODO with actual `verifyOtp()` call. On success, call `setPlayerSession()` to persist the session cookie, then navigate to `/onboarding` (if `needsOnboarding`) or `/` (if returning player).
- Wire the "Resend code" button to call `sendOtp` again.

### 4. Wire onboarding screen to save nickname
- `src/routes/onboarding.tsx`: Create a `setNickname` server function in `src/utils/auth.functions.ts` that updates `winam_players.nickname` using `supabaseAdmin`. Wire the form to call it, then navigate to `/`.

### 5. Auth context via router context
- Update `src/router.tsx` to add `playerId: string | null` to router context.
- Update `src/routes/__root.tsx` to call `getCurrentPlayer` in `beforeLoad`, pass result into context.
- All child routes access `playerId` from route context instead of the hardcoded constant.

### 6. Replace all hardcoded PLAYER_ID references
Files to update (remove the `const PLAYER_ID = "..."` line, read from route context instead):
- `src/routes/index.tsx`
- `src/routes/checkmate.tsx`
- `src/routes/wisdomdrop.tsx`
- `src/routes/profile.tsx`

For game routes, pass `playerId` from route context into `useGameSession()` and loader calls.

### 7. Subscription gate
- Create a pathless layout route `src/routes/_authed.tsx` with `beforeLoad`:
  - If no session → redirect to `/login`
  - If session exists → check subscription status via `getSubscriptionStatus`
  - If subscription inactive → redirect to `/renew`
- Move protected routes under `_authed`:
  - `src/routes/_authed/index.tsx` (home)
  - `src/routes/_authed/checkmate.tsx`
  - `src/routes/_authed/wisdomdrop.tsx`
  - `src/routes/_authed/results.tsx`
  - `src/routes/_authed/profile.tsx`
  - `src/routes/_authed/leaderboard.tsx`
  - `src/routes/_authed/entries.tsx`
  - `src/routes/_authed/winners.tsx`
- `/login`, `/verify`, `/onboarding`, `/renew` stay as public routes.

### 8. Auto-create subscription on first login
- In `verifyOtp`, after creating a new player, also insert a row in `winam_subscriptions` with `status: 'active'` and a `valid_until` 30 days out (stubbed — TODO: Forthsoft billing webhook replaces this).

### 9. Add SESSION_SECRET
- Use the `add_secret` tool to request the user set a `SESSION_SECRET` environment variable for cookie encryption.

## Technical details

**New files:**
- `src/utils/session.functions.ts` — session cookie management
- `src/routes/_authed.tsx` — auth + subscription gate layout

**Renamed/moved files (8 routes):**
- `src/routes/index.tsx` → `src/routes/_authed/index.tsx`
- `src/routes/checkmate.tsx` → `src/routes/_authed/checkmate.tsx`
- `src/routes/wisdomdrop.tsx` → `src/routes/_authed/wisdomdrop.tsx`
- `src/routes/results.tsx` → `src/routes/_authed/results.tsx`
- `src/routes/profile.tsx` → `src/routes/_authed/profile.tsx`
- `src/routes/leaderboard.tsx` → `src/routes/_authed/leaderboard.tsx`
- `src/routes/entries.tsx` → `src/routes/_authed/entries.tsx`
- `src/routes/winners.tsx` → `src/routes/_authed/winners.tsx`

**Modified files:**
- `src/router.tsx` — add `playerId` to context
- `src/routes/__root.tsx` — `beforeLoad` calls `getCurrentPlayer`
- `src/utils/auth.functions.ts` — add `setNickname` server function, add subscription insert in `verifyOtp`
- `src/routes/login.tsx` — wire to `sendOtp`
- `src/routes/verify.tsx` — wire to `verifyOtp` + session persistence
- `src/routes/onboarding.tsx` — wire to `setNickname`

**Secret needed:** `SESSION_SECRET` (random 32+ char string for cookie encryption).

**No database migrations needed.** All tables already exist.

**No new npm dependencies.**

