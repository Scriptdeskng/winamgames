

## Plan

Two small edits to `src/routes/_authed/index.tsx`.

### 1. Countdown format with days

Update `formatHMS` (rename to `formatCountdown`) to include days when remaining time exceeds 24 hours:

```ts
function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const hms = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return days > 0 ? `${days}d ${hms}` : hms;
}
```

The existing `getNextSundayWAT()` logic is already correct — it computes the next Sunday at 19:00 UTC (= 20:00 WAT) and rolls forward to next week if today is Sunday past the cutoff. The `remaining = targetDate.getTime() - now` calculation in `DrawHeroCard` is also correct (target minus now = time until draw, not elapsed).

When days are present, the digit count grows (e.g. `2d 05:28:00` is wider than `00:00:00`). To keep the timer from overflowing the card on a 390px viewport, drop the countdown text size from `text-5xl` to `text-4xl`.

### 2. Remove "Play now" button from empty state

In `DailyMissionsSection`, delete the `<Link to="/checkmate">Play now</Link>` element from the empty state card. Keep the heading "Missions reset at midnight" and the subtext "Play now to build your streak and earn entries". Remove the now-unused `Link` reference inside that block (the import stays since it's used elsewhere).

### Files touched
- `src/routes/_authed/index.tsx` — update `formatHMS`, adjust countdown text size, trim the missions empty state.

