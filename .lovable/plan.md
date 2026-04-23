

## Two updates: coin label + test account top-up

### 1. Coin balance label (both game screens)

**`src/routes/_authed/checkmate.tsx`** — update the coin balance span:

```tsx
<span className="text-xs font-semibold text-coin tabular-nums">
  Coins: {session.coinBalance}
</span>
```

**`src/routes/_authed/wisdomdrop.tsx`** — same change:

```tsx
<span className="text-xs font-semibold text-coin tabular-nums">
  Coins: {session.coinBalance}
</span>
```

The `Coins` icon stays in place; only the text content of the `<span>` changes from `{session.coinBalance} coins` to `Coins: {session.coinBalance}`.

### 2. Credit test account with 1000 coins

Run via the database insert/update tool:

```sql
UPDATE winam_players
SET coin_balance = 1000
WHERE id = '2f0531f4-75eb-43d7-8cdd-1d817b877344';
```

This is a data update (not a schema change), so it goes through the data tool, not a migration.

### Files touched

- `src/routes/_authed/checkmate.tsx` — coin label text
- `src/routes/_authed/wisdomdrop.tsx` — coin label text
- Database: one `UPDATE` on `winam_players`

No schema, logic, or component changes.

