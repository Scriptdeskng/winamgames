# Local Development

## Start The Stack

```bash
make up
```

## Bootstrap Database

```bash
make bootstrap
```

## Reset Everything

```bash
make reset-db
```

## Run Smoke Tests

```bash
make admin-draw-smoke
```

## View Status

```bash
make ps
```

## Follow Logs

```bash
make logs
```

## Notes

- The `web` service serves the Next.js frontend on `http://localhost:3000`.
- The `api` service serves FastAPI on `http://localhost:8000`.
- The seeded admin account is `admin@winam.games` with password `Admin123!` unless overridden by env vars.
- Intelli auth/subscription integration runs in mock mode locally by default via `WINAM_INTELLI_MOCK=true`.
- Set `WINAM_INTELLI_MOCK=false` in production to use the live Intelli endpoints.
