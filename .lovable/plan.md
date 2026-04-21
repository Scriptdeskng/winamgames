

## Simplify ticket lists: collapsible per week, source-labeled lines

Make every week — current and past — render as a collapsible card. Drop the sort selector. Each ticket line gets a small source pill (Puzzle / Mission / Streak) so you can read what earned it without grouping.

### Changes (single file: `src/routes/_authed/entries.tsx`)

**1. Current week card → collapsible**
- Keep the "This Week" header, week range, big ticket count, and progress bar visible at all times (this is the at-a-glance summary).
- Add a collapsible section *below* the progress bar with a trigger like `View tickets · {n}` and a chevron that rotates on open. Default state: closed.
- When opened, render the same flat ticket list described below. Empty state ("No tickets yet — play a game to earn your first one.") stays visible without a dropdown when `tickets.length === 0`.

**2. Past week cards**
- No structural change — they're already collapsible. Just render the new flat ticket list inside.

**3. Flat ticket list (replaces `TicketGroupedList`)**
- Remove `SortMode`, the `Select` import, the `useMemo` sort, and the by-source grouping branch.
- Render tickets in chronological order (most recent first — the order `getPlayerEntries` already returns).
- Each row shows:
  ```
  [SourceIcon] WG-XXXXXX-01   [Puzzle pill]              Apr 18
  ```
  - Source icon + ticket ID on the left (mono, tabular).
  - A small source pill next to it: rounded full, `bg-surface-2`, `text-[10px]`, label from `SOURCE_META` ("Puzzle" / "Mission" / "Streak"), icon-tinted text color.
  - Earned-date on the right.

**4. Cleanup**
- Drop unused imports (`Select*`, `useMemo` if any).
- `SOURCE_META` stays — used for icon + label + color on each row.

### Visual sketch

```text
┌────────────────────────────────────────┐
│ THIS WEEK            Apr 14 – Apr 20   │
│                                        │
│ 7 / 50 tickets                         │
│ ████████░░░░░░░░░░░░░░░░░░             │
│                                        │
│ ▸ View tickets · 7                     │  ← new collapsible trigger
└────────────────────────────────────────┘

(opened)
┌────────────────────────────────────────┐
│ ⚔ WG-A1B2C3-01  [Puzzle]      Apr 18  │
│ 📖 WG-D4E5F6-01 [Mission]     Apr 17  │
│ 🔥 WG-G7H8I9-01 [Streak]      Apr 16  │
│ …                                      │
└────────────────────────────────────────┘
```

### Out of scope

- Server-side changes — `getPlayerEntries` already returns everything needed.
- Filtering by source.
- Persisting open/closed state across navigations.
- Auto-opening the current week on first load (kept closed for consistency with past weeks).

### File touched

- `src/routes/_authed/entries.tsx`

