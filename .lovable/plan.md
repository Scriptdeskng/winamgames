Plan to apply the requested fixes with no unrelated changes:

1. Update `src/routes/_authed/kyc.tsx`
   - Change the first name / last name wrapper from `grid grid-cols-2 gap-3` to `flex flex-col gap-3` so both fields stack full width.
   - Wrap the Date of birth input area so its parent clips overflow with `overflow-hidden`.
   - Add `w-full box-border` to the Date of birth input class list, keeping the existing `field-input` styling.

2. Update `src/routes/_authed/app.tsx`
   - In `WinnerBanner`, return `null` immediately when `kyc.paymentProcessed === true`.
   - For the completed-but-unpaid claim state (`identitySubmitted && bankSubmitted && !paymentProcessed`):
     - Keep rendering the “Prize claim complete” message.
     - Make that state dismissible with an `X` button.
     - Persist dismissal in `localStorage` using `winner-claim-dismissed-${winnerId}`.
     - Hide the banner only after that specific completed-claim notice is dismissed.
   - Keep airtime dismissal behavior unchanged.

3. Validation
   - Review the two edited files for JSX/class syntax correctness.
   - Make no changes outside `src/routes/_authed/kyc.tsx` and `src/routes/_authed/app.tsx`.