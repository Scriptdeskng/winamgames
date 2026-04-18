

## Restore vertical centering (with a small offset)

Two routes, one change each. Replace the current `pt-16` with a flex-centered wrapper that has a slight upward bias — true `items-center` on a tall mobile screen pushes content just below the visual midpoint (because the wordmark adds visual weight at the top), so a small `pb-20` on the centering container nudges the optical center up to feel balanced.

### Files
- **`src/routes/login.tsx`** — change the content wrapper from `flex-1 flex flex-col pt-16 px-5 pb-10` to `flex-1 flex flex-col items-center justify-center px-5 pb-20`.
- **`src/routes/verify.tsx`** — same change.

### Result
- Wordmark + hero + form + footer link sit as one block, vertically centered on the screen.
- Small `pb-20` (instead of `pb-10`) shifts the optical center up slightly so it feels centered to the eye, not bottom-heavy.
- All other spacing (`space-y-8`, `h-12` controls, OTP slot sizing, wordmark alignment via `max-w-sm mx-auto`) stays exactly as it is.

No new files, no logic changes, no other routes touched.

