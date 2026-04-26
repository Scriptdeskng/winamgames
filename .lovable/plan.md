Update only the requested light-mode color values.

Changes:
- In `src/routes/_authed/app.tsx`, change the `DrawHeroCard` light-mode overrides from `#1DB954` to `#0A2518` for:
  - card background: `bg-[#0A2518]`
  - card border: `border-[#0A2518]`
- Keep existing white text and white progress bar overrides unchanged.
- In `src/styles.css` within `html.light`, change:
  - `--accent` to `#0A2518`
  - `--draw-card-bg` to `#0A2518`

Scope constraints:
- No other component changes.
- No dark-mode changes.
- No admin changes.