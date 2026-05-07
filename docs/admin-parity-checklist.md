# Admin Parity Checklist

This checklist tracks the Lovable admin surface against the new Next.js + FastAPI stack.

## Implemented Admin Routes

- `/admin/login` - Admin authentication
- `/admin` - Admin dashboard
- `/admin/draw` - Weekly draw lifecycle
- `/admin/players` - Player list
- `/admin/players/[playerId]` - Player detail
- `/admin/winners` - Winners review and payout actions
- `/admin/banners` - Banner management
- `/admin/missions` - Mission management
- `/admin/config` - Platform configuration
- `/admin/help` - Admin help and notes

## Admin Features Covered

- Admin session persistence and guard
- Dashboard stats and recent session visibility
- Player detail inspection
- Player flagging
- Player coin and XP adjustments
- Subscription extension and cancellation
- KYC review and verification
- Payment record creation and payout marking
- Draw lock, execute, publish, and settle operations
- Winner flagging and CSV export
- Banner create, toggle, and delete actions
- Mission create and toggle actions
- Platform config inspection and editing

## Validation Coverage

- Admin login works against FastAPI
- Admin dashboard, players, banners, missions, and draw data all resolve from the backend
- Draw lifecycle smoke test completes end to end on seeded data

## Intentionally Deferred

- Additional admin polish beyond the current functional pass
- Any future admin-only analytics or audit enhancements that are not already in the Lovable surface

## Notes

- The admin surface is now functional in the new stack.
- The current focus is stability and parity rather than redesign.
