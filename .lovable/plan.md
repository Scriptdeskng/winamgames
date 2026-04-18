

The user wants more thematic, visually distinct icons for the 8 rank tiers. Current mapping uses generic icons (User, UserCheck, Award, Shield, Medal, Star, Trophy, Crown) — functional but flat progression.

Let me design a better icon ladder that tells a visual story of progression: from humble beginner → trained soldier → elite warrior → mythic figure. Icons should feel distinct at a glance and escalate in visual weight/drama.

## Improved Icon Mapping

| Tier | Icon | Rationale |
|------|------|-----------|
| Starter | `Sprout` | New growth, beginning — softer than generic User |
| Recruit | `Swords` | Training, first weapon — clear "joined the fight" feel |
| Sergeant | `ShieldHalf` | Earned defense, partial mastery |
| Veteran | `Flame` | Battle-tested, fiery resolve |
| Champion | `Trophy` | Peak competitive achievement |
| Icon | `Gem` | Rare, precious, standout status |
| Legend | `Sparkles` | Mythic aura, otherworldly |
| Immortal | `Crown` | Ultimate sovereignty — apex of the ladder |

### Color progression (escalating saturation)
| Tier | Color token |
|------|-------------|
| Starter | `text-muted-foreground` / `bg-muted/15` |
| Recruit | `text-blue-400` / `bg-blue-400/15` |
| Sergeant | `text-cyan-400` / `bg-cyan-400/15` |
| Veteran | `text-orange-400` / `bg-orange-400/15` |
| Champion | `text-coin` / `bg-coin/15` (gold) |
| Icon | `text-purple-400` / `bg-purple-400/15` |
| Legend | `text-streak` / `bg-streak/15` |
| Immortal | `text-xp` / `bg-xp/15` (with shadow-glow accent) |

### Why this is better
- **Narrative arc**: organic growth → weapon → shield → fire → trophy → gem → magic → crown
- **Visual variety**: not all "human/medal" icons; mixes nature, weaponry, elemental, mythic
- **Color ladder** climbs the spectrum (cool → warm → gold → mystical), reinforcing rank prestige
- **Immortal tier** gets a `shadow-glow` accent in `RankBadge` for that final flourish

## Files affected (same as prior plan, only icon/color values change)
- `src/components/profile/RankBadge.tsx` — update `RANK_CONFIG` icons + colors, add glow for Immortal
- All other changes from the previously approved rank-system plan remain identical (DB migration, XP thresholds in `game.functions.ts`, "pawn" → "starter" fallback replacements)

## Optional polish
Add a subtle `shadow-glow` ring to the Immortal badge container so the top tier visually pops vs the others.

