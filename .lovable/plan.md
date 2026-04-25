I’ll apply the requested fixes in the specified files, with the required `getKycStatus` addition.

1. Update `getKycStatus`
- In `src/utils/mission.functions.ts`, update the KYC select query to return:
  - `submitted_at`
  - `bank_details_submitted_at`
  - `bank_name`
  - `bank_code`
  - `account_number`
  - `account_name`
  - `first_name`
  - `last_name`
  - `dob`
  - `id_type`
  - `verified`
  - `payment_processed`
- Do not return `id_number`.

2. Redesign profile verification section
- In `src/routes/_authed/profile.tsx`, replace the current static verification section with a collapsible card.
- Render it only when `kyc.submitted_at` exists.
- Collapsed state will show:
  - Shield/verified icon
  - Full name
  - Bank summary as `bank_name ••••last4`, only when bank details exist
  - Verified badge only when `kyc.verified === true`
  - Chevron to expand
- Expanded state will show:
  - ID type as `NIN` or `BVN`
  - DOB formatted as `DD MMM YYYY`
  - Full bank name
  - Masked account number only
  - `Update bank details` link to `/kyc?step=2`
- Label logic will be:
  - Identity submitted, no bank details: `Identity verified — bank details needed` + link to `/kyc?step=2`
  - Both submitted, not admin-verified: `Identity verified`
  - Admin verified: `✓ Verified`
  - Payment processed: still `✓ Verified`
- No full NIN/BVN or full account number will be displayed.

3. Make bank details always editable
- In `src/routes/_authed/kyc.tsx`, keep identity locked after first submission.
- Ensure bank details remain editable whenever the bank form is shown, regardless of existing KYC or payment status.
- Leave `submitKycBankDetails` server update logic intact, aside from the `getKycStatus` select change above.

4. Add returning-winner confirmation screen
- In `src/routes/_authed/kyc.tsx`, when a player already has both identity and bank details submitted and visits `/kyc` without a forced `step=2`, skip both forms.
- Show a confirmation screen instead, without the progress header:
  - `Claim Prize` title
  - Prize confirmation copy
  - Paying-to summary using bank name, masked last 4, and full name
  - `Confirm claim →` button that re-submits existing bank values via `submitKycBankDetails`, then navigates to `/app`
  - `Update bank details` action that navigates to `?step=2`

5. Update winner banner CTA
- In `src/routes/_authed/app.tsx`, update the cash winner CTA so a returning winner with complete KYC navigates to `/kyc` without a `step` param, allowing the confirmation screen to appear.
- Keep other banner behavior unchanged.

Files to change:
- `src/utils/mission.functions.ts`
- `src/routes/_authed/profile.tsx`
- `src/routes/_authed/kyc.tsx`
- `src/routes/_authed/app.tsx`