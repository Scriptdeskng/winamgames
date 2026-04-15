

# Replace Bottom Nav with Hamburger Menu (StaySharp Style)

## What changes

Remove the fixed bottom navigation bar and replace it with a top header bar on every authenticated page. The header will have:
- **Left**: Profile avatar button (links to `/profile`)
- **Center**: "WinamGames" logo/text
- **Right**: Hamburger menu button that opens a bottom Sheet with navigation links

This matches the StaySharp pattern: profile icon left, logo center, hamburger right, bottom sheet menu.

## UI styling patterns to adopt from StaySharp (not colors)

1. **Bottom Sheet menu** instead of bottom tab bar — slides up from bottom with rounded top corners (`rounded-t-3xl`), clean list of nav items with icons and optional count badges
2. **Top bar layout**: profile button (left) — centered logo — menu button (right), all using `rounded-xl bg-card border border-border` button style
3. **Full-height screens** (`h-[100dvh]`) with content centered vertically where appropriate (e.g. setup/home)
4. **Compact stat cards** in a horizontal row with icon-in-colored-bg pattern (icon inside a tinted rounded square)
5. **Motion transitions** on screen entries (fade + slide) — can add later
6. **Pill-shaped option selectors** for toggles (difficulty, count) instead of dropdowns
7. **`text-[10px] uppercase tracking-wider`** for section labels — you already use this

## Files to change

### Create: `src/components/layout/MenuSheet.tsx`
- Hamburger button that opens a bottom Sheet
- Nav items: Home `/`, Games `/checkmate`, Leaderboard `/leaderboard`, My Entries `/entries`, Winners `/winners`
- Each item has icon, label, and closes sheet on tap then navigates via Link
- Active route highlighted

### Create: `src/components/layout/TopBar.tsx`
- Reusable top bar component used across all authed pages
- Left: profile avatar (first letter of nickname, links to `/profile`)
- Center: "WinamGames" text
- Right: MenuSheet hamburger
- Reads session from `getSession()` for the avatar letter

### Delete: `src/components/layout/BottomNav.tsx`

### Update: `src/components/layout/AppShell.tsx`
- Remove BottomNav import and usage

### Update all pages that use BottomNav:
- `src/routes/_authed/index.tsx` — replace BottomNav with TopBar, remove `pb-24`
- `src/routes/_authed/profile.tsx` — replace BottomNav with TopBar, remove header row (TopBar handles it)
- `src/routes/_authed/leaderboard.tsx` — replace BottomNav with TopBar
- `src/routes/_authed/entries.tsx` — replace BottomNav with TopBar
- `src/routes/_authed/winners.tsx` — replace BottomNav with TopBar

### Update sub-pages with back buttons (entries, winners):
- Keep the back arrow but integrate with TopBar pattern (back arrow replaces profile icon on left)

## Technical notes
- Uses existing `Sheet` component from `src/components/ui/sheet.tsx` with `side="bottom"`
- No new dependencies needed
- `getSession()` from `src/lib/session` for avatar initial
- Navigation via TanStack Router `Link` and `useNavigate`

