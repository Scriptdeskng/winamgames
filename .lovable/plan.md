

## Make the Results page feel premium

### What's wrong now

Looking at the screenshot:
1. **The big bordered card feels boxy and disconnected** — it's a heavy `surface-1` rectangle floating on a black canvas with the trophy + title sitting *outside* it. The card's framing competes with the hero number instead of supporting it.
2. **The hero number (`+3 tickets`) is the moment**, but it's buried inside a generic container alongside weekly progress (a different concept). Two different ideas, one box → muddled hierarchy.
3. **Vertical centering wastes the screen** — content floats mid-viewport with awkward emptiness above and below. Premium results screens (Apple Fitness, Duolingo end-of-lesson, Stripe receipts) anchor content to the top with intentional rhythm.
4. **The trophy badge is generic** — a flat tinted square. No depth, no celebration energy.
5. **The streak pill sits orphaned** between the card and CTAs with no visual relationship to either.

### Direction: dissolve the card, let the hero breathe

Strip the heavy card chrome. Let the hero number be the page. Treat secondary info (weekly progress, breakdown) as supporting strata separated by space and subtle dividers — not boxed-in sub-sections.

### Layout (top → bottom, anchored to top, not centered)

```text
┌─ TopBar ──────────────────────────────────┐
│                                           │
│         [trophy halo, larger]             │  ← celebratory medallion w/ glow
│                                           │
│         Session Complete                  │  ← smaller, muted label
│         +3 tickets                        │  ← HERO, very large, primary
│         Added to your weekly draw         │  ← caption
│                                           │
│   Solved 9 puzzles +1 · Mission +2        │  ← breakdown chips, tiny + muted
│                                           │
│   ─────────────────────────────────────   │  ← hairline, no card border
│                                           │
│   This week's draw            4 of 50     │
│   ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │
│   Solve 1 more puzzle for your next       │
│                                           │
│   🔥 Day 2 streak — reach day 3 …         │  ← inline below progress, related
│                                           │
│   [ Play again ]                          │  ← CTAs anchored bottom
│   [ Back to Home ]                        │
└───────────────────────────────────────────┘
```

### Specific changes (`src/routes/_authed/results.tsx`)

1. **Remove the `surface-1` card wrapper** entirely. Use vertical spacing + a single hairline divider instead of a bordered container.
2. **Anchor to top, not centered**: change `flex-1 ... justify-center` → `pt-8` with natural flow. CTAs pinned via `mt-auto`.
3. **Upgrade the trophy medallion**:
   - Larger: `h-20 w-20` (was 16).
   - Layered glow: outer `bg-primary/10` ring + inner gradient `bg-gradient-to-b from-primary/25 to-primary/10`, `border border-primary/30`, `shadow-glow`.
   - Trophy icon `h-10 w-10`.
4. **Hero typography hierarchy**:
   - Drop the existing "Session Complete!" h1 and replace with a small uppercase eyebrow: `text-xs font-medium tracking-[0.18em] uppercase text-muted-foreground` reading `Session Complete`.
   - Hero number scales up: `text-5xl font-bold tabular-nums text-primary` with subtle drop-glow via `[text-shadow:_0_0_24px_hsl(var(--primary)/0.35)]`.
   - Subtext stays `text-sm text-muted-foreground`.
   - Breakdown chips stay tiny (`text-xs text-muted-foreground/70`).
5. **Hairline divider** (no card): `mt-8 h-px w-full bg-border/40` between hero block and weekly-progress block.
6. **Weekly progress** rendered as a flat block (no border, no surface fill) with the same label/value row + Progress bar + nudge underneath. Tighten the nudge to `text-xs text-muted-foreground` (no `text-center` — left-aligned beneath the bar reads more "receipt-like" and premium).
7. **Streak pill** moves to sit directly under the nudge (still as the existing pill style) so it visually belongs to the weekly-progress section, not floating between concepts.
8. **CTAs pinned to bottom** via `mt-auto pt-8` so they sit at the safe-area edge regardless of content height. Keep current button styling — they're already fine.
9. **Rank-up notification** keeps its own bordered surface (it's a discrete event worth highlighting), but reduce visual weight: shrink padding `p-4 → p-3`, place it *above* the eyebrow so it doesn't break the hero rhythm.

### Why this reads "premium"

- **One thing at a time**: the hero number owns the top of the screen with breathing room around it — the way Apple Wallet / Linear / Stripe present a single primary value.
- **Hairlines instead of cards**: borders are heavy on dark UIs; thin dividers feel like fine print on a luxury receipt.
- **Eyebrow + hero pattern** is the modern alternative to "big title + smaller stat" and reads more confident.
- **Glow under the hero number** uses our emerald token for a subtle premium accent without being neon.
- **Anchored CTAs** keep the action thumb-reachable and let upper content breathe at any height.

### Out of scope

- Color tokens / Tailwind theme.
- Buttons, RankBadge, Progress, TopBar internals.
- Data flow, search params, navigation.
- Animations (could be a follow-up: count-up on hero number, fade-in stagger).

### Files touched

- `src/routes/_authed/results.tsx` — single-file restructure.

