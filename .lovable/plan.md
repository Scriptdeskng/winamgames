

# Subscription Plans, Renew Screen, Test OTP & Expiry Logic

## What gets built

### 1. Hardcode test OTP `000000`
In `sendOtp` (`src/utils/auth.functions.ts`), after generating the random OTP and storing its hash, also store a hash of `"000000"` so that code always works. Simpler approach: override `otpCode` to always be `"000000"` in dev, or insert a second OTP row. Cleanest: in `verifyOtp`, add a check — if `code === "000000"`, skip OTP lookup and proceed directly. Mark with `// TODO: REMOVE before go-live`.

**Note:** The current `verifyOtp` validator requires exactly 6 digits (`z.string().length(6).regex(/^\d{6}$/)`), but user said "0000" (4 digits). Will use `"000000"` (6 zeros) to match the existing validator. If user truly wants 4 digits, the validator and UI (6 input boxes) would need changing — keeping 6 digits is simpler and consistent.

### 2. Seed `winam_platform_config` with plan data
Use the database insert tool to add 4 rows:
- `plan_daily_price` → `150`
- `plan_daily_sku` → `"daily"`
- `plan_weekly_price` → `300`
- `plan_weekly_sku` → `"weekly"`

### 3. Redesign `/renew` screen with two plan cards
Replace the single button with two plan cards:
- **Daily** — ₦150/day, "Access for today"
- **Weekly** — ₦300/week, "BEST VALUE" badge, shows ₦42.86/day savings
- Weekly card is visually recommended (emerald border/glow, badge)
- Both buttons are stubs (TODO: Forthsoft carrier billing integration)

### 4. Fix subscription expiry logic in `verifyOtp`
Replace the hardcoded 30-day `valid_until` with proper WAT-aware expiry:
- **Daily**: `valid_until` = end of current WAT day (23:59:59 WAT = today+1 00:00 UTC+1)
- **Weekly**: `valid_until` = `valid_from` + 7 days

Default new players to the daily plan (can upgrade on `/renew`).

### 5. Update `getSubscriptionStatus` to handle WAT expiry correctly
Already compares `valid_until` to `now` — no change needed, the fix is in how `valid_until` is set.

## Files changed

- `src/utils/auth.functions.ts` — test OTP bypass in `verifyOtp`, WAT-aware expiry in subscription insert
- `src/routes/renew.tsx` — full redesign with two plan cards
- Database insert: 4 rows into `winam_platform_config`

## Technical details

WAT expiry calculation for daily plan:
```typescript
const watOffset = 1; // WAT = UTC+1
const now = new Date();
const watDate = new Date(now.getTime() + watOffset * 60 * 60 * 1000);
const endOfDayWAT = new Date(Date.UTC(
  watDate.getUTCFullYear(), watDate.getUTCMonth(), watDate.getUTCDate(),
  23 - watOffset, 59, 59, 999
));
```

No database migrations needed — `subscription_plan` enum already has `daily` and `weekly` only.

