

## Plan

Two small text changes to `src/routes/_authed/winners.tsx`.

### 1. Hero card subtitle
Line ~228: change `"78 winners every week — cash, airtime & data"` → `"50+ winners every week — cash, airtime & data"`.

### 2. Collapsed past week winner counts
Currently `DrawWeekCard` computes `totalWinners = draw.cashWinners.length + totalAirtimeWinners` and renders it as `{totalWinners} winners`. Both seeded weeks in `DRAW_WEEKS` have actual winner records (3 cash + 75 airtime/data = 78), so they keep the literal `"78 winners"`.

To support future/placeholder weeks, add an optional `isPlaceholder?: boolean` flag to the `DrawWeek` interface. In `DrawWeekCard`:

```tsx
<p className="text-[10px] text-muted-foreground">
  {draw.isPlaceholder ? "50+ winners" : `${totalWinners} winners`}
</p>
```

No data entries are flagged as placeholder right now, so visible behavior is unchanged for the two seeded weeks — the field is just available for any future placeholder draw added to `DRAW_WEEKS`.

### Files touched
- `src/routes/_authed/winners.tsx` — hero subtitle text + `DrawWeek` interface field + count render line.

