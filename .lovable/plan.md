

## Polish the WisdomDrop landing screen

### What's weak today
- Huge empty space above/below the centered block — feels thin on mobile.
- Icon tile is flat (`bg-xp/15` purple square) and disconnected from the page personality.
- "3 lives / 10 proverbs" stats are plain stacked text — no hierarchy.
- Title is small (`text-2xl`), no gradient/treatment, no cultural cue for an African-proverbs game.
- Button is fine but floats in space.
- No mention of rewards (entries, coins, hint system) — players don't know what they're playing for.

### Design direction (matches Refined Arena tokens already in the system)

Keep dark emerald palette. Add depth via:
- **Ambient background glow** — soft radial emerald gradient blob behind the hero icon (uses existing `--emerald` / `--emerald-glow` tokens, no new colors).
- **Layered icon medallion** — replace flat purple square with an emerald-tinted circular medallion: outer ring (border + glow), inner gradient surface, BookOpen icon centered. Carries the brand color and feels crafted.
- **Gradient title** — apply existing `.text-gradient-emerald` utility, bump to `text-3xl`, tighten tracking.
- **Tagline refinement** — keep one line, slightly larger, italicized to evoke a proverb's voice: *"Where ancient wisdom meets modern play."*
- **Stats as chip row** — three small pill chips side-by-side instead of stacked text:
  - `🛡 3 lives` (using Heart icon, live color)
  - `📜 10 proverbs` (using ScrollText icon, xp color repurposed as accent)
  - `🌍 9 regions` (using Globe icon, emerald)
  Each chip = `bg-surface-1 border border-border rounded-full px-3 py-1.5` with icon + tabular-nums label.
- **Reward preview card** — small glass card above the CTA showing what's at stake:
  - "Earn up to **5 entries** per round" with coin/entry iconography
  - One-line subtext: "Plus XP, streak bonuses, and weekly draws"
  This solves the "what am I playing for" gap.
- **CTA button** — keep emerald primary but add subtle inner highlight (gradient overlay) and a small `Play` or `ArrowRight` icon trailing the label. Make it full-width within the content area (max-w-[320px]) for stronger presence.
- **Layout rhythm** — replace the centered `min-h-screen flex` with a more deliberate vertical stack: `pt-20` from top, content flows downward, CTA + reward card anchored near 60% viewport. Removes the "floating in void" feel.
- **Back button** — refine: same position but add subtle backdrop-blur and slightly stronger border on hover.

### Technical notes
- Single file edit: `src/routes/_authed/wisdomdrop.tsx`, only the `if (!session.sessionId)` return block.
- No new dependencies. Lucide icons (`Heart`, `ScrollText`, `Globe`, `ArrowRight`, `Coins`) are already in the icon set used elsewhere.
- All colors via existing CSS tokens (`--emerald`, `--coin`, `--xp`, `--live`, `--surface-1`). No `--styles.css` changes.
- Background glow = absolute-positioned div with `bg-emerald/10 blur-3xl` behind content (z-0), content sits at z-10.
- Mobile viewport (390×844) verified — design fits comfortably with breathing room top and bottom, no scroll required.
- In-game UI (header, puzzle card, options, hint button) untouched — this plan is landing-screen only.

### Files touched
- `src/routes/_authed/wisdomdrop.tsx` — replace landing-screen JSX (~30 line block, lines 36-64). Add 2-3 new lucide imports.

### Out of scope
- CheckMate landing screen (similar structure but separate task — happy to mirror this treatment in a follow-up if you like the result).
- In-game puzzle UI.
- Any backend/data changes.

