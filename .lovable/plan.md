

## Fix "entries" → "tickets" copy in banner stack

Banners are stored in the database (`getActiveBanners` returns rows from a banners table) and rendered as-is by `BannerStack`. The copy lives in the data layer, not in component code.

### Investigation needed

I need to check the active banner rows to find which ones still say "entries" or "entry" so I can update them in place. Then update those rows' `title` / `subtitle` columns to use "tickets" / "ticket".

### Plan

1. Query `winam_banners` (or whatever the banners table is named — confirmed via `getActiveBanners` in `src/utils/mission.functions.ts`) to find rows where `title` or `subtitle` contains "entry" / "entries" (case-insensitive).
2. Create a migration that updates those specific rows, swapping:
   - "entries" → "tickets"
   - "entry" → "ticket"
   - Preserve capitalization ("Entries" → "Tickets", "Entry" → "Ticket").
3. No code changes — `BannerStack.tsx` already renders whatever the DB returns.

### Out of scope

- Renaming the `winam_entry_ledger` table or any schema identifiers (internal naming is fine; only user-facing copy changes).
- Other surfaces that may still say "entries" — limited to banner copy this round.
- Icon/style changes on banners.

### Files touched

- New SQL migration under `supabase/migrations/` updating banner rows.

