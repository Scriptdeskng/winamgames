

## Redesign session results screen

Simplify `src/routes/_authed/results.tsx` to a focused 3-element layout. Remove all coin and XP visibility from this screen.

### Data needed

The current search params provide: `entries`, `coins`, `xp`, `streak`, `weekTotal`, `weekCap`, `rankTier`, `previousRank`, `missions`. 

**Missing**: `puzzlesSolved` (for the "next session nudge"), and a breakdown of how the entries were calculated (base / streak bonus / mission).

**Two new search params** to add:
- `puzzlesSolved: number` — for the X more puzzles nudge
- `baseEntries: number` — base entries before streak/mission (so we can derive: `streakBonus = entries - baseEntries - missionEntries`, `missionEntries = sum of completedMissions[].rewardAmount`)

`useGameSession.ts` already has `puzzlesSolved` in state — pass it through. For `baseEntries`, the close-session server function (`closeSession` in `src/utils/game.functions.ts`) computes it; need to return it alongside `entries`. I'll inspect that function during implementation, but assume it can return the base figure.

### New layout

```
┌──────────────────────────────────┐
│         [Trophy icon]            │
│      Session Complete!           │
│                                  │
│  ┌────────────────────────────┐  │
│  │      +3 entries            │  │   ← Element 1 (large)
│  │ Base 1 · Streak +1 · ...   │  │   (muted breakdown)
│  └────────────────────────────┘  │
│                                  │
│  12 / 50 entries this week       │   ← Element 2
│  [████████░░░░░░░░░░░░]          │
│                                  │
│  Solve 2 more puzzles next       │   ← Element 3 (muted)
│  session for another entry       │
│                                  │
│  🔥 Day 7 — +2 bonus per session │   ← Streak pill (conditional)
│                                  │
│  [    Play again    ]            │
│  [   Back to Home   ]            │
└──────────────────────────────────┘
```

### Logic per element

**Element 1 — Entries hero**
- If `entries > 0`: show `+{entries} entries` (text-4xl, bold, primary color). Below it, build breakdown chips joined by `·`:
  - Always: `Base {baseEntries}` (only if base > 0)
  - If `entries - baseEntries - missionEntries > 0`: `Streak bonus +{n}`
  - If `missionEntries > 0`: `Mission +{missionEntries}` (or per-mission if multiple)
- If `entries === 0`:
  - Headline: `No entries this session`
  - Sub: `Solve 5 puzzles in a session to earn your first entry`

**Element 2 — Weekly progress**
- Use existing `<Progress>` component from `src/components/ui/progress.tsx`.
- Label: `{weekTotal} / {weekCap} entries this week` above the bar.

**Element 3 — Next session nudge**
- `remainder = puzzlesSolved % 5`
- If `remainder === 0 && puzzlesSolved > 0`: `Great session — play again to keep earning`
- Else if `puzzlesSolved === 0`: `Solve 5 puzzles next session for an entry`
- Else: `Solve {5 - remainder} more puzzle(s) next session for another entry`

**Streak pill (conditional, between element 3 and buttons)**
- If `streak >= 3`: `🔥 Day {streak} streak — earning +{bonus} bonus entries per session` (need bonus mapping; from memory `mem://features/games` — read at impl time. Likely tier-based: day 3 → +1, day 7 → +2, etc. If not available, just say "earning bonus entries")
- If `streak >= 1 && streak < 3`: `🔥 Day {streak} — reach day 3 for bonus entries`
- If `streak === 0`: hide
- Style: rounded-full pill, surface-1 bg, small text, flame icon (Lucide `Flame`, not emoji — per project memory "Lucide React icons only — no emojis")

**Buttons**
- Primary: `Play again` → navigate back to the game route the session came from. Need to know which game. Add `gameType: "checkmate" | "wisdomdrop"` as a search param, set in `useGameSession.ts`.
- Secondary: `Back to Home` → `/`

### Removals from current results.tsx

- Coins earned row, XP gained row, weekly target row (now covered by element 2), streak row (now the pill)
- Stats grid array entirely
- All `Coins`, `Sparkles` icon imports
- Rank-up notification — out of scope per spec? Spec doesn't mention it. **Keep it** above element 1 — it's a separate notable event. Confirm with user if uncertain. (Defaulting to keep — it's a positive moment, not a stat row, and the spec only forbids coin/XP visibility.)

### Files to edit

1. **`src/routes/_authed/results.tsx`** — full rewrite of the body. Update Zod schema to add `puzzlesSolved`, `baseEntries`, `gameType`. Remove coin/XP rendering.
2. **`src/components/games/useGameSession.ts`** — pass `puzzlesSolved`, `baseEntries` (from `closeSession` result), and `gameType` into the `navigate({ to: "/results", search: {...} })` call.
3. **`src/utils/game.functions.ts`** — ensure `closeSession` returns `baseEntries` (the figure before streak/mission additions). I'll read the file during implementation; if it already separates them internally, just expose. If not, compute and return.

### Out of scope (explicit)

- No CSS changes, no new components, no schema migration, no changes to coin/XP backend logic (those continue to update silently as before).
- Profile page already shows coins/XP — no change needed there.

