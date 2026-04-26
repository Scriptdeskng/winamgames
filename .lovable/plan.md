Update `src/routes/_authed/app.tsx` only for the weekly draw countdown card.

Changes:
- Update the `DrawHeroCard` shared `cardChrome` class so the card keeps its current dark-mode gradient, but uses `bg-accent` in light mode.
- For muted/secondary text inside `DrawHeroCard`, add light-mode foreground overrides so labels and small text render white on the green background.
- For the progress track and small chip-like surface inside the card, add light-mode background overrides so they remain visible on the green card.

Scope constraints:
- No admin changes.
- No dark-mode behavior changes.
- No unrelated component changes.
- No game logic or server changes.