

## Fix admin config: scroll + compact grouped layout

### 1. Enable scrolling on admin pages

**Modify `src/routes/admin.tsx`:**
- Import and call `useAllowScroll()` from `@/hooks/useAllowScroll` (existing hook that adds `allow-scroll` class to `<html>`, which `src/styles.css` already styles to override the locked-height defaults).
- This unlocks vertical scrolling for all admin routes — fixes the cut-off content on Config (and any future long pages).

### 2. Redesign `src/routes/admin.config.tsx` as a compact grouped table

Replace the current card-per-row layout with a dense, grouped row layout.

**Key grouping (defined as a constant in the file):**
```
Economy:  base_1, base_2, base_3, base_4, base_5, hint_penalty, weekly_cap
Pricing:  plan_daily_price, plan_weekly_price, plan_daily_sku, plan_weekly_sku
Draw:     prize_cash_tiers, prize_airtime_tiers, winners_published_week_id
Game:     puzzle_weight_checkmate, puzzle_weight_wisdomdrop, free_session_mode
Other:    (catch-all for any keys not in the above lists)
```
The `base_*` set is built dynamically from the returned rows so new tiers are picked up automatically.

**Layout:**
- Warning banner stays at top (unchanged).
- Each group rendered as a section with a subtle header: small uppercase label + thin `border-b border-border/50` divider, no card wrapper. Groups stacked with `space-y-6`.
- Within a group, rows use a compact 3-column grid: `grid-cols-[minmax(180px,220px)_1fr_auto] gap-3 items-start`, separated by `border-b border-border/30`, `py-2`.
  - **Col 1 — Key**: monospace, `text-sm font-semibold`, with `updated_at` shown beneath in `text-[10px] text-muted-foreground` (compact, no extra spacing).
  - **Col 2 — Value editor**:
    - Integer keys: `<input type="number">`, `h-8`, `w-[120px]`, right-aligned tabular-nums.
    - String keys (heuristic: value is a JSON-encoded string with no newlines and length ≤ 80, e.g. SKUs and `winners_published_week_id` when set): single-line `<input>` width `w-full max-w-md`, value shown unquoted, saved as JSON string.
    - JSON keys (objects/arrays/multi-line): `<textarea>` `rows={2}` by default, expands to `rows={Math.min(12, lines)}` on focus via `onFocus`/`onBlur` state. Monospace, `text-xs`.
  - **Col 3 — Save**: small `h-8` button, only enabled when the draft differs from the saved value (dirty check via `JSON.stringify`); shows `Saving…` while busy.
- Inline error text under any field with a validation issue (red).

**"Add new key" form (bottom):**
- Single inline row, dashed border, compact: key input | value input | Add button. Same styling as current but tightened to one line on `lg`.

**Behavior preserved:**
- All server calls (`getPlatformConfig`, `updatePlatformConfig`) and validation logic unchanged.
- Refresh after save unchanged.
- Integer key detection (`INTEGER_KEYS` + `base_\d+` regex) unchanged.
- New: detect string-valued JSON keys to render as plain text input for nicer UX (still validated/saved as JSON).

### Files

**Modified (2):**
- `src/routes/admin.tsx` — add `useAllowScroll()` call.
- `src/routes/admin.config.tsx` — full layout rewrite (logic preserved).

### Out of scope
- No changes to server functions, no schema changes, no other admin screens.

