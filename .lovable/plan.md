

## Replace text wordmark with WinAm logo

The brand currently appears as a text wordmark ("WinamGames" with `text-gradient-emerald`) in 5 spots. Swap those for the uploaded WinAm logo so the brand is consistent and on-brand.

### Asset

Add the uploaded image to the project as a bundled asset:
- `src/assets/winam-logo.png` — imported via ES module so Vite can hash and optimize it.
- Also copy to `public/winam-logo.png` for use in `og:image` / social previews and as the favicon source.

### Component changes

**1. `src/components/layout/TopBar.tsx` — home header**
- Replace the centered text `"WinamGames"` with `<img src={logo} alt="WinAm" className="h-7 w-auto" />`.
- Sub-page state still shows the page `title` text (unchanged).

**2. `src/routes/login.tsx`, `src/routes/verify.tsx`, `src/routes/onboarding.tsx`, `src/routes/renew.tsx` — top-left brand link**
- Replace the `<Link>` containing `"WinamGames"` text with the same `<img>` wordmark, sized `h-8 w-auto`. Keep it inside the link (so tapping returns to `/`).

**3. Favicon / social image**
- Update `src/routes/__root.tsx`:
  - Add `{ rel: "icon", href: "/winam-logo.png" }` to a `links: []` head entry (TanStack Start supports `head: () => ({ meta, links })`).
  - Replace the current `og:image` and `twitter:image` URLs (currently a Lovable preview screenshot) with `https://winamgames.lovable.app/winam-logo.png` so social cards show the logo.
  - Bump `twitter:card` from `summary` to `summary_large_image` so the logo gets a bigger preview tile.

### Out of scope

- Resizing/reworking the logo art itself (it's already a transparent PNG — fine on the dark background).
- Replacing decorative `text-gradient-emerald` headings inside game pages (e.g. WisdomDrop's "WisdomDrop" h1, the 404 hero) — those are page titles, not the brand wordmark.
- New splash/loading screens.

### Files touched

- New: `src/assets/winam-logo.png`, `public/winam-logo.png` (copied from upload)
- Edited: `src/components/layout/TopBar.tsx`, `src/routes/login.tsx`, `src/routes/verify.tsx`, `src/routes/onboarding.tsx`, `src/routes/renew.tsx`, `src/routes/__root.tsx`

