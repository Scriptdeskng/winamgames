Update `src/styles.css` only, limited to the existing `html.light` token block.

Planned token changes:
- Change `--border` from `#e0e0ea` to `#c8c8d8`.
- Change `--sidebar-border` from `#e0e0ea` to `#c8c8d8` to keep light-mode border tokens consistent.
- Change `--muted-foreground` from `#6b6b80` to `#55556a`.
- Change `--surface-2` to `#e8e8f0` for stronger disabled/secondary surface contrast.
- Set `--input` to use the stronger light value as appropriate for input/button contrast.
- Add or update the relevant progress-track token in the `html.light` block to `#d8d8e4` if the stylesheet exposes that token there.

Scope constraints:
- No component changes.
- No dark-mode token changes.
- No admin-specific changes.
- No logic or server-function changes.