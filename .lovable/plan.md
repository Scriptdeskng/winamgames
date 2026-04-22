

## Public landing page at `/`, app moves to `/app`

Build a standalone marketing landing page that lives at `/`, while the authenticated app entry point moves to `/app`. The page is mobile-first, leans on the existing Refined Arena tokens (emerald, surface-1/2/3, glass, shadow-glow, tabular-nums, Inter), and reads as a marketing page rather than the app shell.

### 1. Routing changes

The current home (authenticated dashboard) lives at `src/routes/_authed/index.tsx` and resolves to `/`. Move it so the public landing can take `/`:

- **Rename** `src/routes/_authed/index.tsx` → `src/routes/_authed/app.tsx` (resolves to `/app`, still inside the `_authed` layout — same auth + subscription guard).
- **Create** `src/routes/index.tsx` — the new public landing page (no auth gate, no `_authed` parent).
- **Update all `to: "/"` references** that were pointing at the authed dashboard to `to: "/app"`:
  - `src/routes/login.tsx` (post-login redirect + session-exists redirect)
  - `src/routes/onboarding.tsx` (post-onboarding redirect)
  - `src/routes/renew.tsx` (post-renew redirect + logo home link → keep on `/` for landing)
  - `src/routes/verify.tsx` (logo home link → keep on `/`)
  - `src/components/games/useGameSession.ts` (game close fallback → `/app`)
  - `src/routes/_authed/profile.tsx`, `results.tsx`, `winners.tsx`, `entries.tsx`, `leaderboard.tsx`, `checkmate.tsx`, `wisdomdrop.tsx` (`backTo="/"` and "Play Now" links → `/app`)
  - `src/components/layout/TopBar.tsx` (logo/profile link semantics — keep app-internal links pointing to `/app`)
- **`__root.tsx`** 404 "Go home" stays pointing at `/` (the landing) — that's correct.
- The `_authed` guard already redirects unauthenticated visitors to `/login`, so it doesn't fight the public `/` route.

### 2. Landing page structure (`src/routes/index.tsx`)

Single file, all sections inline. Sets its own `head()` with marketing-focused title, description, og:title/description, og:image (= `/winam-logo.png`).

**Sticky nav** — translucent `bg-background/70 backdrop-blur` with `border-b border-border` once scrolled (toggle via `useEffect` scroll listener). WinAm logo left, single "Play now" button right (links to `/subscribe`, see below).

**Section 1 — Hero** (`min-h-[100dvh]` on mobile, `min-h-[80vh]` on desktop):
- Headline leads with the *experience*: e.g. "Africa's smartest puzzle arena." (sub-line: "Two games. Endless wisdom. Every Sunday someone wins.")
- One-line subheadline naming both games and their cultural identity: "CheckMate sharpens your strategy. WisdomDrop tests the proverbs your elders raised you on."
- Hero visual built purely from CSS + SVG: a side-by-side composition (stacked on mobile, overlapping cards on desktop) showing
  - a 4×4 chess board fragment with Unicode pieces mid-puzzle (white queen threatening mate), styled with the same emerald/surface palette as `ChessBoard.tsx`
  - a proverb card with `"A patient ___ eats ripe fruit."` and four answer chips, one highlighted in emerald
  - subtle motion via `@keyframes` (gentle float / pulse on the highlighted square + chip), no JS libraries
- Prize callout as a small pill *below* the headline, not above: "₦50,000 in prizes drawn every Sunday."
- Primary CTA: full-width on mobile "Start playing" → `/subscribe`. Secondary text-only "See past winners" scrolls to Section 4.

**Section 2 — Games showcase** (two cards, stacked on mobile, side-by-side on desktop):
- **CheckMate card**: 6×6 simplified board with real Unicode pieces in a tactical position, "CheckMate" name, copy: "One move. One mate. Train your tactical eye with bite-sized puzzles." Position badge: "1-move mates · daily puzzles".
- **WisdomDrop card**: a proverb sentence with a blank and four real-looking option buttons (one styled as the correct answer with a check), "WisdomDrop" name, copy: "Fill the blank in proverbs from across Africa. Every right answer earns you a draw ticket." Origin badge: "Yoruba · Hausa · Igbo · Akan + more".
- Both cards use `bg-surface-1`, `border-border`, `shadow-card`, with a hover lift on desktop (`hover:-translate-y-1 transition-transform`).

**Section 3 — How it works** (3 numbered steps in a horizontal flow on desktop, vertical on mobile):
1. **Subscribe via MTN** — "Join with your MTN number in seconds. No app store. No password."
2. **Play daily** — "Solve puzzles to earn draw tickets. The more you play, the more chances you stack."
3. **Win every Sunday** — "Cash and airtime drop into 78 winners every week. More tickets = better odds."
Each step has a numbered emerald ring, lucide icon (`Smartphone`, `Gamepad2`, `Trophy`), and short copy. **No prices anywhere.**

**Section 4 — Winners** ("Real people. Real wins."):
- Reuses the exact visual language of `_authed/winners.tsx` cash-winner rows for credibility:
  - Three rows with `POSITION_STYLES` 1st/2nd/3rd badges (gold / silver / bronze)
  - `080*****31` masked phone, `#3F8A2C1D` entry hash with `Hash` icon, `₦35,000 / ₦10,000 / ₦5,000` prize on the right
  - Below: static line "+ 75 airtime & data winners" (muted, non-tappable)
  - Header: "Week of Apr 7 – 13, 2025" with `Calendar` icon
- Wrapped in the same `rounded-2xl bg-surface-1 border border-border` container as the in-app winners card so it reads as authentic data.

**Section 5 — Social proof strip** (horizontal scroll on mobile, centered row on desktop):
- 4 fact pills (`rounded-full bg-surface-2 border border-border px-4 py-2 text-sm`) with lucide icons:
  - "500+ players this week" (`Users`)
  - "78 winners every Sunday" (`Trophy`)
  - "₦50,000 in weekly prizes" (`Coins`)
  - "2 games. Infinite challenge." (`Sparkles`)
- On mobile: `overflow-x-auto snap-x` so they scroll horizontally; on desktop: centered flex wrap.

**Section 6 — Final CTA**:
- Centered. Headline "Ready to play?", subheadline "Join thousands of players competing every week."
- Same "Start playing" CTA → `/subscribe`.
- Fine-print muted line: "Available on MTN Nigeria. Standard data rates apply."
- Tiny footer below: WinAm logo + © year.

### 3. `/subscribe` alias

The hero CTA spec says it links to "the subscribe flow." Today the subscribe entry point is `/login` (which leads to OTP → onboarding → app). To match the requested URL:

- Add `src/routes/subscribe.tsx` as a **redirect shim**: a route whose `beforeLoad` calls `throw redirect({ to: "/login" })`. This keeps `/subscribe` as the canonical marketing destination without forking the auth flow.

### 4. Animation strategy (no JS libraries)

- A small reusable `RevealOnScroll` wrapper component using `IntersectionObserver` (vanilla browser API, no external deps) that toggles a `data-visible` attribute. Tailwind handles the rest via `data-[visible=true]:opacity-100 data-[visible=true]:translate-y-0 opacity-0 translate-y-4 transition-all duration-500`.
- Hero piece float / chip pulse: pure CSS `@keyframes` added in `src/styles.css` under `@layer utilities`.
- Sticky nav background fade: single `useState` + `scroll` listener, no library.

### 5. Performance & compatibility

- Zero external image assets in landing. Only the existing `winam-logo.png` (already in `public/`).
- Inter font is already preloaded in `__root.tsx`.
- All visuals are CSS / Unicode chess glyphs / inline SVG.
- No new dependencies.
- Uses TanStack Start SSR — landing renders server-side for crawlers. Since the landing route is **outside** `_authed`, it has no client-only auth check blocking SSR.

### 6. SEO

`/` route's `head()`:
- title: "WinAm Games — Africa's smartest puzzle arena"
- description: "Play CheckMate and WisdomDrop. Sharpen your mind on chess tactics and African proverbs. Win cash every Sunday. Available on MTN Nigeria."
- og:title / og:description mirrored
- og:image: `https://winamgames.lovable.app/winam-logo.png`
- twitter:card: `summary_large_image`

### Files touched

- **New**: `src/routes/index.tsx` (public landing), `src/routes/subscribe.tsx` (redirect shim), `src/components/landing/RevealOnScroll.tsx` (reveal-on-scroll wrapper)
- **Renamed**: `src/routes/_authed/index.tsx` → `src/routes/_authed/app.tsx`
- **Edited (link/redirect updates `/` → `/app`)**: `login.tsx`, `onboarding.tsx`, `renew.tsx`, `useGameSession.ts`, and the seven `_authed/*` pages plus `TopBar.tsx`
- **Edited**: `src/styles.css` (add a couple of `@keyframes` for hero motion)

### Out of scope

- Any pricing copy or subscription tier display on the landing.
- Animation libraries (Framer Motion is already used elsewhere; landing intentionally stays CSS-only per spec).
- Changing the auth/OTP flow itself — `/subscribe` just redirects to the existing `/login`.
- New brand artwork — uses the existing logo + on-brand CSS/SVG compositions.

