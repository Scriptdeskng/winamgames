Update `src/styles.css` only, limited to the existing `html.light` block.

Changes:
- Add or update light-mode shadow tokens:
  - `--shadow-card: 0 1px 4px 0 rgba(0, 0, 0, 0.06);`
  - `--shadow-lg: 0 2px 8px 0 rgba(0, 0, 0, 0.08);`
- Add a dedicated draw card background token:
  - `--draw-card-bg: #B8DFC8;`
- If there is no dedicated draw-card token currently consumed by components, keep this token-only and set `--accent` to `#B8DFC8` in `html.light` as the fallback requested.

Scope constraints:
- No component changes.
- No dark-mode changes.
- No admin changes.
- No game logic or server changes.