

## Audit findings — /login and /verify at 390x844

Walked through both routes. Most of the layout is solid: `max-w-sm` keeps content on a single comfortable column, `h-12 rounded-xl` controls are consistent, the wordmark + centered hero pattern matches StaySharp. A few small refinements would tighten it; nothing structurally broken.

### Issues worth fixing

1. **Vertical centering pulls hero too high on tall mobile (844px)**
   `flex-1 items-center` plus the small content block leaves the wordmark very close to the title (~80px) while the bottom has lots of empty space. StaySharp anchors the hero a bit lower with more breathing room under the wordmark. Fix: replace `items-center` with `pt-16` (or `pt-20`) on the content wrapper so the hero sits in the upper-third with consistent top spacing across login/verify/onboarding/renew.

2. **Horizontal padding inconsistency: `px-5` (20px) on the page but `max-w-sm` (384px) inner block**
   At 390px viewport the inner block hits the outer `px-5` and effectively becomes ~350px wide. That's fine, but the wordmark uses the same `px-5` while the hero/inputs are constrained further by `max-w-sm` centering — visually the wordmark sits flush left at 20px while inputs start at ~23px. Tiny misalignment. Fix: wrap the wordmark in the same `max-w-sm` centered container so its left edge lines up with the input's left edge (matches StaySharp where the logo aligns to the form column).

3. **Login: `space-y-6` between hero / form / footer link is a bit tight**
   Hero → form gap reads as the same beat as label → input. Fix: bump outer block to `space-y-8` (hero ↔ form ↔ subscribe link) while keeping the form internals at `space-y-4`. Gives the hero room to breathe.

4. **Verify: "← Back" position fights the centered hero**
   Currently sits left-aligned above a centered title — feels detached. StaySharp puts back links subtly above the title with the same alignment. Fix: keep it left-aligned but tighten gap to the title (`mb-2` vs the current `space-y-6` gap) OR center it. Recommend: keep left-aligned (matches the wordmark column) and reduce vertical gap so it reads as a header, not a separate row.

5. **Verify: form `space-y-6` between OTP and Verify button is generous; between Verify and resend it's the same**
   Visual hierarchy would be clearer with tighter OTP↔button (closer pairing) and looser button↔resend. Fix: OTP → button `mt-6`, button → resend `mt-4` text with extra `pt-2`. Or simpler: keep `space-y-6` but wrap resend in a `pt-2` for a small extra beat.

6. **Login phone input is bare `<input>` while the rest of the app uses shadcn `<Input>`**
   Not a padding issue but a consistency one. Already noted earlier; safe to swap to `<Input>` from `@/components/ui/input` keeping the same `h-12 rounded-xl` classes.

### Non-issues (intentionally left alone)
- `max-w-sm` width — correct for mobile-first, scales fine on desktop.
- `h-12` control height — matches StaySharp.
- OTP slot sizing (`w-14 h-14`) — just landed and matches reference.
- Wordmark `text-lg` size — matches.
- Bottom `pb-10` — gives keyboard room on mobile.

## Proposed changes (2 files)

**`src/routes/login.tsx`**
- Wrap wordmark in same `max-w-sm mx-auto` column so it aligns with form left edge.
- Replace `items-center` with `pt-16` on the centered content wrapper.
- Bump outer content to `space-y-8` (hero / form / footer-link).
- Optional: swap bare `<input>` for shadcn `<Input>`.

**`src/routes/verify.tsx`**
- Same wordmark alignment fix.
- Same `pt-16` instead of `items-center`.
- Tighten "← Back" gap to title (move it inside the hero block with `mb-4` instead of being a `space-y-6` sibling).
- Add `pt-2` wrapper around the resend countdown/button so it visually separates from the Verify button.

No new components, no new dependencies, no logic changes. Pure layout/spacing refinement.

