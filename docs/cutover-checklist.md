# Cutover Checklist

Use this checklist before switching traffic fully to the Next.js + FastAPI stack.

## Code And Build

- [ ] `apps/web` builds successfully in Docker.
- [ ] `apps/api` builds successfully in Docker.
- [ ] `docker compose ps` shows `db`, `api`, and `web` healthy.
- [ ] Player-facing routes are live:
  - `/`
  - `/login`
  - `/verify`
  - `/onboarding`
  - `/subscribe`
  - `/renew`
  - `/app`
  - `/checkmate`
  - `/wisdomdrop`
  - `/results`
  - `/leaderboard`
  - `/entries`
  - `/winners`
  - `/kyc`
  - `/profile`
- [ ] Admin routes are live:
  - `admin.winam.gg/admin/login`
  - `admin.winam.gg/admin`
  - `admin.winam.gg/admin/draw`
  - `admin.winam.gg/admin/players`
  - `admin.winam.gg/admin/players/[playerId]`
  - `admin.winam.gg/admin/winners`
  - `admin.winam.gg/admin/banners`
  - `admin.winam.gg/admin/missions`
  - `admin.winam.gg/admin/config`
  - `admin.winam.gg/admin/help`

## Data And Behavior

- [ ] Seed data loads from the legacy `src/data` puzzle files.
- [ ] Gameplay seed test passes.
- [ ] Intelli webhook smoke test passes.
- [ ] Admin draw lifecycle smoke test passes.
- [ ] Admin integration smoke test passes.
- [ ] Mission rewards show both `tickets` and `coins` in the UI.
- [ ] Draw lifecycle works:
  - lock
  - execute
  - publish
  - settle

## Production Readiness

- [ ] Production environment variables are confirmed.
- [ ] Intelli is set to live mode with `WINAM_INTELLI_MOCK=false` in production.
- [ ] Database migrations are applied.
- [ ] Seed/bootstrap process is documented and repeatable.
- [ ] Any external providers for SMS, payouts, or email are configured.
- [ ] Monitoring and logs are ready for the live environment.

## Final Sign-Off

- [ ] Visual QA on player routes is approved.
- [ ] Visual QA on admin routes is approved.
- [ ] No user-facing flow is missing compared with Lovable.
- [ ] No admin-operational flow is missing compared with Lovable.
