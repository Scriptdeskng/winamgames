

## Audit & rename: user-facing "entries" → "tickets"

The codebase is mid-rename. The `/entries` route already says "tickets" internally (`totalTickets`, `<Ticket>` icons, ticket IDs like `WG-XXXXXX-01`) but everywhere else still says "entries" in user-facing copy. This plan unifies the user-facing language to **tickets** while leaving database column names, route paths, and internal prop names untouched (they're not visible to users and renaming them is high-risk churn for zero user benefit).

### Rule of thumb

- **User-facing text** (JSX strings, meta tags, button labels, tooltip copy) → rename to "tickets" / "ticket"
- **Internal identifiers** (DB columns like `winam_entry_ledger`, `entries_delta`, `week_total_after`; route path `/entries`; prop names like `weekTotal`, `entriesAdded`) → leave as-is
- **Code-only variable names** that don't render → leave as-is unless trivially adjacent to renamed copy

### Files touched (user-facing copy only)

**1. `src/routes/__root.tsx`** — meta tags
- `description`, `og:description`, `twitter:description`: "earn draw entries" → "earn draw tickets"

**2. `src/routes/index.tsx`** — landing page
- Line 344: "Every right answer earns you a draw entry." → "...a draw ticket."
- Line 361: "Solve puzzles to earn draw entries..." → "...draw tickets..."
- Line 366: "More entries = better odds." → "More tickets = better odds."

**3. `src/routes/_authed/app.tsx`** — home dashboard
- Line 215: "Entries locked — draw executes at 20:00 WAT" → "Tickets locked — ..."
- Lines 219, 257: "/ {weekCap} entries this week" → "/ {weekCap} tickets this week"
- Lines 229, 268: "View my entries" → "View my tickets"
- Lines 314–316: rename helper `pluralizeEntries` → `pluralizeTickets`, return `"ticket"/"tickets"`
- Comment line 206: "entries frozen" → "tickets frozen" (cosmetic)

**4. `src/routes/_authed/checkmate.tsx`**
- Line 41 meta description: "earn draw entries" → "earn draw tickets"
- Line 239: "Earn up to 5 entries per round" → "Earn up to 5 tickets per round"
- Line 290: "Find the winning move to earn your entry." → "...to earn your ticket."

**5. `src/routes/_authed/wisdomdrop.tsx`**
- Line 24 meta description: "earn draw entries" → "earn draw tickets"
- Line 113: "Earn up to 5 entries per round" → "Earn up to 5 tickets per round"

**6. `src/routes/_authed/results.tsx`** — full sweep
- Line 134: `entries === 1 ? "entry" : "entries"` → `"ticket" : "tickets"`
- Line 143 ("Added to your weekly draw") — keep
- Line 150: "Every 5 puzzles solved earns 1 entry..." → "...earns 1 ticket..."
- Lines 51–55 streak pill copy: "+N bonus entries per session" → "+N bonus tickets per session" (and "+1 bonus entry" → "+1 bonus ticket")
- Line 161: "Entries earned this week" → "Tickets earned this week"
- Lines 79–86 nudge copy: "earn your first entry" / "every 5 puzzles earns 1 entry" / "for your next entry" → "...ticket"
- URL search param `entries` (line 12, 38, 132) — **leave as-is** (internal contract with the closeSession server fn). Render uses the value but rename only the display word, not the variable.

**7. `src/routes/_authed/profile.tsx`** — heavy copy block
- Line 151: "My Entries" → "My Tickets"
- Line 173 comment: "Weekly entries" → "Weekly tickets" (cosmetic)
- Line 178: "Entries & the weekly draw" → "Tickets & the weekly draw"
- Line 179: "How to earn entries and win cash" → "How to earn tickets..."
- Line 184: "Entries are your shot at the draw" → "Tickets are your shot at the draw"; "your entry count resets" → "your ticket count resets"
- Lines 187–191 rules list: rewrite all four `lead`/`body` strings to use "ticket(s)" instead of "entry/entries"
- Line 125 popover: "50-entry weekly draw limit" → "50-ticket weekly draw limit"
- Line 418: "/ {weekCap} entries" → "/ {weekCap} tickets"
- Line 464 streak popover: "+1 bonus entry per session" / "+2" / "+3" → "...ticket..."
- Section comment line 103, function name `WeeklyEntriesCard` and prop `weekTotal` — **leave as-is** (internal)

**8. `src/routes/_authed/entries.tsx`** — already mostly ticket-y, finish the job
- Line 18 meta description: "weekly draw entries" → "weekly draw tickets"
- Line 105: "/ {weekCap} entries" → "/ {weekCap} tickets"
- Line 116: "View entries" → "View tickets"
- Line 132: "No entries yet — play a game to earn your first one." → "No tickets yet — play a game to earn your first one."
- Line 161: `"entry" : "entries"` → `"ticket" : "tickets"`
- Line 172: "No entries earned this week." → "No tickets earned this week."

**9. `src/components/layout/MenuSheet.tsx`**
- Line 10: label `"My Entries"` → `"My Tickets"` (route path `/entries` stays)

**10. `src/components/games/DrawLockBanner.tsx`**
- Line 37: "Draw entries locked · Coins only this session" → "Draw tickets locked · Coins only this session"

**11. `src/routes/renew.tsx`**
- Line 70: "Keep playing & earning entries" → "Keep playing & earning tickets"
- Line 102: badge "Entries" → "Tickets"

### Explicitly NOT changed (out of scope)

- Route path `/entries` — renaming would require redirects, route file rename, regenerated route tree, and breaks any in-flight bookmarks. Path is rarely seen by users.
- Database tables/columns: `winam_entry_ledger`, `entries_delta`, `entries_awarded`, `week_total_after`, `winam_player_missions.entries_awarded` — internal, no user impact.
- Server function file `src/utils/entries.functions.ts`, exported types `PlayerEntryWeek`, `getPlayerEntries`, search-param key `entries` on `/results` — internal contracts; renaming risks bugs for zero user benefit.
- Code-side variable names: `weekTotal`, `weekCap`, `WeeklyEntriesCard`, `getNextEntriesLockWAT`, `entriesAdded`, `pluralizeEntries` (function gets renamed to `pluralizeTickets` only because it's ~6 lines and trivially safe; the rest stay).
- `entryId` strings on the Winners page — these are placeholder mock winner IDs (e.g. `#3F8A2C1D`); they're a generic "entry/ticket ID" concept. Keep the prop name `entryId` (internal) but no user-visible text mentions "entry" — it just renders the hash. No change needed.
- `RevealOnScroll.tsx` line 37 — `entries` here is the IntersectionObserver callback parameter, not user copy. Leave.
- Memory file `mem://features/draw` says "Entry cap 50" — internal note, leave.

### Memory update

After implementation, update `mem://index.md` Core rules with one line:

```
User-facing language: "ticket(s)" — never "entry/entries". Internal DB/types still use "entry".
```

This locks the convention for future work.

### Risk

Pure copy change in JSX strings and meta. No logic, no schema, no routes, no types. Trivially reversible.

