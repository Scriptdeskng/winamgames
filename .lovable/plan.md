

## What the screenshot shows
The 4 OTP slots are **connected as one continuous segmented bar** — no gaps between them, sharing borders, with thin vertical dividers separating each digit cell. One unified rounded rectangle, not 4 separate squares.

## Fix
The shadcn `InputOTPSlot` primitive is already designed for exactly this — its defaults (`border-y border-r`, `first:border-l`, `first:rounded-l-md`, `last:rounded-r-md`) produce a connected group. My previous attempts broke it by adding `gap-2`/`gap-3` and overriding borders to all 4 sides.

To match StaySharp:
- **Remove the `gap-*` class** from `InputOTPGroup` so slots touch.
- **Stop overriding the border classes** — let the primitive's defaults do their job (shared borders, rounded only on first/last).
- Keep slot size generous (`w-14 h-14`), use `bg-surface-2` for the darker fill seen in the screenshot, `text-2xl font-semibold`, and bump the corner radius via `first:rounded-l-xl last:rounded-r-xl` to match the softer rounding.

## Single file change
**`src/routes/verify.tsx`** (~lines 99–110) — replace the `InputOTPGroup` + 4 `InputOTPSlot` block with:

```tsx
<InputOTP maxLength={4} value={otp} onChange={setOtp}>
  <InputOTPGroup>
    {[0, 1, 2, 3].map((i) => (
      <InputOTPSlot
        key={i}
        index={i}
        className="w-14 h-14 text-2xl font-semibold bg-surface-2 text-foreground border-border first:rounded-l-xl last:rounded-r-xl"
      />
    ))}
  </InputOTPGroup>
</InputOTP>
```

That's it. No primitive edits, no logic changes, no other files touched. The result: one connected segmented bar with thin internal dividers between each digit — exactly the StaySharp pattern.

