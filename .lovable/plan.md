

## Landing page copy + Recent Wins polish

Targeted edits to `src/routes/index.tsx` only.

### 1. Hero — remove the games subline

Delete the paragraph: *"CheckMate sharpens your strategy. WisdomDrop tests the proverbs your elders raised you on."* (lines 140–145). The hero keeps the eyebrow, headline, prize pill, and CTAs — tightens the section without losing intent.

### 2. Copy: stop hard-coding "78 winners"

Replace anywhere that says "78 winners every Sunday" or "Cash and airtime drop into 78 winners every week" with the softer "50+ winners every week" framing the user already approved for the Winners section.

- **How it works → step 3 body** (line 447): change to *"Cash and airtime drop to 50+ winners every Sunday. More tickets = better odds."*
- **Social proof strip** (line 579): change pill from `"78 winners every Sunday"` to `"50+ winners every Sunday"`.
- **Winners footer line** (line 565): the current `"+ 75 airtime & data winners"` is also a hard number that contradicts the "50+" framing. Change to `"+ airtime &amp; data winners every week"` (keeps the visual proof of additional tiers without locking in a count).
- **Final CTA subhead** (line 622): keep "Join thousands of players competing every week" — no number change needed.
- **og:description** (line 28): replace "Two games. Endless wisdom." with "Endless wisdom. Sharper play." to drop the games-count phrasing from share previews too.

### 3. Recent Wins — make it feel alive, not static

Keep the same data and overall layout, but add motion + signal so it reads as a live feed:

- **Live indicator in the section header**: add a small pulsing emerald dot + label `"Updated weekly"` next to the "Recent draw" eyebrow. Pure CSS pulse using the existing `animate-landing-pulse-ring` / Tailwind `animate-pulse`.
- **Card chrome**:
  - Add a subtle ambient emerald glow behind the card (same blur technique as Hero/Final CTA).
  - Replace the static `Calendar` header strip with: `Calendar` icon + week label on the left, and a right-aligned animated `LIVE` chip (pulsing dot + uppercase label) so the card visibly "breathes."
- **Row entrance stagger**: wrap each of the 3 winner rows in `RevealOnScroll` with `delayMs={i * 120}` so they cascade in as the section scrolls into view (uses the existing component, no new deps).
- **Per-row micro-motion**:
  - Soft shimmer once on the prize amount (CSS keyframe gradient sweep) when the row reveals — draws the eye to the amount.
  - Trophy/sparkle accent next to the 1st-place row's prize (`Sparkles` icon, already imported) to add hierarchy.
- **Footer line**: replace the static `"+ 75 airtime & data winners"` with the live-feed-style line above (`"+ airtime & data winners every week"`) and add an arrow link styled as muted text *"See full winners list →"* that scrolls/links to `/subscribe` (the in-app winners page is auth-only, so the public CTA stays subscribe — keeps it actionable rather than dead-end).
- **Optional polish**: cycle a barely-visible "ticker" hint above the card — `"Last drawn: Sunday, Apr 13"` in muted micro text — reinforcing recency without adding a JS clock.

All animations: pure CSS + the existing `RevealOnScroll`. No new keyframes required beyond a one-off `@keyframes landing-shimmer` added to `src/styles.css` under `@layer utilities` for the prize sweep.

### 4. Games section — drop the "Two games" framing and the inline previews

- **Eyebrow** (line 299): change `"Two games"` → `"The games"` (or remove the eyebrow entirely if cleaner — going with `"The games"` to keep the header structure consistent with other sections).
- **Headline + subhead** (lines 302–307): keep as-is — both are about how the games feel, not how many exist.
- **Remove the chess board UI** inside `CheckMatePreviewCard` (lines 346–372).
- **Remove the proverb card UI** inside `WisdomDropPreviewCard` (lines 391–422).
- Each card keeps: name header + badge (top), description paragraph (bottom). Tighten the card's vertical padding now that the visual is gone so cards don't feel half-empty. No layout change to the two-column grid — the side-by-side cards still work, just text-forward.

### Files touched

- `src/routes/index.tsx` — all copy + structural changes above.
- `src/styles.css` — add `@keyframes landing-shimmer` (and matching `.animate-landing-shimmer` utility) for the prize-amount sweep on Recent Wins rows.

### Out of scope

- Wiring Recent Wins to real DB data (still mock — same numbers as before, just presented with motion).
- Changing the in-app `/_authed/winners.tsx` page.
- Touching `/subscribe` flow or auth.

