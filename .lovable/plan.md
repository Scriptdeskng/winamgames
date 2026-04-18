

## Add color to home — minimise monotone feel

Right now every block on home uses the same recipe: `bg-surface-1 + border-border + emerald accent`. The result is a wall of grey-on-charcoal where only the streak strip and rank badge carry any color. We have a perfectly good semantic palette (`primary/emerald`, `xp/violet`, `streak/orange`, `coin/gold`, `live/red`, `success/emerald`) that's barely used.

Goal: introduce color **strategically per section** so each block has its own identity, without breaking the calm "Refined Arena" aesthetic. No rainbow — color is a tool to differentiate, not decorate.

### Approach: assign each section a signature accent

| Section | Today | Proposed accent | Treatment |
|---|---|---|---|
| DrawHeroCard | flat surface-1, emerald progress only | **Emerald** (already the primary CTA — make it bolder) | Subtle emerald glow on the top edge via gradient overlay; emerald-tinted progress track; keep card bg neutral so text stays legible |
| StreakRankStrip | flat | already has streak orange + rank color — leave as-is, it's our color anchor | No change |
| BannerStack | every banner uses emerald icon regardless of content | **Per-banner accent** mapped from the banner's icon (trophy → gold, flame → streak/orange, book → xp/violet, sparkles → emerald) | Tinted icon bg + matching icon color, instead of always emerald |
| MissionsSection | each mission already has a meta tint (emerald/violet/orange) — but mission rows otherwise read as grey | already colored via `MISSION_META` — minor: also tint the entries-reward pill to **gold** (`bg-coin/10 text-coin`) since rewards are entries/tickets, not generic primary | Reward pill swap |
| Play Now grid | CheckMate emerald, WisdomDrop violet | already differentiated — leave alone | No change |

### Two visual changes worth detailing

**1. DrawHeroCard — soft emerald wash on top edge**

Add a faint emerald-to-transparent gradient overlay (only ~40px tall, ~10% opacity) at the top of the card. Lifts it from "another grey card" to "the hero", without resorting to a fully colored card (which would over-shout against everything else).

```tsx
<div className="relative overflow-hidden rounded-2xl bg-surface-1 border border-border p-5 shadow-card">
  <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/10 to-transparent" />
  {/* existing content */}
</div>
```

**2. BannerStack — accent maps to icon type**

Replace the hard-coded `bg-muted` + `text-primary` icon with a small lookup so each banner type carries its own color:

```tsx
const ICON_STYLES: Record<string, { bg: string; fg: string }> = {
  trophy:  { bg: "bg-coin/15",    fg: "text-coin" },
  flame:   { bg: "bg-streak/15",  fg: "text-streak" },
  book:    { bg: "bg-xp/15",      fg: "text-xp" },
};
const fallback = { bg: "bg-primary/15", fg: "text-primary" };
const style = (banner.icon_url && ICON_STYLES[banner.icon_url]) || fallback;
```

Then use `style.bg` and `style.fg` on the icon container/icon.

**3. MissionsSection — tint the reward pill gold**

Entries are essentially tickets/rewards — gold reads as "prize" universally and breaks up the emerald repetition.

```tsx
// before
"bg-primary/10 text-primary"
// after
"bg-coin/10 text-coin"
```

### What we're deliberately NOT doing

- No colored card backgrounds (would clash and reduce contrast for body text).
- No per-mission card tinting beyond what already exists (the icon swatch is enough).
- No new tokens — using existing `--coin`, `--xp`, `--streak`, `--primary`.
- No animation/glow additions — accent comes from hue alone.

### Resulting color rhythm down the page

```
Hero          → emerald wash (primary)
Streak strip  → orange + tier color  
Banners       → varies per banner (gold / orange / violet / emerald)
Missions      → mission icons already colored; reward pills now gold
Play Now      → emerald + violet tiles
```

Five distinct color moments, none competing, all from the existing palette.

### Files touched

- `src/routes/_authed/index.tsx` — DrawHeroCard gradient overlay (3 lines), MissionRow reward pill class swap (1 string).
- `src/components/home/BannerStack.tsx` — replace single icon style with `ICON_STYLES` lookup (~6 lines).

