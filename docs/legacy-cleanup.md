# Legacy Cleanup Inventory

The new Next.js + FastAPI stack does not depend on the old root `src/` application surface anymore.

## Still Present In The Repo

- `src/routes/*`
- `src/components/*`
- `src/utils/*`
- `src/hooks/*`
- `src/integrations/supabase/*`
- `src/data/*`

## Status

- The new app uses `apps/web` for the frontend.
- The new backend uses `apps/api` for the API and game logic.
- The old `src/` tree is now legacy/reference material.

## Safe To Remove Later

- The old route tree and legacy helpers can be removed after a final archival decision.
- Keep `src/data` until the puzzle fixtures are formally migrated to a backend-owned fixture format.

## Notes

- I did not delete the legacy tree yet because it still serves as a reference during cutover.
- Once you’re comfortable, we can prune it in a separate cleanup pass.
