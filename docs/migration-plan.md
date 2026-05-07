# WinamGames Migration Plan

This repository is being migrated from the current Lovable/TanStack frontend into a Next.js frontend plus a FastAPI backend, with Docker-based local and production parity.

The migration is intentionally phased so we do not lose user flow, prize logic, admin controls, or the current visual identity.

## Phase 1: Foundation

- Freeze the route inventory and product flows.
- Stand up the new monorepo structure:
  - `apps/web` for Next.js
  - `apps/api` for FastAPI
  - root `docker-compose.yml` for local orchestration
- Define shared domain boundaries:
  - auth
  - player profile
  - game sessions
  - draw engine
  - missions
  - winners and claims
  - KYC
  - admin/config
- Keep the current frontend intact until parity is ready.

## Phase 2: API and Data

- Implement the FastAPI service layer.
- Add Postgres models and migrations that mirror the existing schema.
- Move draw execution, session close, mission awarding, and prize claim logic out of the frontend.

## Phase 3: Web Rebuild

- Recreate the current screens in Next.js.
- Preserve the existing layout language, spacing, and mobile behavior.
- Connect each route to the new API contracts.

## Phase 4: Containerization and Cutover

- Wire the full stack into Docker.
- Add worker and scheduler services.
- Run parity checks against the current product before cutover.

## Non-Negotiables

- Do not remove or simplify any user flow without sign-off.
- Do not change draw timing, payout logic, or KYC state transitions without explicit approval.
- Do not compromise the current page structure or visual intent while rebuilding.

