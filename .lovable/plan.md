Update only the pre-launch preview styling for CheckMate and WisdomDrop plus the requested light-mode CSS hooks.

Changes:
- `src/routes/_authed/checkmate.tsx`
  - Replace the mini-board inline white RGBA square backgrounds with token/CSS-class based square classes so they can be themed.
  - Add stable classes for mini-board light squares, dark squares, and hint squares.
  - Replace external chess-piece image SVGs with text-based chess glyphs using `text-foreground`/`text-muted-foreground` so pieces render dark in light mode and light in dark mode.

- `src/styles.css`
  - Add `html.light` CSS overrides for the CheckMate preview square classes:
    - dark squares: `#A8C0A0`
    - light squares: `#E8F2EC`
  - Keep these overrides scoped to `html.light`.

- `src/routes/_authed/wisdomdrop.tsx`
  - Replace hardcoded `bg-white/[...]`, `border-white/[...]`, and low-opacity muted preview text with token-based classes.
  - Add `border border-border` and `bg-surface-2` to the example answer option buttons.
  - Keep the EXAMPLE label and proverb text using `text-muted-foreground`.

Scope constraints:
- No game logic changes.
- No admin changes.
- No unrelated component changes.
- No dark-mode token changes.