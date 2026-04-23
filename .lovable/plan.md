

## WinamGames Admin Panel

A separate password-protected admin section sharing the same TanStack Start app and Supabase database. All admin code lives in **new files only**. Two existing files are touched: `src/routes/_authed/winners.tsx` (wire to real winners) and `src/routes/__root.tsx` (no structural change — admin routes auto-register via the file-based router; this file only needs touching if tabs/router context need adjusting, otherwise left untouched).

### Architecture

- **Auth model:** Email + bcrypt password against `winam_admin_users`. Session in `localStorage` under `winam_admin_session` (key separate from player `winam-session`). No collision with player MSISDN/OTP flow.
- **Route protection:** `_admin.tsx` layout route runs `verifyAdminSession` in a client `beforeLoad`-equivalent (router context-free; mirrors the existing `_authed.tsx` pattern using `useEffect` + `navigate`). Redirects to `/admin/login` if missing/invalid.
- **Server boundary:** Every admin server function calls `assertAdmin(adminId)` before any DB op. Writes go through `supabaseAdmin` (service role, bypasses RLS). All mutations append to `winam_admin_audit_log`.
- **UI shell:** Independent dark layout — fixed 240px left sidebar (logo + "Admin" badge + nav + email + logout), right outlet. No player TopBar / BannerStack / bottom nav. Mobile collapses sidebar behind a hamburger.

### Files created

```text
src/utils/admin.auth.ts             — bcrypt + session helpers + adminLogin/Logout/verify server fns
src/utils/admin.functions.ts        — all admin server functions (assertAdmin gate + audit log)
src/utils/draw-engine.ts            — pure mulberry32 PRNG + ticket-pool selection
src/routes/_admin.tsx               — auth-gated layout (sidebar + Outlet)
src/routes/admin.login.tsx          — public login (no layout)
src/routes/_admin.index.tsx         — /admin dashboard
src/routes/_admin.draw.tsx          — /admin/draw
src/routes/_admin.players.tsx       — /admin/players (search + list)
src/routes/_admin.players.$playerId.tsx — /admin/players/:id detail
src/routes/_admin.banners.tsx       — /admin/banners
src/routes/_admin.missions.tsx      — /admin/missions
src/routes/_admin.config.tsx        — /admin/config
src/routes/_admin.winners.tsx       — /admin/winners
```

Note on routing: TanStack Start's file router uses **dot-separated flat naming**, so `_admin.draw.tsx` resolves to `/admin/draw` (the `_admin` layout is pathless and provides the `<Outlet />`). The user-spec paths (`src/routes/admin/draw.tsx`) would mix nesting conventions and break the route tree. URLs are identical.

### Files modified

- `src/routes/_authed/winners.tsx` — replace `HAS_DRAWS = false` with a server function `getPublishedWinners()` that reads `winam_platform_config.winners_published_week_id` and, if set, returns rows from `winam_winners` joined with player nicknames + masked MSISDNs. Empty state preserved when null.
- `src/routes/__root.tsx` — **no changes**. Routes auto-register via the Vite plugin. Listed in spec for completeness only; will not touch unless a meta tag for `/admin/*` needs suppressing (decision: leave as-is).

### Admin auth flow

1. `/admin/login` → form posts email+password → `adminLogin` server fn → bcrypt compare → returns `{ adminId, email, role }` → client writes to `localStorage.winam_admin_session`.
2. Any `_admin/*` route mounts → reads session → calls `verifyAdminSession({ adminId })` → on failure clears storage and redirects to `/admin/login`.
3. Logout clears storage + redirects.

### Draw execution engine (`draw-engine.ts`)

Pure functions, no DB:

- `mulberry32(seed: number)` — deterministic PRNG.
- `seedFromHex(hex: string)` — first 8 hex chars → uint32.
- `expandTickets(ledgerRows, weeklyCap)` — group by `player_id`, clamp to cap, expand into virtual ticket array `[{playerId, ticketId}]` where `ticketId = "${playerId.slice(0,8)}-${i}"`.
- `selectWinners(tickets, seed, cashTiers, airtimeTiers)` — Fisher–Yates shuffle with seeded PRNG, dedupe by player (one prize per player), assign positions per tier config.

Called by `executeDrawWeek` server fn which:
1. Loads draw week, asserts `status='locked'`.
2. Fetches all `winam_entry_ledger` rows for the week.
3. Fetches `is_flagged=true` players → exclusion set.
4. Generates `draw_seed` via `crypto.randomBytes(32).toString('hex')`.
5. Builds ticket pool (excluding flagged players), runs `selectWinners`.
6. Bulk-inserts into `winam_winners`.
7. Updates draw week: `status='drawn'`, `draw_seed=...`.
8. Writes audit log entry with `{ winner_count, total_tickets, seed }`.

### Screen specs (concise)

- **Dashboard** — 4 stat cards (players, active subs, current-week entries, sessions today) + current-week panel + last 10 sessions. Polls every 60s via `setInterval` invalidating the queries.
- **Draw** — current week panel, 4 action buttons (Lock / Execute / Publish / Settle) gated by status + time, typed-confirmation modal for Execute ("EXECUTE DRAW"), winners preview table with CSV export, history table.
- **Players** — search by `msisdn_last4` or `nickname` (server-side ILIKE), paginated table.
- **Player detail** — all columns + sub history + last 20 sessions + weekly entry rollup + missions; action buttons (flag/unflag, ±coins, ±XP, cancel sub, extend sub) — each opens a confirmation modal with required reason field.
- **Banners** — drag-reorder list using `@dnd-kit/sortable` (already a common shadcn pattern; if unavailable, falls back to up/down arrows), inline `is_active` toggle, create/edit modal.
- **Missions** — list + inline toggle + create/edit modal with the 4 condition types and 2 reward types from existing enums. Note banner about next-session effect.
- **Config** — one row per key with type-aware input (integer / JSON textarea with `JSON.parse` validation on blur). Each row has its own Save button. Warning banner about retroactive effects.
- **Winners** — settled weeks list, click expands inline winner table, per-week CSV export, "flag winner" toggles `winam_winners.is_flagged` only.

### Audit logging

Every mutation server fn ends with:
```ts
await supabaseAdmin.from('winam_admin_audit_log').insert({
  admin_id: adminId, action, target_type, target_id, details
});
```
Failures of audit insert log to console but do not roll back the action (audit is best-effort).

### Security checklist

- `assertAdmin` on every server fn (throws → server fn rejects → UI surfaces error).
- Service role key never imported in route files; `client.server.ts` is dynamically imported inside handlers.
- Password input only in `adminLogin`; bcrypt compare via the `bcryptjs` pure-JS package (Worker-compatible — `bcrypt` native bindings are not).
- Typed-confirmation gate on draw execution.
- All destructive UI actions go through a shared `<ConfirmModal>` component.
- Admin session key namespaced; player session untouched.

### Dependencies to add

- `bcryptjs` (Worker-safe pure JS) — for admin password hashing.
- `@dnd-kit/core` + `@dnd-kit/sortable` — for banner reorder. (Skip and use up/down arrow buttons if either fails to install.)

### Player app integration

`src/routes/_authed/winners.tsx`:
- Add a route `loader` calling new server fn `getPublishedWinners()`.
- If `publishedWeekId === null` → render existing empty state (untouched).
- Else → render real `winam_winners` rows in the existing card structure, masking MSISDN as `***${last4}`.

### Out of scope (explicit)

- No changes to `_authed/`, `components/`, `game.functions.ts`, `auth.functions.ts`, `mission.functions.ts` beyond the single `winners.tsx` modification.
- No new RLS policies (admin uses service role exclusively).
- No admin password reset flow (admin rows seeded directly in DB).
- No real-time subscriptions; dashboard uses 60s polling.
- OTP bypass and Forthsoft webhook stub remain as-is.

