# Player Parity Checklist

This checklist maps the Lovable player-facing experience to the new Next.js + FastAPI stack.

## Implemented Player Routes

- `/` - Landing page
- `/login` - Player login
- `/verify` - Verification
- `/onboarding` - Onboarding
- `/subscribe` - Subscription flow
- `/renew` - Renewal flow
- `/app` - Player dashboard
- `/checkmate` - CheckMate gameplay
- `/wisdomdrop` - WisdomDrop gameplay
- `/results` - Round results
- `/leaderboard` - Weekly and daily leaderboard
- `/entries` - Ticket / entry ledger
- `/winners` - Winners archive
- `/kyc` - Prize claim and KYC flow
- `/profile` - Player profile

## Player Features Covered

- Authentication and session persistence
- Subscription / renewal entry points
- Dashboard summary cards
- Mission visibility and reward type display
- Gameplay session start, move, hint, and close flows
- Coin and ticket reward accounting
- Round result storage and replay
- Leaderboard browsing
- Entry history / ticket ledger
- Winner lookup and claim handoff
- KYC submission flow
- Profile editing and logout
- Lovable font stack and dark emerald visual language

## Data And Economy Coverage

- CheckMate and WisdomDrop puzzle content is seeded from the legacy `src/data` files
- Mission rewards support both tickets and coins
- Session close computes:
  - base entries
  - streak bonus
  - mission bonuses
  - coin rewards
  - XP
  - rank progression
- Winner and KYC state now come from FastAPI

## Intentionally Deferred

- Admin screens and admin parity work
- Any further user-side visual tweaks that only show up in browser QA

## Notes

- The user-facing app is now implemented on the new stack.
- The remaining work is mostly polish and admin reconstruction later.
