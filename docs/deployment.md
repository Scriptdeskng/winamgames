# Deployment Guide

This project deploys as two services:

- `web`: Next.js frontend
- `api`: FastAPI backend

The database is PostgreSQL. In production, use a managed Postgres instance or a persistent volume with backups.

The production Docker stack is defined in [docker-compose.prod.yml](/Users/olushola/Desktop/CODE11/winam/docker-compose.prod.yml) and expects a local [`.env.production`](/Users/olushola/Desktop/CODE11/winam/.env.production) file created from [`.env.production.example`](/Users/olushola/Desktop/CODE11/winam/.env.production.example).

Production host routing should be configured so:

- `winam.gg` serves the player web app
- `admin.winam.gg` serves the same web app for admin routes
- `api.winam.gg` serves the FastAPI backend
- Both web hosts should point to the same `web` container; only the host name differs.

CI automation lives in [.github/workflows/ci.yml](/Users/olushola/Desktop/CODE11/winam/.github/workflows/ci.yml) and runs the local verification flow on push and pull requests. A manual workflow dispatch can run the production compose verification flow as well.

## Required Environment Variables

Frontend and API:

- `NEXT_PUBLIC_API_BASE_URL` - public API base URL used by the browser
- `WINAM_FRONTEND_ORIGIN` - player-site origin used for CORS and browser session requests
- `WINAM_ADMIN_ORIGIN` - admin-site origin used for CORS and browser session requests
- `DATABASE_URL` - SQLAlchemy connection string for the backend
- `WINAM_SESSION_SECRET` - signing secret for player and admin session cookies
- `WINAM_COOKIE_SECURE` - set to `true` in production so cookies are only sent over HTTPS

Intelli:

- `WINAM_INTELLI_BASE_URL` - Intelli API base URL
- `WINAM_INTELLI_SERVICE_PATH_ID` - Intelli service id
- `WINAM_INTELLI_TELCO` - telco code, usually `MTN`
- `WINAM_INTELLI_MOCK` - set to `false` in production

Seed/bootstrap:

- `WINAM_SEED_ADMIN_EMAIL` - seeded admin login email
- `WINAM_SEED_ADMIN_PASSWORD` - seeded admin login password

## Deployment Order

1. Build the images.
   - `make build`
2. Start or confirm the database is reachable.
   - `make wait-db`
3. Apply migrations.
   - `make migrate`
4. Seed baseline data.
   - `make seed`
5. Run the verification suite.
   - `make verify`
6. Start the services.
   - `make up`

For production, use:

1. `cp .env.production.example .env.production`
2. Edit `.env.production` with real values.
3. `make prod-deploy`
4. If needed, follow with `make prod-ps` and `make prod-logs`

## Smoke Tests To Run Before Cutover

- `make intelli-webhook-smoke`
- `make admin-integration-smoke`
- `make admin-draw-smoke`

For production cutover, prefer:

- `make prod-deploy`
- `make prod-ps`
- `make prod-logs`

## Pre-Launch Checks

- Confirm `/` serves the landing page.
- Confirm `/login` and `/verify` work with Intelli.
- Confirm `/app` redirects unauthenticated users back to the landing page.
- Confirm `admin.winam.gg/admin/login` works with the seeded admin account.
- Confirm the draw lifecycle can lock, execute, publish, and settle.
- Confirm Intelli webhooks are persisted and visible in the admin timeline.

## Rollback

If a deployment needs to be rolled back:

1. Stop the new stack.
2. Restore the previous database snapshot if migrations have already been applied and cannot be kept.
3. Repoint the load balancer or traffic router back to the previous release.

Keep at least one tested backup before a production cutover.

## Production Docker Commands

- `make prod-build`
- `make prod-up`
- `make prod-down`
- `make prod-restart`
- `make prod-logs`
- `make prod-ps`
- `make prod-migrate`
- `make prod-seed`
- `make prod-bootstrap`
- `make prod-verify`
