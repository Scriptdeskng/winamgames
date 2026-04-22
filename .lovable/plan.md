

## Embed hero graphics into CheckMate & WisdomDrop intro screens

The hero section on `/` has two beautifully crafted floating preview graphics: a 4×4 chess fragment (`HeroChessFragment`) and a proverb fill-in card (`HeroProverbCard`). The two game intro screens (`/checkmate`, `/wisdomdrop`) currently have a large empty middle area between the stat chips and the "Earn up to 5 tickets" reward card. Drop the matching graphic into that empty space on each respective page.

### What changes

**1. Extract the two graphics into a shared, reusable module**

Move the `HeroChessFragment` and `HeroProverbCard` components out of `src/routes/index.tsx` into a new file:

- New file: `src/components/landing/HeroGameGraphics.tsx`
- Exports: `HeroChessFragment`, `HeroProverbCard`
- The landing page imports them from the new module instead of defining them inline (zero visual change to `/`).

This avoids duplicating ~95 lines of carefully-tuned markup across three files.

**2. Adapt the graphics for the intro-screen context**

The hero versions are absolutely positioned (`absolute left-0 top-2 ...`) because they sit in a fixed-height stacked container. For the intro screens we need an inline, centered variant. Approach: add an optional `variant?: "hero" | "intro"` prop to each component.

- `variant="hero"` (default) → keeps current absolute positioning. Landing page unchanged.
- `variant="intro"` → renders without absolute wrapper, centered, sized to fit the ~320px-wide intro column.

Both variants keep the existing `animate-landing-float`, `animate-landing-pulse-ring`, and `animate-landing-piece-glow` animations so they feel alive in both contexts.

**3. Place the graphics in the intro screens**

In `src/routes/_authed/checkmate.tsx` and `src/routes/_authed/wisdomdrop.tsx`, the intro layout currently is:

```text
[medallion]
[title + tagline]
[stat chips]
  ↓ flex-1 spacer (this is the empty middle the user pointed out)
[reward card]
[CTA button]
```

Replace the bare `flex-1 min-h-6` spacer with a centered graphic block:

- **CheckMate intro**: `<HeroChessFragment variant="intro" />` — single tilted board fragment, centered, with the same emerald glow treatment as the medallion above for visual continuity.
- **WisdomDrop intro**: `<HeroProverbCard variant="intro" />` — single tilted proverb card, centered.

Keep the `flex-1` behavior so the graphic still pushes the reward card + CTA toward the bottom of the viewport on tall screens, but constrain the graphic itself so it doesn't grow unbounded. Practically: wrap in `flex-1 flex items-center justify-center w-full py-4`.

The graphic adds personality and game-specific visual identity to the intro screen without competing with the medallion (which stays as the primary brand mark at the top).

### Layout sketch (intro screen, after change)

```text
[← back]
                              
       [emerald medallion]    
                              
       WisdomDrop / CheckMate 
       tagline                
                              
   [3 lives] [10 …] [9 …]    
                              
                              
        ┌──────────────┐      
        │  graphic     │      ← new (tilted, floating, ~280px wide)
        │  (chess or   │      
        │   proverb)   │      
        └──────────────┘      
                              
                              
   ┌─────────────────────┐    
   │ 🪙 Earn up to 5 …   │    
   └─────────────────────┘    
   ┌─────────────────────┐    
   │   Start Game  →     │    
   └─────────────────────┘    
```

### Files touched

- **New**: `src/components/landing/HeroGameGraphics.tsx` — extracted `HeroChessFragment` + `HeroProverbCard` with `variant` prop.
- **Edited**: `src/routes/index.tsx` — remove inline component definitions, import from new module. No visual change.
- **Edited**: `src/routes/_authed/checkmate.tsx` — replace empty `flex-1` spacer with `<HeroChessFragment variant="intro" />`.
- **Edited**: `src/routes/_authed/wisdomdrop.tsx` — replace empty `flex-1` spacer with `<HeroProverbCard variant="intro" />`.

### Notes on the build errors

The TS errors in the message (`Cannot find module './routeTree.gen'` plus 16× `Argument of type "/..." is not assignable to parameter of type 'undefined'`) are all symptoms of the TS server still pointing at the previous (stale) route-tree typings from the earlier rename fix. The on-disk `src/routeTree.gen.ts` was regenerated correctly and the dev server is serving 200 OKs. These errors will clear on the next typecheck pass once Vite re-emits route types — the work above doesn't introduce or worsen them.

### Out of scope

- Any change to the medallion, title, tagline, stat chips, reward card, or CTA on the intro screens.
- Any change to the hero section on `/`.
- Wiring the graphics to live game data — they remain stylized illustrations.

