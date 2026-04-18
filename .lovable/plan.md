

## Misalignment with StaySharp screenshots

What I shipped doesn't match. Two structural mistakes:

1. **Frame ≠ card**. StaySharp's mobile frame itself IS the elevated dark card (rounded, bordered, the whole 430-wide column). I instead nested a small inner card inside the frame — a "card within a page" look.
2. **Header pattern is different**. StaySharp uses a wordmark logo pinned top-left INSIDE the frame, then a large centered title (`Welcome back`) + subtitle, with generous vertical whitespace above. I used icon chips + small left-aligned headings, no top-pinned logo.

Plus several smaller gaps: phone field has no leading icon in StaySharp, OTP is a segmented connected group (shadcn `InputOTP`), back is a centered "← Back" text link, resend is a countdown timer, and there's a secondary "Don't have an account? Subscribe" link under the primary CTA.

## Redo direction — match the screenshots

### Shared frame (applies to all 4 auth screens)
Replace the current `min-h-screen max-w-[430px]` plain background with an elevated rounded card frame, centered on the page with margin around it (so on desktop you see the same "phone-shaped card on dark bg" the screenshots show). Inside:

```
┌──────────────────────────────┐
│ WinamGames (logo, top-left)  │  ← wordmark, small emerald gradient
│                              │
│         (whitespace)         │
│                              │
│       Welcome back           │  ← text-3xl bold, centered
│   Enter your number to       │  ← muted, centered
│   access your account        │
│                              │
│   Phone number               │  ← small muted label, left-aligned
│   ┌────────────────────┐     │
│   │ 0801 234 5678      │     │  ← bare input, no icon, h-12, rounded-xl
│   └────────────────────┘     │
│   ┌────────────────────┐     │
│   │ Send code  →       │     │  ← primary button, h-12, full-width
│   └────────────────────┘     │
│                              │
│  Don't have an account?      │  ← muted + emerald link
│         Subscribe            │
└──────────────────────────────┘
```

Frame styles:
- Outer page: `min-h-screen bg-background flex items-center justify-center p-4`
- Frame: `w-full max-w-[430px] min-h-[680px] rounded-3xl border border-border bg-surface-1 shadow-card p-6 flex flex-col`
- Logo: top-left, `text-lg font-bold text-gradient-emerald`
- Title block: `mt-auto` block to push centered content down, then content, then `mt-auto` spacer below — gives the vertical balance from the screenshots

### `/login` (login.tsx)
- Frame as above. Logo top-left.
- Centered hero: "Welcome back" (text-3xl bold) + "Enter your number to access your account" (muted).
- Phone field: shadcn `<Label>` "Phone number" + bare `<Input>` (h-12, rounded-xl, surface-2, NO leading icon). Placeholder `08012345678`.
- Primary `<Button size="lg">` "Send code →" (h-12, full-width, shadow-glow kept for our brand punch).
- Below: muted text "Don't have an account?" + emerald `<Link to="/renew">Subscribe</Link>` inline.
- Drop the "By continuing… MTN" disclaimer from this card; keep it OUTSIDE the frame as tiny muted text under the frame, OR drop it (StaySharp doesn't show one). Default: keep it outside frame, very small.

### `/verify` (verify.tsx)
- Same frame + top-left logo.
- Centered "← Back" as a TEXT link (not the icon button in a top bar) above the title — `<Link to="/login">← Back</Link>` muted.
- "Enter your code" (text-3xl bold, centered) + "We sent a code to ···{last4}" (muted) — derive last4 from the msisdn search param so it actually shows the user's number like the screenshot.
- Replace the 4 hand-rolled inputs with the shadcn **`InputOTP`** primitive (already in the project) configured as 4 slots, segmented look.
- Primary `<Button>` "Verify →".
- Below: "Resend in {n}s" countdown (start at 25s, tick down each second). When countdown hits 0, swap to clickable "Resend code" button, then restart the 25s timer on click.
- Drop the icon chip + "Enter 0000 to continue" hint (the dev hint is fine, but rephrase as the StaySharp-style subline using the actual masked number; keep "0000" as the bypass logic, just don't shout it in the UI — or keep a tiny dev-mode hint below the OTP if useful).

### `/onboarding` (onboarding.tsx)
- Same frame. Logo top-left.
- Centered "Choose your name" + "This is how others will see you" subtitle.
- shadcn `<Label>` "Nickname" + bare `<Input>` (no Sparkles icon chip). Helper text under field stays.
- Primary `<Button>` "Let's play →".

### `/renew` (renew.tsx)
- Same frame. Logo top-left.
- Centered "Renew subscription" (text-3xl) + sub-copy.
- Plan toggle pills + Subscribe button inside the frame (no nested card).
- Top-left "← Back" text link to profile (matching verify pattern).

## Files to update
- `src/routes/login.tsx` — restructure to frame-as-card with top-left logo + centered hero + bare input + secondary link.
- `src/routes/verify.tsx` — same frame, swap OTP to shadcn `InputOTP`, add resend countdown timer, derive last4 from msisdn, "← Back" as text link.
- `src/routes/onboarding.tsx` — same frame, drop icon chip, large centered title.
- `src/routes/renew.tsx` — same frame, drop nested card, "← Back" text link.

## Reusable bit (optional but recommended)
Extract a small `<AuthFrame>` wrapper component at `src/components/auth/AuthFrame.tsx` that renders the card frame + top-left logo + the centered content slot, so all 4 routes stay consistent and we don't repeat the layout markup. Children render in the centered area; an optional `back` prop renders the "← Back" link above the title.

## What stays the same
- All auth logic, server functions, OTP bypass with `0000`, routing, MSISDN handling, emerald tokens, dark theme.
- shadcn `Input`/`Label`/`Button` primitives (just used differently — bare, no icon adornment, full-width).
- `shadow-glow` on primary CTAs (our brand difference vs StaySharp's flatter button).

