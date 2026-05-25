# WinamGames — CTO Handover Document

## Project overview

WinamGames is a mobile-first skill gaming platform for MTN Nigeria subscribers. Players solve chess puzzles (CheckMate) and African proverb challenges (WisdomDrop) to earn weekly draw tickets — with real cash and airtime prizes every Sunday.

**Monorepo:** `/Users/edibekwe/winam-games/`
**Frontend:** `apps/web/` — Next.js 15, TypeScript strict, Tailwind CSS v4, shadcn/ui, Framer Motion, React Query v5, Zustand
**Dev backend:** Supabase — `srzuhckuwpkgjqdijylb.supabase.co`
**Production backend (your territory):** FastAPI + PostgreSQL + SQLAlchemy + Alembic + Pydantic

---

## What is built and working

### Player-facing screens (complete)
- `/login` — phone entry, Nigerian number validation
- `/verify` — 4-digit OTP, routes to `/app` or `/onboarding`
- `/onboarding` — nickname creation
- `/app` — home screen (draw countdown, streak/rank strip, missions, play now cards, announcement modal)
- `/checkmate` — full chess puzzle game with hints, auto-advance, feedback
- `/wisdomdrop` — African proverbs game with 3 hint tiers
- `/results` — post-round results with ticket breakdown and proverb review
- `/leaderboard` — weekly/daily tabs with podium and player standing
- `/profile` — player stats, rank, XP, coins, streak, dark/light mode toggle
- `/entries` — ticket history by week, collapsible with source labels
- `/winners` — published draw results with cash podium
- `/kyc` — prize claim flow (identity + bank details, 2-step)
- `/renew` — subscription renewal (weekly/daily plan cards)
- `/support` — FAQ accordion + contact links (email + WhatsApp)
- `/home` — public marketing landing page (permanently dark mode)

### Admin panel (complete)
- `/admin/login` — admin authentication
- `/admin` — dashboard with analytics, draw week status, period filter, completion breakdown, chart scaffold
- `/admin/players` — player list with search and pagination
- `/admin/players/[id]` — player detail with sessions, tickets, KYC, missions, adjustment actions
- `/admin/draw` — draw management (lock, execute, publish, settle + history)
- `/admin/winners` — winner management with KYC verification and payment tracking
- `/admin/missions` — mission CRUD with condition/reward types
- `/admin/content` — banners, announcements (with live preview + orientation), support FAQs
- `/admin/config` — platform config key-value editor
- `/admin/help` — admin user guide with 6 articles

### Key architecture
- All API calls go through `lib/api.ts` — swap Supabase for FastAPI in one place
- All game logic in `hooks/useGameSession.ts` — clean handover point
- Admin session separate from player session via `lib/admin-session.ts`
- `completion_reason` column on `winam_game_sessions` — tracks completed/lives_out/exited

---

## Your handover items

### Priority 1 — Security (must fix before production)

**1. OTP bypass**
File: `components/auth/VerifyForm.tsx`
The `verifyOtp` function is a stub that always returns true. Replace with real MTN OTP verification via Forthsoft or your chosen provider.

**2. Player session security**
File: `lib/session.ts`
Player session is stored in localStorage. Migrate to httpOnly cookie to prevent XSS token theft. The `sessionStore.get()` and `sessionStore.set()` calls are the swap points.

**3. Admin session security**
File: `lib/admin-session.ts`
Admin session is also localStorage. Migrate to httpOnly cookie with shorter expiry. Add server-side session verification to replace the dev stub in `app/(admin)/admin/layout.tsx` — look for `// CTO TODO: replace with real server-side session verification`.

**4. RLS policies**
All Supabase tables currently have dev-open RLS (`using (true) with check (true)`). Replace with player-scoped policies before production:
- `winam_players` — player can only read/update their own row
- `winam_game_sessions` — player can only read their own sessions
- `winam_tickets` — player can only read their own tickets
- `winam_kyc` — player can only read/write their own KYC
- `winam_player_missions` — player can only read their own missions
- Admin tables — service role only

**5. NIN/BVN encryption**
File: `components/pages/KycPage.tsx`
The `id_number` field in Step 1 (identity) is stored as plaintext in `winam_kyc`. Encrypt before storing using AES-256 or equivalent. The CTA says "password field" in the UI but no encryption is applied.

---

### Priority 2 — Core backend (required for production)

**6. Forthsoft webhook — subscription renewal**
File: `components/pages/RenewPage.tsx`
Look for `// CTO TODO: implement renewSubscription via Forthsoft webhook`. The UI shell is complete — wire the Subscribe button to your Forthsoft billing integration. The plan (daily/weekly) and player ID are available as state.

**7. Paystack bank verification**
File: `components/pages/KycPage.tsx`
Step 2 (bank details) has a mock 1.5s verification delay. Replace with real Paystack account resolution API call to verify the account number against the selected bank before submission.

**8. closeSession → single API endpoint**
File: `hooks/useGameSession.ts` — `closeSession()` function
Currently makes 3 sequential Supabase calls (insert session, insert tickets, update player). Replace with single `POST /api/v1/sessions/{id}/close` that handles all writes atomically. The frontend passes:
```typescript
{
  sessionId, playerId, gameType, drawWeekId,
  puzzlesSolved, hintsUsed, durationSeconds,
  completionReason: "completed" | "lives_out" | "exited",
  servedPuzzleIds: string[]
}
```
And expects back:
```typescript
{
  entries, baseEntries, streakBonus, coins, xp,
  streak, weekTotal, weekCap, rankTier, previousRank,
  completedMissions
}
```

**9. Puzzle selection system**
File: `hooks/useGameSession.ts` — `startSession()` function
Currently serves random puzzles with no deduplication or difficulty management. Replace with `POST /api/v1/sessions/start` implementing:

New table needed:
```sql
create table winam_puzzle_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references winam_players(id),
  puzzle_id text not null,
  served_at timestamptz default now()
);
create index on winam_puzzle_history(player_id, puzzle_id);
```

Difficulty mix by rank tier:

CheckMate (difficulty column: 1=easy, 2=medium, 3=hard):
- starter: 7 easy, 2 medium, 1 hard
- recruit: 5 easy, 4 medium, 1 hard
- sergeant: 3 easy, 5 medium, 2 hard
- veteran+: 1 easy, 5 medium, 4 hard

WisdomDrop (difficulty column: beginner/intermediate/advanced):
- starter: 7 beginner, 2 intermediate, 1 advanced
- recruit: 5 beginner, 4 intermediate, 1 advanced
- sergeant: 3 beginner, 5 intermediate, 2 advanced
- veteran+: 1 beginner, 5 intermediate, 4 advanced

Selection logic:
1. Fetch player rank
2. Fetch seen puzzle IDs from `winam_puzzle_history` for this player + game type
3. Exclude seen puzzles from pool
4. Bucket by difficulty, fill according to rank mix
5. Cascade fill if a tier is short
6. If unseen pool < 15, reset player history for that game type and start fresh
7. Insert selected puzzle IDs into `winam_puzzle_history`

Reference implementation: `~/Downloads/winamgames-main/src/utils/game.functions.ts` lines 295-515

**10. Streak logic**
Streak is stored in `winam_players.streak` but not updated server-side. Implement in `POST /api/v1/sessions/{id}/close`:
- Compare `session_date_wat` to player's `streak_last_date`
- If consecutive day: increment streak, award streak bonus tickets
- If same day: no change
- If gap > 1 day: reset streak to 1
- Update `streak_last_date` to today

Streak bonus ticket tiers (from game design):
- 3-day streak: +1 bonus ticket per round
- 7-day streak: +2 bonus tickets per round
- 14-day streak: +3 bonus tickets per round

**11. Mission evaluation**
**11. Mission evaluation**
File: `winam_player_missions` is currently manually seeded for the test player.
Implement in `POST /api/v1/sessions/{id}/close`:

**Supported condition types** (defined in `apps/web/types/index.ts` — Mission interface):

`puzzles_solved`
- Compare puzzles solved in this session against `condition_target`
- Filter by `game_type` if set on the mission (null = both games count)
- Repeatable missions: evaluate per session, reset on next session open
- Non-repeatable missions: track lifetime cumulative count across all sessions in `winam_player_missions.progress`
- When `progress >= condition_target`: set `completed = true`, set `completed_at`, award tickets

`streak_day`
- Evaluate after streak logic runs (item 10 above)
- Compare player's current streak value against `condition_target`
- Always `game_type = null` — streak is cross-game
- Non-repeatable — complete once per streak run (do not re-award if player maintains streak beyond target)
- Reset completion if streak breaks and player re-achieves the target

`no_hints`
- Count puzzles completed with `hints_used = 0` in this session
- Filter by `game_type` if set on the mission
- Repeatable missions: evaluate per session count
- Non-repeatable missions: track lifetime cumulative no-hint puzzles in `winam_player_missions.progress`
- When `progress >= condition_target`: set `completed = true`, award tickets

**Evaluation flow (per session close):**
1. Fetch all active missions from `winam_missions`
2. Fetch or create `winam_player_missions` rows for this player
3. For each mission, evaluate based on condition_type logic above
4. Update `progress` on each relevant `winam_player_missions` row
5. For newly completed missions: set `completed = true`, `completed_at = now()`
6. Insert ticket award into `winam_tickets` with `source = 'mission'` for each newly completed mission
7. Return `completedMissions` array in session close response (frontend displays on results screen)

**reward_type note:** All current missions use `reward_type = 'ticket'`. The `coins` type is defined in the Mission interface but not yet surfaced in the results UI — implement ticket awards only for now.

**Mission seed data:**
A production-ready SQL seed file (`winam_missions_seed.sql`) containing 27 additional missions has been prepared. Import into production after the `winam_missions` table is migrated:
- 16 `puzzles_solved` missions (progressive targets, both games and cross-game)
- 7 `no_hints` missions (scaled targets, both games and cross-game)
- 4 `streak_day` missions (10, 14, 21, 30 day milestones)
- Mix of repeatable (7) and non-repeatable (20)
- All `reward_type = 'ticket'`

The seed file is stored at: `winam_missions_seed.sql` (share with CTO alongside puzzle export)


**12. Coin sync**
File: `hooks/useGameSession.ts`
`coinBalance` is tracked locally in the hook and updated optimistically on hint purchases. It can drift from the database. In `POST /api/v1/sessions/{id}/close`, return the authoritative coin balance from the DB and update the player's local session.

---

### Priority 3 — Infrastructure

**13. Admin subdomain**
Currently at `/admin` on the same domain. Move to `admin.winamgames.com` before production. Options:
- Separate Next.js deployment pointing at `app/(admin)/` route group
- Next.js middleware routing `admin.winamgames.com` to `/admin/*` with IP restriction
Add IP allowlisting and hardened auth at the middleware level.

**14. Draw automation**
The draw lifecycle (lock → execute → publish → settle) is currently manual via the admin panel. The reference prototype triggers on player sessions — first session after 19:50 WAT triggers lock, first session after 20:00 WAT triggers execute. Implement as a server-side cron or as session middleware in FastAPI. The manual admin controls remain as fallback.

**15. Payment tracking enhancements**
Current `winam_winners.payment_status` is manual. Enhancements needed:
- Add `paid_at` timestamptz column
- Add `paid_by` uuid column (admin ID) for audit trail
- Bulk mark-paid endpoint for airtime tier winners
- Forthsoft webhook to auto-update airtime winners when disbursed

**16. Announcement image hosting**
File: `components/admin/ContentPage.tsx` — Announcements tab
Currently accepts a URL string. Replace with direct image upload to S3 or Cloudflare R2 with CDN delivery. The `image_url` column in `winam_announcements` stores the final CDN URL — no schema change needed, just a file upload UI replacing the URL input field.

**17. Landing page winners feed**
File: `components/pages/LandingPage.tsx` — `WinnersSection`
Currently renders hardcoded winner data. Wire to `GET /api/v1/draws/latest-winners` returning:
```typescript
{
  draw_date: string,
  winners: [{ position: number, phone_masked: string, entry_id: string, prize: string }]
}
```

**18. Dashboard stats endpoint**
File: `components/admin/DashboardPage.tsx`
Currently makes 3-4 separate Supabase queries for stat cards. Replace with `GET /api/v1/admin/stats` returning all numbers in one call. Server-side aggregation is faster and reduces client-side query complexity.

---

### Priority 4 — Future features

**19. Game adapter pattern**
File: `hooks/useGameSession.ts`
The hook handles both games via if/else branching. When adding a third game, refactor to a `GameAdapter` interface pattern so each game provides its own `fetchPuzzles`, `validateAnswer`, and `getHint` implementation. The hook stays unchanged — new game = new adapter file. Agreed to do this when a third game is planned.

**20. AI support chat**
Foundation in place: FAQs in `winam_faqs`, support page at `/support`, Anthropic API accessible. When ready: add a chat interface on the support page that sends player questions + FAQ context to Claude and responds in plain language. Players get instant answers, zero support inbox volume.

**21. msisdn_first4 + msisdn_last3**
Needed for phone masking on the public winners screen (e.g. `080***91`). Currently `msisdn_last4` is stored — add `msisdn_first4` when real auth is wired.

**22. Leaderboard tiebreaker**
Current sort: puzzles DESC only. Add timestamp as secondary sort to break ties consistently.

---

## API contract reference

All routes versioned at `/api/v1/[resource]`. Frontend calls go through `lib/api.ts` — swap base URL and headers there to point at FastAPI.

Key endpoints to implement:
POST   /api/v1/sessions/start
POST   /api/v1/sessions/{id}/close
GET    /api/v1/draws/latest-winners
GET    /api/v1/admin/stats
GET    /api/v1/admin/players
GET    /api/v1/admin/players/{id}
POST   /api/v1/admin/players/{id}/flag
POST   /api/v1/admin/players/{id}/adjust-coins
POST   /api/v1/admin/players/{id}/adjust-xp
POST   /api/v1/admin/draw/{id}/lock
POST   /api/v1/admin/draw/{id}/execute
POST   /api/v1/admin/draw/{id}/publish
POST   /api/v1/admin/draw/{id}/settle
POST   /api/v1/admin/winners/{id}/verify-kyc
POST   /api/v1/admin/winners/{id}/mark-paid

---

## Schema additions made during build

These columns were added to the Supabase schema during development and must be reflected in your production PostgreSQL migrations:

```sql
-- winam_players
alter table winam_players add column msisdn_last4 text;
alter table winam_players add column is_flagged boolean default false;

-- winam_draw_weeks
alter table winam_draw_weeks add column entry_lock_at timestamptz;

-- winam_game_sessions
alter table winam_game_sessions add column draw_week_id uuid;
alter table winam_game_sessions add column session_date_wat text;
alter table winam_game_sessions add column completion_reason text check (completion_reason in ('completed', 'lives_out', 'exited'));

-- winam_kyc
alter table winam_kyc add column bank_name text;
alter table winam_kyc add column account_number text;
alter table winam_kyc add column account_name text;
alter table winam_kyc add column verified_at timestamptz;
alter table winam_kyc add column verified_by uuid;
alter table winam_kyc add column bank_details_submitted_at timestamptz;

-- winam_missions
alter table winam_missions add column game_type text;

-- winam_winners
alter table winam_winners add column payment_status text;

-- winam_announcements (new table)
create table winam_announcements (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  cta_label text,
  cta_url text,
  frequency text not null default 'once_per_week' check (frequency in ('every_login', 'once_per_week', 'once_only')),
  orientation text not null default 'portrait' check (orientation in ('portrait', 'landscape')),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- winam_faqs (new table)
create table winam_faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- winam_platform_config additions
insert into winam_platform_config (key, value, description, category) values
('support_email', 'support@winamgames.com', 'Support email on player support page', 'support'),
('support_whatsapp', '234xxxxxxxxxx', 'WhatsApp number for player support', 'support'),
('free_session_mode', '{"enabled": false, "sessions_per_day": 1, "earns_tickets": false}', 'Free play mode config', 'game'),
('prize_cash_tiers', '[{"position": 1, "prize_amount": 35000}, {"position": 2, "prize_amount": 10000}, {"position": 3, "prize_amount": 5000}]', 'Cash prize tiers', 'draw'),
('prize_airtime_tiers', '[{"count": 75, "amount": 200}]', 'Airtime prize tiers', 'draw');
```

---

## Seed data files

The following production-ready SQL seed files have been prepared and should be imported after migrations:

| File | Table | Records | Notes |
|---|---|---|---|
| `winam_puzzles_prod_export.sql` | `winam_checkmate_puzzles`, `winam_wisdom_puzzles` | 10,512 + 650 | Full puzzle export from dev Supabase. Run via psql. |
| `winam_missions_seed.sql` | `winam_missions` | 27 | New missions across all 3 condition types. Safe to run against existing data. |

Import order:
1. Run migrations (schema first)
2. Import `winam_puzzles_prod_export.sql`
3. Import `winam_missions_seed.sql`

---

## Dev environment

**Frontend:** `cd apps/web && npm run dev` → `localhost:3000`
**Test player:** ID `a1b2c3d4-e5f6-7890-abcd-ef1234567890`, nickname NaijaChamp, phone `08137498991`
**Admin login:** any valid email + password 6+ chars (dev stub — replace with real auth)
**Supabase:** all tables dev-open RLS, replace before production
