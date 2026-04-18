

## Tighten Coins/Streak popover copy to reference weekly draw

Small clarification update to the popover copy proposed in the prior plan. The word "entry" / "entries" should be unambiguous — make it explicit they're **weekly draw entries**, not generic points.

### Updated popover copy

**Coins popover:**
> **Coins** are earned from sessions and from overflow when you've already hit the 50-entry weekly draw limit. Spend them on hints during gameplay — different hint types cost different amounts.

**Streak popover:**
> Your **streak** counts consecutive days you've played. Reach Day 3 for +1 bonus weekly draw entry per session, Day 7 for +2, Day 14 for +3. Miss a day and it resets to zero.

### Everything else from prior plan stays

1. Use `Popover` (not Tooltip) — touch-friendly.
2. Small `Info` icon top-right of each tile, opens the popover.
3. Swap CTA `Play` icon → `ArrowRight`, move it after the text.
4. Wrap "How entries work" in `Accordion`, collapsed by default.

### Files touched

- `src/routes/_authed/profile.tsx` only.

### Imports

- **Add:** `ArrowRight`, `Info` (lucide-react); `Popover, PopoverTrigger, PopoverContent`; `Accordion, AccordionItem, AccordionTrigger, AccordionContent`.
- **Remove:** `Play`.

