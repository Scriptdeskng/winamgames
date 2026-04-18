

## Restructure Profile hero to a centered, vertical layout

The reference screenshot shows a calmer, more focused hero: avatar centered, identity stacked beneath, rank progress as a thin bar at the bottom. The current side-by-side avatar + nickname + inline rank progress competes visually with the entries card below. Restructuring fixes the hierarchy.

### What to change

**`IdentityHero` in `src/routes/_authed/profile.tsx`** — switch from horizontal layout to centered vertical:

```
┌─────────────────────────────────┐
│                                 │
│           ⊙ Avatar              │  ← centered, larger
│           [Veteran]             │  ← rank chip overlaps
│                                 │     bottom-right of avatar
│           King Ed               │  ← centered, bold
│           ****0000              │  ← centered, muted
│                                 │
│   ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░       │  ← thin progress bar
│   1,300 XP to Champion          │  ← single muted line
│                                 │
└─────────────────────────────────┘
```

### Specific structural changes

1. **Avatar**: keep current `User` icon, increase to ~h-20 w-20, center horizontally, add the `bg-primary/15` tint from reference (uses existing emerald token).
2. **Rank chip overlay**: small pill (`bg-primary/20 text-primary text-xs font-semibold`) absolutely positioned at avatar's bottom-right, showing rank label. Replaces the inline rank icon + label row.
3. **Identity text**: nickname + masked MSISDN stacked, centered, beneath avatar.
4. **Progress bar**: keep existing 2px height bar but full-width, no inline header above it. Just the bar + a single subtle line below: `"1,300 XP to Champion"` (or `"Maximum rank reached"` at max). Drop the `"X / Y XP"` numeric readout — it's redundant with "X XP to next" and adds noise.
5. **Remove** the horizontal divider (`h-px bg-border`) — vertical layout doesn't need a separator.

### What stays

- Same data inputs (`nickname`, `msisdnLast4`, `xp`, `tier`).
- Same `RANK_CONFIG` lookup, same next-tier math.
- Same `WeeklyEntriesCard` below — untouched.
- Same Coins + Streak 2-up grid below that — untouched.
- All other page sections — untouched.

### Why this fixes the hierarchy issue

- Identity card becomes shorter and visually quieter (centered, less dense).
- Entries card remains the most visually loud element on the page (gradient, large numbers, CTA button) — which is correct, since it's the primary stat.
- Reduces two competing "hero" cards to one true hero (entries) with a calmer identity header above it.

### Files touched

- `src/routes/_authed/profile.tsx` — rewrite the `IdentityHero` component only.

No new components, no new icons, no schema, no other files.

### Out of scope (call out, don't auto-include)

- The reference shows a small edit/pencil icon next to the nickname. Not included — current app has no nickname-edit flow. If you want one, that's a separate task (edit modal + server function + validation).
- The reference uses an "Lvl 5" chip; we keep the rank tier label ("Veteran", etc.) since rank is your existing system, not a numeric level.

