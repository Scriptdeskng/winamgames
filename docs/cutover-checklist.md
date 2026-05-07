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
  - `/admin/login`
  - `/admin`
  - `/admin/draw`
  - `/admin/players`
  - `/admin/players/[playerId]`
  - `/admin/winners`
  - `/admin/banners`
  - `/admin/missions`
  - `/admin/config`
  - `/admin/help`

## Data And Behavior

- [ ] Seed data loads from the legacy `src/data` puzzle files.
- [ ] Gameplay seed test passes.
- [ ] Admin draw lifecycle smoke test passes.
- [ ] Mission rewards show both `tickets` and `coins` in the UI.
- [ ] Draw lifecycle works:
  - lock
  - execute
  - publish
  - settle

## Production Readiness

- [ ] Production environment variables are confirmed.
- [ ] Database migrations are applied.
- [ ] Seed/bootstrap process is documented and repeatable.
- [ ] Any external providers for SMS, payouts, or email are configured.
- [ ] Monitoring and logs are ready for the live environment.

## Final Sign-Off

- [ ] Visual QA on player routes is approved.
- [ ] Visual QA on admin routes is approved.
- [ ] No user-facing flow is missing compared with Lovable.
- [ ] No admin-operational flow is missing compared with Lovable.

