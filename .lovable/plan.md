Implement the requested winner-only KYC protection with no unrelated changes.

Files to change:
- `src/utils/mission.functions.ts` because this project currently contains the KYC server functions there; there is no `src/utils/kyc.functions.ts` file.
- `src/routes/_authed/kyc.tsx`

Planned changes:
1. Add a winner check at the start of `submitKycIdentity()`
   - After loading `supabaseAdmin`, before building the KYC payload, query `winam_winners` for the current `playerId`.
   - If the query errors or no winner row exists, throw:
     `KYC submission is only available to draw winners.`

2. Add the same winner check at the start of `submitKycBankDetails()`
   - Run it before updating bank details.
   - Use the same error message.

3. Add route guard in `src/routes/_authed/kyc.tsx`
   - Import and call existing `getMyWinnerStatus()` from `mission.functions.ts`.
   - On page load, if there is no session or `getMyWinnerStatus()` returns `won: false`, navigate immediately to `/app`.
   - Only load/display KYC data after winner status is confirmed, so non-winners do not see the claim form.

4. Verify
   - Run the build after changes.

Note: I will keep the changes limited to these two existing files because the requested `src/utils/kyc.functions.ts` does not exist in this codebase.