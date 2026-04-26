Update `src/styles.css` only, limited to the existing `html.light` block.

Changes:
- Set `--surface-1` back to `#f4f4f8`.
- Set `--muted` back to `#eaeaf2`.
- Keep `--muted-foreground` as `#444455`.
- Ensure the progress-bar unfilled track is the only token using `#c8c8d8`; since the progress component uses a secondary-style track if no dedicated token is wired, set `--secondary` to `#c8c8d8` in the light block if needed.
- Leave all components and dark-mode tokens unchanged.

Scope constraints:
- No component changes.
- No admin changes.
- No game logic or server changes.