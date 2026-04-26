Update `src/styles.css` only, limited to the existing `html.light` block.

Token changes:
- Set `--surface-1` to `#e0e0ec` for stronger pre-launch icon/preview contrast.
- Set `--muted` to `#d8d8e6` for more visible muted backgrounds.
- Set `--muted-foreground` to `#444455` for improved secondary/body text readability.
- Set the progress track token already present in the light block (`--progress-track`) to `#c8c8d8` so unfilled progress bars are more visible.
- If progress bars are using a shared surface/secondary token instead of `--progress-track`, keep the change token-only and adjust the relevant existing light-mode token in the same block to `#c8c8d8` without editing components.

Scope constraints:
- No component changes.
- No dark-mode changes.
- No admin changes.
- No game logic or server changes.