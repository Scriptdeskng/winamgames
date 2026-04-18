

## Plan

Single-file refactor of `src/routes/winners.tsx` to remove all airtime/data interactivity while keeping the past-week expand/collapse behavior for the cash top 3.

### Changes

**1. Delete `AirtimeSection` component entirely**
It's no longer needed — no collapsible, no list, no search, no chevron, no per-tier breakdown.

**2. Replace it with a static summary line**
A single muted text line rendered directly inside `DrawWeekCard`'s expanded content:

```tsx
<p className="text-xs text-muted-foreground px-1">
  + {totalAirtimeWinners} airtime & data winners
</p>
```

Where `totalAirtimeWinners = draw.airtimeTiers.reduce((s, t) => s + t.winners.length, 0)` (= 75 per the current data: 5 + 10 + 60).

No `Collapsible`, no `CollapsibleTrigger`, no chevron icon, no click handler. Pure static text.

**3. Keep `DrawWeekCard` collapsible behavior unchanged**
- Collapsed row still shows date label + total winner count + chevron.
- Expanded view still shows the 3 cash winners fully (already always visible when the week is expanded — no nested collapse there today).
- The new static airtime line replaces the old `<AirtimeSection>` call inside the expanded content.

**4. Imports cleanup**
Remove `useState` if no longer needed in the file (still needed by `DrawWeekCard` for week-level open state — keep it). Remove the `ChevronDown` usage from the deleted `AirtimeSection` only; the week-level chevron stays.

### Files touched
- `src/routes/winners.tsx` — single edit: delete `AirtimeSection`, replace its call site with the static `<p>` line.

### What stays exactly the same
- `DRAW_WEEKS` data structure (we keep `airtimeTiers` only to compute the count — could simplify later, but no need now).
- Hero card, bottom CTA, page layout, `TopBar`.
- Cash prize winner rendering with position badges (1st/2nd/3rd), phone, entry hash, prize amount.
- Past-week collapse behavior — first week open by default, others collapsed.

