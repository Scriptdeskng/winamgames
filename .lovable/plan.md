

# Winners Page — Final Prize Structure & Implementation

## Prize Distribution (₦100,000 budget, 100 winners max)

**Cash Prizes (3 winners) — ₦50,000 total**
| Tier | Amount |
|------|--------|
| 1st | ₦35,000 |
| 2nd | ₦10,000 |
| 3rd | ₦5,000 |

**Airtime & Data (60 winners) — ₦50,000 total**
| Tier | Count | Amount | Subtotal |
|------|-------|--------|----------|
| ₦2,000 | 5 | ₦2,000 | ₦10,000 |
| ₦1,000 | 10 | ₦1,000 | ₦10,000 |
| ₦500 | 60 | ₦500 | ₦30,000 |

**Grand total: 78 winners, ₦100,000.**

## File: `src/routes/_authed/winners.tsx` — full rewrite

- Trust subtitle: "Every week, 78 players win real cash, airtime & data"
- Each winner shows: masked phone (`***XXXX`), entry ID (`#3F8A2C1D`), prize amount
- **Cash section**: 3 winners with gold/silver/bronze position badges, always visible
- **Airtime section**: Grouped by tier (₦2k → ₦1k → ₦500), uses `Collapsible` component, collapsed by default
- Date labels: "Apr 7 – 13, 2025" format
- Hardcoded sample data for 2 draw weeks
- Imports: `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` from UI, `ChevronDown` from lucide

