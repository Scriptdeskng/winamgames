

## Clarify ticket reset timing in profile copy

User points out the intro paragraph says "they reset every Monday" without a time, and the reset should logically align with when the draw closes (Sunday 20:00 WAT), not some arbitrary Monday moment.

### Current copy (intro)
> Every Sunday at 20:00 WAT we run a cash draw. Tickets are your entries — the more you collect during the week, the better your odds of winning. Earn them by playing; they reset every Monday.

### Problem
- "Every Monday" is vague — Monday midnight? Monday 9am?
- Conceptually messy: if the draw runs Sunday 20:00 WAT but tickets reset "Monday", there's a gap (or overlap) where ticket state is undefined to the user.
- Rule 4 has the same issue: "The draw runs Sunday 20:00 WAT, then everything resets Monday."

### Quick verification needed
Before committing copy, I want to confirm the actual reset moment in code — `mem://features/draw` says "Weekly draw cycle in WAT timezone, seeded random selection, entry cap 50" but doesn't specify reset timing. I'll check `src/utils/mission.server.ts` and the draw-related logic to confirm reset is tied to the draw close (Sunday 20:00 WAT) vs. a separate Monday rollover. If it's actually Monday 00:00 WAT in code, the copy should say that explicitly. If it resets at draw close, copy should say so.

### Proposed copy (assuming reset = draw close, which is the cleanest model)

**Intro:**
> Every Sunday at 20:00 WAT we run a cash draw. Tickets are your entries — the more you collect during the week, the better your odds of winning. Once the draw runs, your ticket count resets and a new week begins.

**Rule 4:**
> You can collect up to 50 tickets per week. Anything beyond that converts to coins. The draw runs every Sunday at 20:00 WAT — right after, tickets reset and the next week starts.

This removes "Monday" entirely and ties reset to the event the user actually cares about (the draw).

### Files touched
- `src/routes/_authed/profile.tsx` — intro paragraph + rule 4 body. ~2 string edits.

### Verification step during implementation
Open `src/utils/mission.server.ts` (or wherever week-window logic lives) and confirm the week boundary. If reset is genuinely a separate Monday rollover (not draw-close), the copy will say "Tickets reset Monday at 00:00 WAT, right after the Sunday draw" instead — same clarity, accurate to code.

