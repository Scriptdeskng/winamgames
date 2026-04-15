

# WinamGames — VAS Platform Build Plan

This is a large-scale project. I will break it into sequential phases, each delivering a working increment. Given the scope (15+ screens, 13 database tables, 4 server functions, complex game logic), I recommend building in 5 phases.

---

## Phase 1 — Foundation (this approval)

**What gets built:**

1. **Design system**: Apply the Winam "Refined Arena" theme to `styles.css` — emerald green signature color, dark mode default, OKLCH tokens, glass surfaces, custom shadows, 10px base radius.

2. **App shell**: Bottom tab navigation (Home, Games, Leaderboard, Profile), mobile-first layout capped at 430px, dark mode by default on `<html>`.

3. **Supabase schema**: Enable Lovable Cloud and create all 13 tables with RLS policies, enums, and security constraints (append-only ledger, restricted OTP access). Seed `winam_platform_config`.

4. **Auth flow (MSISDN + OTP)**: Three screens — MSISDN entry, OTP verification, onboarding (nickname). Server functions for `send-otp` and `verify-otp` with SHA-256 hashing, rate limiting (5 attempts / 15 min), SMS stubbed with `console.log` + TODO marker.

5. **Subscription gate**: Middleware that checks subscription status before granting access. Renewal screen for suspended/cancelled/churned users.

6. **Route files**: Create all route stubs — `/`, `/checkmate`, `/wisdomdrop`, `/results`, `/leaderboard`, `/entries`, `/winners`, `/profile`.

---

## Phase 2 — Games & Session Logic

- CheckMate game screen (FEN rendering, tap-to-move, 44px touch targets, timer, lives, hints)
- WisdomDrop game screen (proverb display, 4-option selection, timer, lives, hints)
- Session management (start/close, puzzle attempts tracking)
- `close-session` server function with full entry calculation
- Results screen
- Mock puzzle data (FEN positions, proverbs with answers)

## Phase 3 — Economy & Progression

- Coin balance, hint purchasing, overflow conversion
- Rank system (XP tracking, 6 tiers, visual display)
- Mission system (daily assignment, condition evaluation, rewards)
- Streak system (WAT calendar day tracking, bonus calculation)

## Phase 4 — Draw & Leaderboard

- Draw week lifecycle (open → locked → drawn → settled)
- Entry ledger display (My Entries screen)
- Leaderboard (today top 10, all-time)
- Winners screen (past draw results)
- Draw execution logic with seeded random

## Phase 5 — Webhooks & Hardening

- Forthsoft webhook handler (HMAC-SHA256 validation, subscription state transitions, grace period)
- Device fingerprinting and fraud flagging
- Puzzle speed flagging (<3000ms)
- Final security audit (RLS, append-only constraints)

---

## Technical Details

**Dependencies to add**: `chess.js` (FEN parsing/move validation for CheckMate client-side display only — solution validation stays server-side).

**Database**: Lovable Cloud (Supabase). All 13 tables created via migrations. Custom enums for subscription status and rank tiers. RLS policies enforce player-scoped access. Entry ledger and game sessions are append-only (no UPDATE/DELETE for app role).

**Server functions** (TanStack Start `createServerFn`, NOT Edge Functions):
- `send-otp` and `verify-otp` in `src/utils/auth.functions.ts`
- `close-session` in `src/utils/game.functions.ts`
- Forthsoft webhook as a server route at `/api/webhooks/forthsoft`

**Auth middleware**: Custom middleware using `winam_players` + `winam_subscriptions` tables (not Supabase Auth — this is MSISDN-based with custom OTP).

**Timestamps**: All stored UTC. WAT (UTC+1) offset applied in server functions for streak/mission/draw calculations.

**File structure**:
```text
src/
  components/
    layout/          Shell, BottomNav, SubscriptionGate
    auth/            MsisdnEntry, OtpVerification, Onboarding
    games/           ChessBoard, ProverbCard, Timer, LivesDisplay, HintButton
    dashboard/       DrawCountdown, EntryCard, MissionCard, StreakBadge
    profile/         RankBadge, XpBar, CoinBalance
  routes/
    __root.tsx       Dark mode shell, 430px max-width
    index.tsx        Home dashboard
    checkmate.tsx    Chess puzzle game
    wisdomdrop.tsx   Proverb game
    results.tsx      Session results
    leaderboard.tsx  Rankings
    entries.tsx      My entries
    winners.tsx      Past draws
    profile.tsx      Player profile
    login.tsx        MSISDN entry
    verify.tsx       OTP verification
    onboarding.tsx   Nickname setup
    renew.tsx        Subscription renewal
  utils/
    auth.functions.ts
    auth.server.ts
    game.functions.ts
    game.server.ts
    subscription.functions.ts
    subscription.server.ts
    draw.server.ts
    missions.server.ts
```

---

**Shall I proceed with Phase 1?** This will set up the design system, database schema, auth flow, subscription gate, and app shell — giving us a working foundation for all subsequent phases.

