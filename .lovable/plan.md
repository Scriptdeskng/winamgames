

## Leaderboard v2 — sharper, more emotional, less generic

### What's wrong with the current version

1. **The podium is flat.** Three near-identical pillars side-by-side. 1st place doesn't feel like winning.
2. **Every list row screams equally.** Border + shadow + colored ticket count on every row → no scan hierarchy. The eye has nowhere to land.
3. **The "you" story is buried.** Highlighting a row tells me where I am but not how I'm doing. No sense of "3 tickets behind 5th place" or "stay top-10 to lock in the bonus".
4. **The hero strip is vestigial.** Single line of date text with a generic Trophy icon — uses prime real estate to say almost nothing. The countdown to the draw lives on `/app` only.
5. **No motion, no life.** Leaderboards are inherently dramatic; this one feels like a CSV.
6. **Visible rank tier is redundant noise on rows.** Every row already shows the player's tier icon on the left AND the tier label as a subtitle — two signals for one fact.

### The new design (top → bottom)

```text
┌─ TopBar — back to /app, title "Leaderboard" ───────────┐

┌─ Live draw card ───────────────────────────────────────┐
│  THIS WEEK'S DRAW                                      │
│  ┌──┬──┬──┐                                            │
│  │02│14│37│   ends Sun 8pm WAT · Apr 13 – 19           │
│  └──┴──┴──┘   28 players competing                     │
│  d   h   m                                             │
│   ─── thin emerald progress (week elapsed) ───         │
└────────────────────────────────────────────────────────┘

┌─ The Podium (cinematic) ───────────────────────────────┐
│                       ★ CROWN ★                        │
│                    ┌──────────┐                        │
│                    │   1st    │                        │
│         ┌───────┐  │  AVATAR  │  ┌───────┐             │
│         │ 2nd   │  │  (XL)    │  │ 3rd   │             │
│         │ AVTR  │  │  Name    │  │ AVTR  │             │
│         │ Name  │  │  48 🎟   │  │ Name  │             │
│         │ 42 🎟 │  │          │  │ 38 🎟 │             │
│         └───────┘  └──────────┘  └───────┘             │
│         silver         gold          bronze            │
│       (radial gold glow behind 1st only)               │
└────────────────────────────────────────────────────────┘

┌─ The Chase (ranks 4-10) ───────────────────────────────┐
│  Compact rows, no card chrome, divider lines only      │
│   4   ▰  Aisha          14 🎟    +6 to podium          │
│   5   ▰  Tunde          12 🎟                          │
│   6   ▰  YOU            10 🎟    ← sticky highlight    │
│   7   ▰  Bola            9 🎟                          │
│   …                                                    │
└────────────────────────────────────────────────────────┘

┌─ Your standing (always visible, even if in top 10) ────┐
│  YOU · Rank #6 of 28                                   │
│  10 🎟 · 4 to reach 3rd · 2 to hold top 10             │
│  ▰▰▰▰▰▱▱▱▱▱  (progress to next rank up)                │
└────────────────────────────────────────────────────────┘

┌─ Footer link · "How tickets work" → /entries ──────────┐
```

### Key visual moves

**1. Replace the text hero with a live countdown card**
- Three monospace digit-blocks (D/H/M) — same component used on `/app` `DrawHeroCard`. Reuse not rebuild.
- Adds a sense of urgency that drives action (play before it ends).
- Shows total players competing — social proof, makes the leaderboard feel populated.
- Tiny progress bar showing how much of the week has elapsed.

**2. Cinematic podium**
- 1st place is **center, larger, raised**, with a soft radial gold glow behind it (single absolutely-positioned `bg-gradient-radial` blob, gold/coin tinted, blurred).
- Crown icon hovers above 1st with a subtle float animation.
- 2nd and 3rd are smaller, side-flanking, tilted very slightly inward (`rotate-[-2deg]` / `rotate-[2deg]`) so the eye is funnelled to 1st.
- All three avatars become circular gradient orbs in the rank-tier color (replacing today's flat bg-color square). The tier icon sits inside the orb.
- Ticket counts use the existing `tabular-nums` `font-display` so the numbers feel weighty.
- Stagger fade-in: 3rd → 2nd → 1st with a small bounce on 1st.

**3. "The Chase" — strip the chrome from ranks 4-10**
- No per-row borders, no per-row cards. One single rounded surface holds the whole list, with hairline `divide-y divide-border/50` separators between rows.
- Why: visually demotes ranks 4-10 below the podium, but groups them as "the pack". Reads faster and uses less vertical space (important on 390×844).
- Drop the rank-tier label subtitle — the icon already conveys it. Replace subtitle with a contextual hint on hover-rank rows only: the row immediately below podium reads "+N to podium", the row above the cutoff reads "stay above to lock top 10".
- Current player's row gets a subtle emerald left border (`border-l-2`) instead of a full glow box, plus an inline "YOU" tag — quieter, but findable instantly.

**4. "Your standing" card — always present, even when in top 10**
- This is the page's emotional payoff and the biggest UX gap today.
- Shows: your rank, total players, your tickets, the gap to the next position above, and the gap to falling out of top 10 (or "Safe in top 10" / "Push for top 10" prompt).
- A horizontal progress bar visualises tickets relative to the next rank up — a tiny dopamine hit per ticket earned.
- Position: directly under the chase list, before the footer.

**5. Tone-down list rows**
- Drop the per-row `shadow-card`. Cards inside cards inside cards (page → list card → row card) is the main reason it feels heavy.
- Keep `tabular-nums` everywhere numbers appear. Use `font-display` on big numbers (podium counts, your-standing tickets).
- Use the existing `--coin` token for 1st place accents (already in CSS at `oklch(0.82 0.17 85)`), `oklch(0.78 0.02 250)` for silver, `oklch(0.58 0.09 55)` for bronze — slightly brighter than today's values so 2nd/3rd actually read.

**6. Empty state, glow-up**
- Today: generic "No tickets earned yet" card.
- New: same draw countdown card on top (still useful), then a single emerald-glow CTA tile: **"Be first on the board"** with a Play arrow → `/app`. One thing to do, large tap target.

### Animation budget (no new deps)

- Podium pillars: `animate-in fade-in-0 slide-in-from-bottom-4` with stagger via `style={{ animationDelay: ... }}`. (Already available via `tw-animate-css`.)
- Crown float: 3-second `ease-in-out` translate-Y loop. Inline `<style>` block in the component, ~10 lines.
- Rows: `animate-in fade-in-0` with 30ms-per-row stagger.
- Countdown digits update every minute (same `useEffect` pattern as `DrawHeroCard` on `/app`).
- Honor `prefers-reduced-motion` — the existing global rule in `styles.css` already disables `animate-*` for that.

### Data wiring (no backend changes)

Everything needed is already returned by `getLeaderboard`:
- `players` with `entries`, `rankTier`, `name`, `id`
- `weekStartWat`, `weekEndWat`, `drawExecutesAt`
- `currentPlayer` with `rank` + `entries` (when outside top 10)

For "Your standing" when player IS in top 10: derive rank/entries by finding `meId` in `players`. No extra query.

For "N players competing" pill: `players.length` — accurate for the visible top 10. If we want the *total* competing players (could be 50+), extend the existing `getLeaderboard` response with `totalPlayers: number` (a single `count(*)` on the same `winam_entry_ledger` aggregation it's already running). Cheap.

For "+N to podium" / "stay above" hints: pure derivation from the `players` array on the client.

### Files touched

- `src/routes/_authed/leaderboard.tsx` — full visual rewrite. Same data shape, same imports.
- `src/utils/mission.functions.ts` — add `totalPlayers: number` to `getLeaderboard` response (single line: `Object.keys(playerMap).length`).

### Out of scope

- No DB schema changes.
- No new routes, no realtime subscription.
- No changes to `/app`, `/winners`, `/entries`, `/profile`, or any game route.
- No new dependencies — radial glow is a CSS gradient, crown float is inline keyframes, fades use `tw-animate-css` already in `styles.css`.

### Why this is better than v1

| Aspect | v1 (current) | v2 (proposed) |
|---|---|---|
| First thing the eye lands on | Date text in a strip | Live countdown — "act now" |
| Podium emotion | Three look-alike pillars | 1st clearly wins (size, glow, crown) |
| Rank 4-10 readability | 7 separate cards stacked | 1 grouped surface, 7 rows — faster scan |
| "Where do I stand?" | Highlighted row only | Dedicated card with gap-to-next + safety status |
| Visual weight on small screens | Heavy: card-in-card-in-card | Layered: hero card · podium · clean list · standing card |
| Drives action | Low | Countdown + "+N to podium" hints + Play CTA |

