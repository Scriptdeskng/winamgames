

## Add thin separators between top 3 cash winners

In `src/routes/_authed/winners.tsx`, the three cash winners (1st/2nd/3rd) currently render in a `space-y-1.5` stack with no visual division. Add a subtle divider between rows so each position reads as its own line.

### Change

In `DrawWeekCard`, the cash winners block (~lines 167–187) maps `draw.cashWinners` and renders each as a `<div>`. Add a bottom border to all but the last row:

```tsx
{draw.cashWinners.map((w, j) => (
  <div
    key={j}
    className={`flex items-center justify-between py-2 ${
      j < draw.cashWinners.length - 1 ? "border-b border-border/40" : ""
    }`}
  >
    {/* unchanged inner content */}
  </div>
))}
```

- `border-border/40` — thin, muted (40% of token border color) so it whispers rather than competes with the card border.
- Bumped `py-1` → `py-2` for a touch more breathing room around the divider (still compact).
- Last row gets no border so it doesn't double up with the "+ N airtime & data winners" line below.
- Outer `space-y-1.5` on the parent stays — the eyebrow label still gets its gap from the rows.

### Out of scope

- Airtime tier rendering (currently summarized as a single line).
- Card borders, hero CTA, or other sections.
- Other pages.

### File touched

- `src/routes/_authed/winners.tsx` (one block inside `DrawWeekCard`)

