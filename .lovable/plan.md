

## Replace remaining "entries" copy with "tickets"

The user-facing word is "tickets" everywhere. A few stragglers still say "entries". Path/URL `/entries` stays (changing routes breaks links/history); only visible copy changes.

### Changes (visible UI strings only)

| File | Line | Current | New |
|---|---|---|---|
| `src/routes/_authed/wisdomdrop.tsx` | 90 | `5 entries` per round | `5 tickets` per round |
| `src/routes/_authed/wisdomdrop.tsx` | 18 | meta description: `…earn draw entries.` | `…earn draw tickets.` |
| `src/routes/_authed/checkmate.tsx` | 107 | `5 entries` per round | `5 tickets` per round |
| `src/routes/_authed/checkmate.tsx` | 18 | meta description: `…earn draw entries.` | `…earn draw tickets.` |
| `src/routes/renew.tsx` | 69 | `Keep playing & earning entries` | `Keep playing & earning tickets` |
| `src/routes/renew.tsx` | 101 | feature chip `Entries` | `Tickets` |
| `src/routes/_authed/profile.tsx` | 184 | `Tickets are your entries` | `Tickets are your draw entries` → simplify to remove the "entries" word entirely: rewrite as `Tickets are your shot at the draw` |
| `src/routes/_authed/profile.tsx` | 464 | `+1 bonus weekly draw entry per session` | `+1 bonus ticket per session` (and `+2`, `+3` follow same pattern in same sentence) |
| `src/routes/__root.tsx` | 33, 36, 41 | meta `…earn draw entries…` (×3: description, og:description, twitter:description) | `…earn draw tickets…` |

### Not changed (intentional)

- **Route path `/entries`** and `Link to="/entries"` references — internal URL, no user copy impact, changing breaks deep links / browser history.
- **Database column names** (`entries_awarded`, `entries_delta`, `total_entries`, enum `entry_source_type`, `reward_type: "entries"`) — schema-level, not user-facing.
- **Mock data field names** (`entries`, `entryId` in leaderboard/winners mock) — internal property names, not rendered as the word "entries" in UI.
- **Component/function names** (`WeeklyEntriesCard`, `EntriesPage`) — internal identifiers.

### Files touched

- `src/routes/_authed/wisdomdrop.tsx`
- `src/routes/_authed/checkmate.tsx`
- `src/routes/renew.tsx`
- `src/routes/_authed/profile.tsx`
- `src/routes/__root.tsx`

