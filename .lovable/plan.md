Update only the requested light-mode draw card styling and tokens.

Changes:
- In `src/routes/_authed/app.tsx`:
  - Remove the `isLightMode` state/effect and related hardcoded `bg-[#0A2518]`, `border-[#0A2518]`, and white text overrides from `DrawHeroCard`.
  - Restore the card wrapper to use the default gradient in both dark and light mode: `from-primary/15 via-primary/5 to-transparent`.
  - Keep text using the default semantic token classes (`text-foreground`, `text-muted-foreground`, `text-primary`).
  - Set the progress track to `bg-black/10` so it is visible on the light mint background.
  - Keep the progress fill as `bg-primary`.
- In `src/styles.css` within `html.light`:
  - Set `--accent` back to `#EEF5F0`.
  - Set `--draw-card-bg` back to `#EEF5F0`.

Scope constraints:
- No other component changes.
- No dark-mode changes.
- No admin changes.
- No game logic or server changes.