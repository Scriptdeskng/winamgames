

## Refine Results page copy — keep "tickets" terminology

User feedback: keep the word **"tickets"** throughout (don't swap to "entries"). Just make the hero meaningful by adding the subtext that completes the thought, and clarify the breakdown/nudge copy.

### Copy changes (all in `src/routes/_authed/results.tsx`)

| Where | Current | Proposed |
|---|---|---|
| Hero number | `+3 tickets` | `+3 tickets` (unchanged) |
| Hero subtext (NEW) | — | `Added to your weekly draw` |
| Breakdown — base | `Base 1` | `Solved {puzzlesSolved} puzzles +{baseEntries}` |
| Breakdown — streak | `Streak bonus +1` | `Day {streak} streak +1` |
| Breakdown — mission | `Mission +2` | `Mission bonus +2` |
| Zero-tickets hero | `No tickets this session` | `No tickets earned this session` |
| Zero-tickets subtext | `Solve 5 puzzles in a session to earn your first ticket` | `Every 5 puzzles solved earns 1 ticket toward the weekly draw` |
| Weekly progress label | `Tickets this week` | `Tickets toward this week's draw` |
| Weekly progress value | `4 / 50` | `4 of 50` |
| Nudge — partial | `Solve 1 more puzzle next session for another ticket` | `Solve 1 more puzzle for your next ticket` |
| Nudge — clean multiple | `Great session — play again to keep earning` | `Nice rhythm — every 5 puzzles earns 1 ticket` |
| Nudge — zero | `Solve 5 puzzles next session to earn a ticket` | `Solve 5 puzzles in a session to earn your first ticket` |
| Streak pill — day 1-2 | `Day 2 — reach day 3 for bonus entries` | `Day {streak} streak — reach day 3 for +1 bonus ticket per session` |
| Streak pill — day 3-6 | `Day {n} — earning +1 bonus entry per session` | `Day {n} streak — +1 bonus ticket per session` |
| Streak pill — day 7-13 | `Day {n} — earning +2 bonus entries per session` | `Day {n} streak — +2 bonus tickets per session` |
| Streak pill — day 14+ | `Day {n} — earning +3 bonus entries per session` | `Day {n} streak — +3 bonus tickets per session` |

### Implementation notes

- All edits are copy-only inside `src/routes/_authed/results.tsx`.
- Add a `<p className="mt-2 text-sm text-muted-foreground">Added to your weekly draw</p>` directly below the hero number (only when `entries > 0`).
- Update `breakdownParts` construction to use the new phrasings, including pulling `streak` and `puzzlesSolved` into the strings.
- Update streak pill block to consistently use "tickets" and "Day N streak" framing.
- No layout, color, or component changes. No data-flow changes.

### Out of scope

- CheckMate/WisdomDrop landing screens.
- Buttons ("Play again", "Back to Home") unchanged.
- No structural redesign — this is a pure copy pass.

