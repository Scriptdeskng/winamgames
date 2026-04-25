Plan to apply the payment tracking restructure with no database changes.

Scope
- Update only these files:
  - `src/utils/mission.functions.ts`
  - `src/utils/admin.functions.ts`
  - `src/routes/admin.players.$playerId.tsx`
  - `src/routes/admin.winners.tsx`
  - `src/routes/_authed/profile.tsx`
- No SQL, migrations, game logic, or KYC form changes.

Implementation
1. Player-facing KYC and winner status
   - Remove `payment_processed` from all `winam_kyc` selects in `mission.functions.ts`.
   - In `getMyWinnerStatus`, fetch the matching `winam_payments` row by `winner_id` after the winner row is found.
   - Return `kyc.paymentProcessed` based on `payment?.status === 'paid'`, not KYC fields.
   - Keep `getKycStatus` focused on identity/bank/verification fields only.

2. Admin payment server functions
   - Remove the old `markKycPaid` server function that updates deleted KYC columns.
   - Add:
     - `createPaymentRecord`
     - `markPaymentPaid`
     - `getPaymentsForPlayer`
   - Audit actions as requested: `payment_create` and `payment_mark_paid`.
   - Update `getWinners` so each winner includes `payment: { id, status, paid_at } | null` from `winam_payments`.

3. Admin player detail page
   - Replace the KYC card’s payment fields and old “Mark paid” action.
   - KYC section will show identity submission, bank/masked account, verified status/date/admin ID, and a hidden-when-verified “Verify KYC” button.
   - Add a separate “Payment history” section below KYC.
   - Load payments with `getPaymentsForPlayer` on mount/refresh.
   - Show a table: Prize, Amount, Status, Date, Action.
   - Show “Mark paid” only for pending payment rows, confirm via modal, then call `markPaymentPaid` for that payment ID.
   - Empty state: “No payment records yet”.

4. Admin winners page
   - Replace `markKycPaid` usage with `createPaymentRecord` and `markPaymentPaid`.
   - For cash winners:
     - If `winner.payment.status === 'pending'`, mark that payment as paid.
     - If no payment exists, create a pending record, then mark it paid.
     - Hide the paid action when `winner.payment.status === 'paid'`.
   - Remove “Paid” from KYC status and display payment status separately beside the KYC pill for cash winners.

5. Profile page verification card
   - Remove all `payment_processed` references.
   - Use simplified labels:
     - Identity submitted, no bank: “Identity verified — bank details needed”
     - Identity and bank submitted, not verified: “Identity verified”
     - Verified: “✓ Verified”
   - Show no payment status on profile.

Validation
- Run the project build/typecheck after changes.
- Fix any TypeScript errors caused by the changed payment types or removed KYC payment fields.