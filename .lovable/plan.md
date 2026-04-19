

## Swap hero card visual treatments between Home and Winners

The Winners hero uses a warm marketing treatment (primary gradient wash, primary-tinted border, centered icon). The Home `DrawHeroCard` uses a flatter dashboard treatment (plain `surface-1` + `border`, thin top gradient strip). Swap the **container treatments** while keeping each card's content intact.

### Changes

**`src/routes/_authed/index.tsx` → `DrawHeroCard`**

Swap the outer wrapper from:
```
rounded-2xl bg-surface-1 border border-border p-5 shadow-card
+ inner top gradient strip (from-primary/10)
```
to the Winners-style treatment:
```
rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent
border border-primary/20 p-5 shadow-card
```
- Remove the inner `absolute ... bg-gradient-to-b` overlay strip — the full-card gradient replaces it.
- Keep all content as-is: eyebrow "Weekly Draw", countdown, ticket progress bar, footer link. Layout stays left-aligned (it's a dashboard card, not a poster), only the surface treatment changes.
- Progress bar track changes from `bg-surface-2` to `bg-background/40` so it reads against the lighter gradient.

**`src/routes/_authed/winners.tsx` → Hero card**

Swap the outer wrapper from:
```
rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent
border border-primary/20 p-5 text-center space-y-2
```
to the Home-style treatment:
```
relative overflow-hidden rounded-2xl bg-surface-1 border border-border p-5 shadow-card text-center space-y-2
+ inner top gradient strip: absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/10 to-transparent
```
- Keep Award icon, headline, subhead, and "Play Now" pill CTA centered.
- Wrap text content with `relative` so it sits above the gradient strip.

### Out of scope

- Content / copy changes.
- Other cards (mission rows, banner stack, draw week cards, streak strip).
- Spacing, typography, icon choices.

### Files touched

- `src/routes/_authed/index.tsx` — `DrawHeroCard` wrapper only.
- `src/routes/_authed/winners.tsx` — hero card wrapper only.

