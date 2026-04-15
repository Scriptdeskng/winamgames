
## Goal

Make the auth flow fully testable end-to-end as a prototype, with no dependency on real OTP delivery, payment processing, or third-party responses.

## What the actual issue is

- The failure is happening in `sendOtp`, before verification.
- `src/utils/auth.functions.ts` still tries to insert into `winam_otp_sessions`.
- Server logs show: `permission denied for table winam_otp_sessions`.
- The original schema migration revoked all table privileges on `winam_otp_sessions` for `anon` and `authenticated`.
- The later migration added RLS policies, but RLS does not restore table privileges. So inserts are still blocked.
- There is also a prototype mismatch: the app currently expects `000000` with 6 inputs, but the requested prototype OTP is `0000`.

## Do I know what the issue is?

Yes.

## Implementation plan

### 1. Make `sendOtp` prototype-safe
Update `src/utils/auth.functions.ts` so the prototype path does not:
- write to `winam_otp_sessions`
- check rate limits in `winam_otp_sessions`
- call any SMS provider

Instead, for prototype testing it should immediately return success with the masked phone number.

### 2. Hardcode the prototype OTP exactly as requested
Update `verifyOtp` in `src/utils/auth.functions.ts` to accept `0000` as the test OTP and bypass OTP lookup entirely.

To avoid breaking any in-progress testing, I can temporarily allow both `0000` and `000000`, but the UI will be standardized around `0000`.

### 3. Align the verify screen with the prototype OTP
Update `src/routes/verify.tsx` to:
- render 4 OTP boxes instead of 6
- validate 4 digits instead of 6
- show clear helper text that prototype testing uses `0000`

### 4. Keep the rest of the flow real
Do not bypass:
- player creation
- session persistence
- nickname onboarding
- subscription creation/gating

That keeps the prototype meaningful while removing only the external/blocked dependency.

### 5. Remove the need for broad OTP table access in preview
The current RLS workaround is not the right fix for a prototype-only OTP flow.

Because prototype OTP should not touch `winam_otp_sessions`, we no longer need to widen access on that table just to test login.

If later we want DB-backed OTP testing in preview, that would need a proper migration adding explicit table grants as well as policies. But for this prototype, the cleaner fix is to avoid the table entirely.

## Files to update

- `src/utils/auth.functions.ts`
  - short-circuit `sendOtp`
  - accept `0000` in `verifyOtp`
  - bypass OTP table reads/writes for prototype auth
- `src/routes/verify.tsx`
  - 4-digit OTP UI
  - updated validation and helper copy

## Technical note

The key reason the previous DB change did not solve it is this existing statement in the base migration:

```sql
REVOKE ALL ON public.winam_otp_sessions FROM authenticated, anon;
```

Policies were added afterward, but no matching `GRANT` restored base privileges. In Postgres, policies filter access; they do not grant it.

## Expected result

After implementation, the prototype flow will work like this:

```text
/login -> /verify -> enter 0000 -> session created -> /onboarding or / -> /renew if inactive
```

No real OTPs, SMS provider, PSP processing, or third-party responses will be required to test the app end-to-end.
