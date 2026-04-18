

## Plan

Update `DrawHeroCard` in `src/routes/_authed/index.tsx` to render the countdown as stacked number + label units instead of the current inline `Xd HH:MM:SS` string.

### Changes

**1. Replace `formatCountdown` with `getCountdownParts`**
Returns structured data instead of a string:
```ts
function getCountdownParts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}
```

**2. Replace the single `<p>` timer in `DrawHeroCard` with a stacked unit row**
- Flex row, `items-end`, no gap on the colon separators (tight).
- Each unit = a small flex column: number on top (`font-mono text-4xl font-bold tabular-nums leading-none`), label below (`text-[10px] text-muted-foreground lowercase mt-0.5`).
- Colons are their own column, vertically aligned to the number row only (`text-4xl font-mono leading-none` with bottom padding equal to label height so the colon sits next to digits, not labels).
- Conditionally render the `day` unit + its trailing colon only when `days > 0`.

Sketch:
```tsx
<div className="flex items-end gap-1.5">
  {days > 0 && (
    <>
      <Unit value={days} label="day" />
      <Colon />
    </>
  )}
  <Unit value={hours} label="hr" />
  <Colon />
  <Unit value={minutes} label="min" />
  <Colon />
  <Unit value={seconds} label="sec" />
</div>
```

**3. Spacing**
- The current timer `<p>` had `mt-2` from the label and the entries line had `mt-4`. Keep both spacings exactly as they are — the new block replaces the `<p>` in place. The 10px label sits inside the unit column so it doesn't push the entries line down.
- To prevent the labels from adding visible height vs the old single line, use `leading-none` on the number and `mt-0.5` on the label, then reduce the entries-line `mt-4` to `mt-3` so total visual height stays ~equal.

**4. Sub-24h behaviour**
Already handled by the conditional `days > 0` render — only `hr / min / sec` show in the final day.

### Files touched
- `src/routes/_authed/index.tsx` — swap `formatCountdown` for `getCountdownParts`, replace timer `<p>` with stacked unit layout, tweak entries-line top margin from `mt-4` to `mt-3`.

