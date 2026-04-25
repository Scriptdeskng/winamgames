Plan to update `src/routes/admin.winners.tsx` only:

1. Add a distinct `Payment` table header next to the existing `KYC` header so the payment status pills have their own labeled column.
2. Split the current combined KYC/payment cell into separate cells:
   - `KYC` column keeps the existing KYC status pill for cash winners.
   - `Payment` column shows the payment status pill only when the winner is cash and `kyc.submitted_at` exists.
   - If KYC is missing or not started, the payment cell will render `—` instead of `Pending`.
3. Confirm the credit-card mark-paid action button includes `title="Mark paid"` for the native hover tooltip.
4. No other files, database changes, game logic, or KYC form changes.
5. Run the project build/typecheck after applying the code change.