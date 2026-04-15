

# Fix OTP Error Messaging

## Problem
The login page has two error paths, but the `catch` block (line 41 in login.tsx) swallows the real error and shows a generic "Failed to send OTP. Try again." This hides useful messages like "Invalid Nigerian MSISDN format" from the user.

The `sendOtp` server function already skips the database entirely in prototype mode — no phone number needs to exist in the DB. Any valid Nigerian mobile number (starting with 07, 08, or 09) will work.

## Changes

### 1. `src/routes/login.tsx` — Show real error from catch
Replace the generic catch message with the actual error:
```typescript
} catch (err: any) {
  setError(err?.message || "Something went wrong. Try again.");
}
```

### 2. `src/utils/auth.functions.ts` — Friendlier validation error
Update `normalizeMsisdn` error messages to be user-friendly:
- "Invalid Nigerian MSISDN" → "Please enter a valid Nigerian mobile number"
- "Invalid Nigerian MSISDN format" → "Please enter a valid Nigerian mobile number (e.g. 0813 749 8991)"

### 3. Confirm: no DB dependency
`sendOtp` already returns success without touching any database table. Your number `08137498991` matches the pattern `0[789]\d{9}` and will work. If it's still failing, a hard page reload after the fix will clear the cached server module.

## Files changed
- `src/routes/login.tsx` — better error display in catch block
- `src/utils/auth.functions.ts` — user-friendly validation messages

