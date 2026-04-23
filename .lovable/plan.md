

## Add tooltips to admin config keys

Add a small `Info` icon next to each key name in `src/routes/admin.config.tsx` that shows an explanatory tooltip on hover. Pure CSS — no new library, no new files.

### Implementation

**1. Add `Info` to the existing lucide-react import** (already imports `AlertTriangle`, `Loader2`, `Save`, `Plus`).

**2. Add a `KEY_DESCRIPTIONS` constant** mapping each config key to its tooltip text. `base_N` keys resolve via a regex lookup (single shared description with the N substituted).

**3. Add a tiny `KeyLabel` component** in the same file — renders the key name plus an `Info` icon trigger using Tailwind's `group` + `group-hover` pattern:

```tsx
function KeyLabel({ name }: { name: string }) {
  const desc = getKeyDescription(name); // handles base_N regex
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-sm font-semibold">{name}</span>
      {desc && (
        <span className="group relative inline-flex">
          <Info className="h-3 w-3 cursor-help text-muted-foreground/70 hover:text-muted-foreground" />
          <span
            role="tooltip"
            className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 w-64 -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1.5 text-xs leading-snug text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
          >
            {desc}
          </span>
        </span>
      )}
    </span>
  );
}
```

- Tooltip is absolutely positioned below the icon, fades in on hover via `group-hover:opacity-100`.
- `pointer-events-none` so it never blocks the input.
- `z-50` ensures it floats above adjacent rows.
- `w-64` keeps width readable; `leading-snug` for compact multi-line text.
- Works on focus too via `peer`/`focus-within` if needed, but hover is sufficient per the request.

**4. Replace the existing key rendering inside `renderRow`**:

```tsx
<div className="min-w-0 pt-1">
  <KeyLabel name={row.key} />
  <p className="text-[10px] text-muted-foreground">
    {new Date(row.updated_at).toLocaleString()}
  </p>
</div>
```

(The `truncate` class is dropped on the inner span since the label now contains an icon; the parent `min-w-0` still constrains width and the column has `minmax(180px,220px)`.)

### Tooltip text source

Stored as a `Record<string, string>` constant exactly as provided in the request. The `base_N` lookup uses the regex `/^base_(\d+)$/` and substitutes N into the shared description: `"Base tickets awarded per {N} puzzles solved in a session"`.

### Files modified

- `src/routes/admin.config.tsx` — add `Info` import, add `KEY_DESCRIPTIONS` + `getKeyDescription`, add `KeyLabel` component, swap key rendering in `renderRow`.

No other files change. No new dependencies.

