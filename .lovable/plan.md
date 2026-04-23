

## Finish admin panel: wire winners, build 7 screens, seed admin

### 1. Player-facing winners screen

**Modify `src/routes/_authed/winners.tsx`** (the only `_authed/` exception per your constraint):
- Replace `const HAS_DRAWS = false` and the mock `DRAW_WEEKS` array with a route `loader` that calls `getPublishedWinners()`.
- If `weekId === null` → render the existing empty state (untouched, including next-draw countdown).
- If a week is published → render real winners from `winam_winners`:
  - Cash winners (positions 1–3) in the existing podium card style with masked MSISDN `***${msisdnLast4}` and nickname.
  - Airtime/data winners grouped by `prize_amount` into collapsible tiers using the existing `Collapsible` UI.
  - Week label derived from `week_start_wat` → `week_end_wat`.
- Add `errorComponent` and `notFoundComponent` (required by route conventions when adding a loader).

### 2. Build 7 stub admin screens

All screens use the existing `AdminSidebar` layout, shared `<ConfirmModal>`, and call existing server functions in `admin.functions.ts`. Patterns reused from `admin.index.tsx`: read `getAdminSession()`, call server fn with `{ data: { adminId } }`, surface errors inline.

**`admin.draw.tsx`** — Current week panel + 4 action buttons gated by status:
- Lock (status='open' & within 1h of lock time) → `lockDrawWeek` with confirmation
- Execute (status='locked') → `executeDrawWeek`, modal requires typed input "EXECUTE DRAW" to enable confirm (uses `disableConfirm` prop)
- Publish (status='drawn') → `publishWinners` with confirmation
- Settle (status='drawn') → `settleDrawWeek` with confirmation
- Winners preview table (when status drawn/settled) with CSV export button (client-side blob download)
- History table of past weeks via `getDrawWeeks`, click row → load + show winners inline

**`admin.players.tsx`** — Search input (debounced 300ms) → `getPlayers`, paginated table with columns: nickname, ***last4, rank tier badge, coins, XP, streak, flagged dot, last session. Each row links to `/admin/players/$playerId`.

**`admin.players.$playerId.tsx`** — `getPlayerDetail` on mount. Five sections:
- Profile card (all `winam_players` fields)
- Action toolbar: Flag/Unflag, ±Coins, ±XP, Cancel sub, Extend sub — each opens `<ConfirmModal>` with reason textarea (required)
- Subscription history table
- Last 20 sessions table
- Weekly entry rollup (group ledger by `draw_week_id`)
- Mission progress table

**`admin.banners.tsx`** — `getBanners` list. Drag-to-reorder using `@dnd-kit/core` + `@dnd-kit/sortable` (already installed):
- `DndContext` + `SortableContext` wrapping the list
- On drop → `reorderBanners` with new id order
- Each row: icon preview, title, subtitle, inline `is_active` switch (saves immediately via `updateBanner`), Edit/Delete buttons
- Create/Edit modal: title, subtitle, icon URL with live preview, is_active, display_order
- Delete via `<ConfirmModal>` (destructive)

**`admin.missions.tsx`** — `getMissions` list with columns: title, game_type badge, condition (`type: value`), reward (`type: amount`), is_active toggle, Edit. Create/Edit modal with selects matching the Zod enums (`condition_type`, `reward_type`, `game_type`). Warning banner: "Changes apply on next session start."

**`admin.config.tsx`** — `getPlatformConfig` rendered as table, one row per key. Type-aware editor by key prefix:
- Integer keys (`base_N`, `weekly_cap`, `hint_penalty`, `plan_daily_price`, `plan_weekly_price`) → number input
- All others → JSON textarea with `JSON.parse` validation on blur (red border + error if invalid)
- Each row has its own Save button calling `updatePlatformConfig`
- "Add new key" form at bottom (key + JSON value)
- Top warning banner about retroactive effects

**`admin.winners.tsx`** — `getDrawWeeks` filtered to status `drawn`/`settled`. Click week → expand inline `getWinners` table: position, ***last4, nickname, prize_type, prize_amount, ticket_id, flag toggle (`flagWinner`). Per-week CSV export button.

### 3. Seed admin user

Generate bcrypt hash for password `safehouse` with `bcryptjs.hashSync(password, 10)`, then insert via Supabase insert tool:

```sql
INSERT INTO winam_admin_users (email, password_hash, role)
VALUES ('dward009@gmail.com', '<bcrypt-hash>', 'admin');
```

Hash will be generated in a one-off `code--exec` step using the already-installed `bcryptjs`.

### Files

**Modified (1):**
- `src/routes/_authed/winners.tsx` — wire loader to `getPublishedWinners`, render real data when published

**Created (7):**
- `src/routes/admin.draw.tsx`
- `src/routes/admin.players.tsx`
- `src/routes/admin.players.$playerId.tsx`
- `src/routes/admin.banners.tsx`
- `src/routes/admin.missions.tsx`
- `src/routes/admin.config.tsx`
- `src/routes/admin.winners.tsx`

(These files exist as stubs and will be rewritten — the file count is the same.)

**Database (1 insert):** Seed `winam_admin_users` row.

### Out of scope

- No changes to `src/routes/_authed/*` (other than `winners.tsx`), `src/components/`, `src/utils/game.functions.ts`, `src/utils/auth.functions.ts`, `src/utils/mission.functions.ts`.
- No new server functions — all 22 needed already exist in `admin.functions.ts`.
- No password reset flow — admin can request a re-seed if forgotten.

