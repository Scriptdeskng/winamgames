

## Comparison: Winam vs StaySharp Admin login

| Aspect | Winam (current) | StaySharp Admin | Verdict |
|---|---|---|---|
| Form container | Fields directly on page bg | Elevated card on darker bg | **StaySharp wins** — clearer focal point |
| Input primitive | Hand-rolled `<input>` h-14 with inline icon | shadcn `<Input>` + `<Label>` | **StaySharp wins** — consistent, accessible |
| Header | Big gradient brand + tagline | Compact title + sub-purpose | StaySharp is more restrained, but Winam's gradient brand has personality |
| Button | h-14, glow, arrow, marketing-loud | shadcn `<Button>`, brand block | StaySharp is calmer; Winam's glow CTA reads better on mobile |
| Secondary action | Footer disclaimer | Inline text button | **StaySharp wins** for /verify "Resend" placement |
| Auth model | Phone OTP (required for MTN VAS) | Email + password | Not comparable — keep Winam's OTP |

**Direction (per your selections):** Adopt StaySharp's **container discipline + shadcn primitives + restrained styling**, but keep Winam's emerald accents, mobile-first 430px frame, OTP flow, and a slightly punchier primary CTA so it still feels like a consumer game app, not a back-office.

## Design pattern (applied across all 4 screens)

- **Card container**: centered on the mobile frame, `rounded-2xl border border-border bg-surface-1` with a soft `shadow-card`. Replaces fields-on-bg.
- **Header inside card**: small icon chip (10x10) + compact title + one-line sub-purpose. Drop the giant gradient brand from /login — move "WinamGames" wordmark above the card as a small centered logo line.
- **Inputs**: swap raw `<input>` for shadcn `<Input>` + `<Label>` (h-11, rounded-xl, surface-1 bg, border-border). Phone field keeps the leading icon via input wrapper. OTP digits stay as the existing 4-slot row but tightened to match input radius.
- **Buttons**: shadcn `<Button size="lg">` for primary actions (h-12, rounded-xl, primary bg). Keep `shadow-glow` only on the primary submit so it still pops.
- **Secondary actions inline in card**: "Resend code" on /verify, "Back to profile" on /renew header (already there) — render as muted text button beneath the primary CTA.
- **Error state**: `text-destructive text-sm` directly under the relevant field/form, not floating.
- **Footer microcopy**: kept under the card (terms / billing line), centered, muted.

## Per-screen changes

**`/login`** (`src/routes/login.tsx`)
- Wrap form in card. Above card: small "WinamGames" wordmark with emerald gradient + tagline.
- Replace input with shadcn `<Input>` + `<Label htmlFor="phone">`. Keep the Phone icon as a left-pad adornment.
- Primary `<Button>` "Get OTP" with arrow.
- Disclaimer line stays below card.

**`/verify`** (`src/routes/verify.tsx`)
- Move back link to a top bar above the card (consistent with other pages).
- Card holds: icon chip + "Verify your number" + sub ("Enter 0000…"), 4 OTP slots, primary `<Button>` "Verify", and **inline "Resend code" text button** under it.

**`/onboarding`** (`src/routes/onboarding.tsx`)
- Same card pattern. Sparkles chip + "Choose your name" + sub.
- shadcn `<Input>` + `<Label>`, helper line ("3–16 chars, letters/numbers/_") in muted text under the field.
- Primary `<Button>` "Let's play" with arrow.

**`/renew`** (`src/routes/renew.tsx`)
- Keep the existing top back-button bar.
- Wrap header chip + sub-copy + the two plan cards inside a single outer card so the whole renewal block reads as one decision surface (matches StaySharp's "everything in one card" feel).
- Plan toggles, Subscribe `<Button>`, and billing footnote stay; just unify spacing and switch the bottom CTA to shadcn `<Button size="lg">` keeping the glow.

## What stays the same
- MSISDN OTP auth flow, server functions, routing, prototype 0000 bypass.
- Emerald color tokens, `shadow-glow` accent on primary CTAs, dark theme, max-w-430.
- Existing back-button styling on /verify and /renew.

## Files touched
- `src/routes/login.tsx`
- `src/routes/verify.tsx`
- `src/routes/onboarding.tsx`
- `src/routes/renew.tsx`

No new components, no new dependencies — `Input`, `Label`, `Button`, `Card` already exist in `src/components/ui/`.

