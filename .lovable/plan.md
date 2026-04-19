

## Refine entries copy + adopt "tickets" terminology

Three threads to address:

### 1. Streak rule wording — connect to the draw

Current proposal:
> Play daily to unlock per-session bonuses: +1 entry from day 3, +2 from day 7, +3 from day 14.

Problem: "per-session bonuses" is abstract. Doesn't say bonus *what*, doesn't tie back to the draw.

Rewrite (use a sub-line under each rule title to do the heavy lifting):

> **2. Daily streaks earn extra tickets**
> Play every day to build a streak. Each session you play earns extra draw tickets on top of what you'd normally get: +1 from day 3, +2 from day 7, +3 from day 14.

Pattern applied to all four rules — bold short title + one plain-English line that ends in "...draw" or "...tickets" so the connection never gets lost.

### 2. Remove the false hint penalty (UI + plan only)

Earlier plan said "hint-free play earns more" — that was wrong, the user removed that mechanic. Fix Rule 1:

> **1. Solve puzzles to earn tickets**
> Every 5 puzzles you solve in a session earns you 1 ticket for Sunday's draw. Hints don't reduce your count — use them freely.

Note: the user also flagged removing `net_puzzles` field and `hints_used` deductions from the codebase. I checked — `winam_game_sessions` schema (above) has no `net_puzzles` column, and I'll verify `game.functions.ts` and `mission.server.ts` don't subtract `hints_used` from any entry math during implementation. If found, strip them.

### 3. "Entries" → "Tickets" everywhere in UI copy

Rationale already established: "tickets" is universal, "entries" is jargon. Apply consistently across the app — the *internal* table/field names (`entries_awarded`, `winam_entry_ledger`, `entriesAdded`) stay as-is (database concern), only **user-facing strings** change.

#### Audit of user-facing "entry/entries" strings

Files to update:

| File | Current copy | New copy |
|---|---|---|
| `src/routes/_authed/profile.tsx` | "Entries this week", accordion title "How entries work", helper popovers | "Tickets this week", "Tickets & the weekly draw", etc. |
| `src/routes/_authed/index.tsx` | `DrawHeroCard` "X / 50 entries", any tip text | "X / 50 tickets" |
| `src/routes/_authed/results.tsx` | "+N entry/entries", "No entries this session", "Entries this week", "Solve 5 puzzles next session for an entry", breakdown chips ("Base", "Streak bonus", "Mission") | "+N ticket/tickets", "No tickets this session", "Tickets this week", "...for a ticket", breakdown unchanged |
| `src/routes/_authed/entries.tsx` | "My Entries" page title + "entries" labels + meta description | "My Tickets", title meta "My Tickets — WinamGames" |
| `src/components/layout/MenuSheet.tsx` | "My Entries" nav link (if present) | "My Tickets" |
| `src/components/home/BannerStack.tsx` | check for "entries" in dynamic banner copy — DB-driven, leave data alone, only inspect static labels |
| `src/utils/mission.functions.ts` / `mission.server.ts` | mission titles in DB may say "entries" — those are data, leave alone unless user wants a migration | flag only |

Route filename `/_authed/entries.tsx` — keep the URL `/entries` (changing routes breaks deep links + bottom nav references); only swap visible copy.

### 4. Final accordion content (`profile.tsx`)

```tsx
<AccordionTrigger>Tickets & the weekly draw</AccordionTrigger>
<AccordionContent>
  <p className="mb-4">
    Every Sunday at 20:00 WAT we run a cash draw. <strong>Tickets are your entries</strong> — 
    the more you collect during the week, the better your odds of winning. 
    Earn them by playing; they reset every Monday.
  </p>
  <ol className="space-y-3">
    <li>
      <strong>1. Solve puzzles to earn tickets</strong>
      <p>Every 5 puzzles you solve in a session earns 1 ticket for Sunday's draw.</p>
    </li>
    <li>
      <strong>2. Daily streaks earn extra tickets</strong>
      <p>Play every day to build a streak. Each session earns bonus tickets: +1 from day 3, +2 from day 7, +3 from day 14.</p>
    </li>
    <li>
      <strong>3. Missions add bonus tickets</strong>
      <p>Completing daily missions awards extra tickets on top of what you earn from play.</p>
    </li>
    <li>
      <strong>4. Weekly cap & reset</strong>
      <p>You can collect up to 50 tickets per week. Anything beyond converts to coins. The draw runs Sunday 20:00 WAT, then everything resets Monday.</p>
    </li>
  </ol>
</AccordionContent>
```

Note: intro uses "**Tickets are your entries**" once to bridge the old word for any returning users, then "tickets" everywhere after.

### 5. Code audit task (during implementation)

- `grep` for `hints_used` in entry calculation paths (`game.functions.ts`, `mission.server.ts`) — confirm no subtraction; if any, remove.
- Confirm `net_puzzles` doesn't exist in code (schema confirms it's not in DB).

### Files touched

- `src/routes/_authed/profile.tsx` — accordion rewrite + "entries" → "tickets" in `WeeklyEntriesCard` label and any popovers
- `src/routes/_authed/index.tsx` — `DrawHeroCard` label
- `src/routes/_authed/results.tsx` — full hero/breakdown/nudge copy swap
- `src/routes/_authed/entries.tsx` — page title, headings, meta
- `src/components/layout/MenuSheet.tsx` — nav label (if present)
- `src/utils/game.functions.ts` — verify no hint-based entry deduction (read-only check, edit only if found)
- `src/utils/mission.server.ts` — same verification

No DB migration. No route URL change. Internal field names unchanged.

