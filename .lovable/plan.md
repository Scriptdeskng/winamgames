

# Winners Page — Redesign for Trust + Engagement

## Layout (top to bottom)

### 1. Hero / Ad Card (replaces prize pool breakdown)
Bold motivational card with emerald gradient accent:
- "Real people. Real wins." headline
- "78 winners every week — cash, airtime & data"
- CTA button: "Play Now" linking to `/checkmate`

### 2. Draw Weeks — Each week is ONE collapsible card
Each draw week becomes a single card with a collapsible trigger showing the date range and a summary line like "3 cash + 75 airtime winners". Collapsed by default (most recent open by default).

Inside each card when expanded:
- **Cash winners** (3 rows, always visible within the expanded card) with gold/silver/bronze badges
- **Airtime tiers** nested inside a second collapsible within the card, showing tier summary counts: "5x ₦2k, 10x ₦1k, 60x ₦500"
  - When expanded, winners grouped by tier in compact rows

This collapses ~80 rows per week into a single card header — far less intimidating.

### 3. Bottom CTA
"Keep playing, keep winning" with a Link button back to home or games.

## Visual de-cluttering ideas
- Each draw week is a single `Collapsible` card (date as trigger)
- Cash winners shown immediately on expand; airtime is a nested collapsible
- Compact airtime rows: 2-column grid for ₦500 tier (60 winners in 30 rows instead of 60)
- Summary counts on each collapsible trigger so users see scope without expanding

## File: `src/routes/_authed/winners.tsx` — full rewrite

- Remove the "Weekly Prize Pool" breakdown section
- Add hero card with CTA (`Link` to `/checkmate`)
- Wrap each `DrawWeek` in a single `Collapsible` card (first week open by default)
- Inside: cash winners visible, airtime in nested `Collapsible` with tier grouping
- ₦500 data tier uses 2-column grid layout
- Bottom CTA card: "Keep playing, keep winning" with Link to `/`
- Add `Link` import from `@tanstack/react-router`, add `Gamepad2` or `Play` icon from lucide

