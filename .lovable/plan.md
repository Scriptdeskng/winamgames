

## Plan

Two small changes to align the top bar with the StaySharp pattern (single nav control per screen) and remove duplicate menu entries.

### 1. Hide hamburger on sub-pages — `src/components/layout/TopBar.tsx`
- When `backTo` is set, render the back arrow on the left and a placeholder spacer (same `h-10 w-10`) on the right so the centered "WinamGames" wordmark stays visually centered.
- When `backTo` is not set (home only), keep the avatar (left) + `MenuSheet` (right) as today.

### 2. Clean up menu items — `src/components/layout/MenuSheet.tsx`
Current list has Home, Games, Leaderboard, My Entries, Winners — Home and Games both route to `/`, which is the duplicate.

New list (4 items, all distinct destinations):
- Home → `/`
- Leaderboard → `/leaderboard`
- My Entries → `/entries`
- Winners → `/winners`

Remove the special-case active logic for "Games" (no longer needed). Active state becomes a simple `location.pathname === item.to` check.

### Files touched
- `src/components/layout/TopBar.tsx` — conditional right slot
- `src/components/layout/MenuSheet.tsx` — drop Games entry, simplify active check

No new components, no new routes, no logic changes elsewhere. The menu still only renders on `/` since `TopBar` is the only place `MenuSheet` is mounted.

