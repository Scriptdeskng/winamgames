

## Add a sort/filter dropdown to ticket lists

The current `TicketGroupedList` always groups tickets by source (Puzzle → Mission → Streak). For a player with 30+ tickets, that ordering is fixed and there's no way to scan by recency or isolate one source. A small dropdown control on each card would let users re-cut the same data.

### Interpretation

"Dropdown" here = a compact `Select` control on each card (current week + each expanded past week) that switches how tickets are displayed. Not a navigation dropdown — the past weeks already use `Collapsible` for expand/collapse, which stays.

### Change

In `src/routes/_authed/entries.tsx`:

1. **Add a view-mode state to `TicketGroupedList`** with three modes:
   - `by-source` (default — current behavior: grouped Puzzle/Mission/Streak)
   - `recent` (flat list, newest first)
   - `oldest` (flat list, oldest first)

2. **Render a `Select` trigger** in the top-right of the list area. Use the existing `@/components/ui/select` primitives (already in the project). Trigger styled small and muted to fit the card density:
   ```
   [Sort: By source ▾]
   ```
   - `h-7`, `text-[11px]`, `border-border/60`, `bg-surface-2/60`, no shadow.

3. **When mode = `recent` or `oldest`**, skip the source-grouped rendering and show a single flat list using the same row markup (Hash icon + ticket ID + date), sorted by `earnedAt`. Keep the source icon inline at the start of each row so the source signal isn't lost in flat view.

4. **Wire it into both call sites** — `CurrentWeekTickets` and `PastWeekCard` — by passing the dropdown through `TicketGroupedList` itself (component owns its own state, so no prop wiring needed at the call sites).

5. **Hide the dropdown when `tickets.length <= 3`** — not worth the chrome for tiny lists.

### Layout

```text
┌─ This Week ──────────────────── Apr 14 – 20, 2026 ─┐
│ 12 / 50 tickets                                     │
│ [████████░░░░░░░░░░░░░░░░░░░░░░░░]                  │
│                                                     │
│ Tickets                          [Sort: By source ▾]│
│ ─────────────────────────────────────────────────── │
│ ⚔ PUZZLE · 8                                        │
│   # WG-A1B2C3-01                          Apr 18    │
│   ...                                               │
│ 📖 MISSION · 4                                      │
│   ...                                               │
└─────────────────────────────────────────────────────┘
```

### Out of scope

- Filtering by source (e.g. "show only Puzzle"). Sort/group is enough for now; can add chips later if needed.
- Persisting the choice across sessions.
- Changing the past-week `Collapsible` mechanism.
- Server-side changes — `getPlayerEntries` already returns everything needed.

### File touched

- `src/routes/_authed/entries.tsx` — add state + `Select` to `TicketGroupedList`, add a flat-list branch alongside the existing grouped branch.

