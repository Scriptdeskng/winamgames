

# Home Page: Remove Leaderboard, Add Quick Tips

## Changes

### Remove
- **Leaderboard section** (lines 154-178 in `index.tsx`)
- Remove `getLeaderboard` call from the data fetch
- Remove `Trophy` icon import and leaderboard state

### Add: "Did You Know?" Quick Tip
A compact card below Daily Missions showing a rotating game tip. Tips rotate daily based on the date so every player sees the same tip each day.

**Tips content** — hardcoded array covering mechanics players often miss:
- "Streaks of 3+ days earn a bonus entry each game"
- "Solving puzzles without hints gives 2x coins"
- "Complete all 3 daily missions for extra entries"
- "Your rank tier upgrades as you earn more XP"
- "Each correct answer earns entries into the weekly draw"
- "Play both CheckMate and WisdomDrop to complete the game mix mission"

**Design:** Small card with a `Lightbulb` icon, muted styling, tip text. Rotates by `dayOfYear % tips.length`.

### Keep current section order
Draw → Streak → Games → Missions → Quick Tip

## Files

### `src/routes/_authed/index.tsx`
- Remove `getLeaderboard` import and call
- Remove `Trophy` from icon imports, add `Lightbulb`
- Remove leaderboard state/rendering (lines 154-178)
- Add `TIPS` array and a `Did You Know?` card after missions

### `src/utils/mission.functions.ts`
- No changes needed (keep `getLeaderboard` — it's still used by `/leaderboard` page)

