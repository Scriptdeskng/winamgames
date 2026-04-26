I’ll make a focused fix for the prize badge behavior on the My Tickets page.

Changes:
- Update `src/routes/_authed/entries.tsx` only.
- In `WinnerBadge`, compute whether the prize is still claimable from existing winner status data:
  - unclaimed cash prize: keep the current `<Link>` to `/kyc`
  - claimed/submitted cash prize: render the same-looking badge as read-only text, not a link
  - paid cash prize: render read-only text, optionally with a “Paid” label if the current data exposes that state
  - airtime remains read-only as it is today
- Use the existing `winnerStatus.kyc` fields already loaded by `getMyWinnerStatus`:
  - `identitySubmitted`
  - `bankSubmitted`
  - `paymentProcessed`

Technical details:
- The current badge treats completed KYC as “Claimed” but still wraps it in a `<Link>`, so tapping it re-enters the claim flow.
- I’ll change the render branch so only incomplete KYC states are wrapped in `<Link>`.
- No database changes, no server function changes, no other files.
- Run the build after the change to verify the route still compiles.