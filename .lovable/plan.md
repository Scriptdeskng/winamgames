

## Add hover tooltips to dashboard stat cards

### Change

In `src/routes/admin.index.tsx`, mirror the `KeyLabel` tooltip pattern from `admin.config.tsx`: a small `Info` icon (lucide) sits next to the existing icon on each card; on hover, a positioned `<span role="tooltip">` fades in via Tailwind `group`/`group-hover` classes. No new dependency, no new component file, no other files touched.

### Implementation in `admin.index.tsx`

1. Extend the `Info` import: change the existing lucide import line to add `Info`:
   ```ts
   import { Users, CreditCard, Ticket, Gamepad2, Info } from "lucide-react";
   ```

2. Add a `tooltip` field to each entry in the `cards` array:
   ```ts
   const cards = [
     { label: "Total players", value: stats.totalPlayers, icon: Users,
       tooltip: "Total registered player accounts across all time" },
     { label: "Active subscriptions", value: stats.activeSubscriptions, icon: CreditCard,
       tooltip: "Players with a currently active subscription (note: prototype auto-renews on login, so this may be inflated)" },
     { label: "Current week tickets", value: stats.currentWeekEntries, icon: Ticket,
       tooltip: "Total draw tickets earned by all players in the current open draw week" },
     { label: "Sessions today", value: stats.sessionsToday, icon: Gamepad2,
       tooltip: "Number of completed game sessions today (WAT timezone)" },
   ];
   ```

3. In the card render, replace the single `<Icon />` in the top-right with a flex group containing the `Info` trigger + tooltip span, then the existing `Icon`. Reuse the exact tooltip classes from `KeyLabel` in `admin.config.tsx` so styling stays consistent:
   ```tsx
   <div className="flex items-center gap-1.5">
     <span className="group relative inline-flex">
       <Info className="h-3 w-3 cursor-help text-muted-foreground/70 hover:text-muted-foreground" />
       <span
         role="tooltip"
         className="pointer-events-none absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-popover px-2 py-1.5 text-xs leading-snug text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
       >
         {c.tooltip}
       </span>
     </span>
     <Icon className="h-4 w-4 text-primary" />
   </div>
   ```

   Note: tooltip is anchored `right-0` (not centered) so the rightmost card's tooltip doesn't overflow the viewport edge. Width `w-56` keeps the longer "Active subscriptions" copy on ~3 lines.

### Files changed

- `src/routes/admin.index.tsx` — add `Info` import, add `tooltip` field on each card, swap the icon slot for the tooltip+icon group.

### Out of scope

- No shared `<Tooltip>` component extracted (config page also inlines it; matching that convention).
- No changes to `admin.config.tsx`, no Radix tooltip, no new files.

