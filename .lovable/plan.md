

## Scroll-when-content-fits issue on entries & winners

### The actual bug

You're right — I missed this. `useAllowScroll()` is a one-way toggle: it unconditionally sets `html { height: auto; overflow: visible }`. That means **even when content fits the viewport, the page is still scrollable** (rubber-band on iOS, scrollbar on desktop, accidental drag-to-refresh on Android). On a 1022px-tall viewport showing a short Entries page (~400px of content), the page shouldn't move at all.

Leaderboard is fine because its content genuinely overflows. Entries and Winners (when collapsed) often don't.

### Reference: Quiz Flash AI pattern

Let me check that project for the conditional-scroll pattern they used before finalizing.
<lov-tool-use id="toolu_vrtx_012GGKBkq5Fcz1wn96mERxGC" name="tool_search" data="{\"target\": \"cross_project--list_projects\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01QicJacSMX2RCUvYExPAs6N" name="cross_project--list_projects" integration-id="cross_project" data="">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_013sxRe5pf8C7ZnuvQMZxMc6" name="cross_project--search_project_files" integration-id="cross_project" data="{\"project_id\": \"59c40741-ab30-4ffc-a579-d7edf50dceff\", \"query\": \"allow-scroll\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_014bTKbJLo2UDk3eXYP6oiDA" name="cross_project--search_project_files" integration-id="cross_project" data="{\"project_id\": \"59c40741-ab30-4ffc-a579-d7edf50dceff\", \"query\": \"overflow\", \"include_patterns\": \"*.css\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01CDUf4kfGWNGoQTVVNzjikQ" name="tool_search" data="{\"target\": \"cross_project--search_project_files\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_019hbac8M6gprkhsnSaEDw1d" name="cross_project--search_project_files" integration-id="cross_project" data="{\"project\": \"59c40741-ab30-4ffc-a579-d7edf50dceff\", \"query\": \"allow-scroll\"}">
</lov-tool-use>
Same pattern as ours. Let me check our current styles.css to confirm the lock rule.
<lov-tool-use id="toolu_vrtx_01QnbB349ssNUNSE5VpwnKTR" name="code--view" integration-id="code" data="{\"file_path\": \"src/styles.css\", \"lines\": \"147-206\"}">
</lov-tool-use>
Now I see. The hook adds `allow-scroll` which makes `html`/`body` `height:auto` + `overflow:auto`. Even when content fits, it allows scroll — but what makes pages "scrollable when they shouldn't be"?

Looking at entries.tsx and winners.tsx: both use `min-h-screen` on the wrapper. With `allow-scroll`, body becomes `height:auto`, but the wrapper still has `min-h-screen` (= 100vh), which forces wrapper to fill viewport. Should be fine if content < viewport... unless TopBar adds height that pushes total over.

Actually the issue: Quiz Flash AI uses `overflow: visible !important` while ours uses `overflow-y: auto !important`. The `auto` value enables scrollbars/scrolling even when not needed in some browsers, and importantly creates a scroll container. The Quiz Flash version uses `visible` which only scrolls when content actually exceeds.

But functionally `overflow-y: auto` should NOT scroll if content fits. Let me check more carefully — `min-h-screen` = `min-height: 100vh`. With `html, body { height: auto }`, that's fine.

Wait — the actual issue might be: with our rule `html.allow-scroll, html.allow-scroll body { height: auto !important; overflow-y: auto !important }`, BOTH html and body become scroll containers. `min-h-screen` on wrapper means wrapper = 100vh minimum. If content is only 600px but wrapper is 100vh on body that's also `height:auto`... wrapper renders 100vh. Then page = 100vh. Still no overflow.

But on mobile, `100vh` includes browser chrome while actual viewport is smaller — so `min-h-screen` (100vh) > actual visible area → scroll appears even with no content overflow. This is the classic mobile vh bug.

The fix: Quiz Flash uses `overflow: visible !important` (not auto). With visible, even if there's a tiny overflow, browser doesn't show a scrollbar on body — relies on natural document scroll. But more importantly, switching `min-h-screen` to `min-h-[100dvh]` would fix the vh-vs-dvh discrepancy.

Let me check the user's description: "scrollable when based on the content contained shouldn't be" — yes, classic mobile chrome eating viewport while `100vh` doesn't account for it.
<lov-tool-use id="toolu_vrtx_015NUj5PQY4aZVnVQyagJwYj" name="cross_project--read_project_file" integration-id="cross_project" data="{\"project\": \"59c40741-ab30-4ffc-a579-d7edf50dceff\", \"file_path\": \"src/index.css\", \"lines\": \"50-80\"}">
</lov-tool-use>
Confirmed. Quiz Flash uses `overflow: visible !important` (not auto). That's the key difference. With `auto`, browsers can show scrollbars and reserve scroll space; with `visible`, content only scrolls if it actually overflows the document, no false scrollbar.

Combined with the entries/winners pages using `min-h-screen` (100vh, not 100dvh), on mobile this creates phantom scroll. Fixing both — switching CSS to `visible` and swapping `min-h-screen` → `min-h-[100dvh]` on these short pages — eliminates the issue.

<lov-plan>

## Fix phantom scroll on entries / winners (and verify leaderboard)

The scroll-on-short-pages bug has two compounding causes:

### Cause 1 — `overflow-y: auto` instead of `visible`

Our `.allow-scroll` rule uses `overflow-y: auto !important`, which makes html+body each become a scroll container. Some browsers (esp. mobile WebKit) reserve scrollbar gutter or render a scroll affordance even when content barely overflows.

Quiz Flash AI's working version (referenced) uses `overflow: visible !important` — content only scrolls when it actually exceeds the document height, no false scrollbar.

### Cause 2 — `min-h-screen` is `100vh`, not `100dvh`

`entries.tsx`, `winners.tsx`, and `leaderboard.tsx` all wrap content in `min-h-screen` (= `100vh`). On mobile, `100vh` includes browser chrome (URL bar, etc.) while the actually visible viewport is smaller. So the wrapper is taller than the visible area → scroll appears even when content fits.

Our base lock uses `100dvh` correctly; the wrappers should match.

### The fix

**1. `src/styles.css`** — align with the proven Quiz Flash pattern:

```css
html, body {
  height: 100dvh;
  overflow: hidden;
}
html.allow-scroll,
html.allow-scroll body {
  height: auto !important;
  overflow: visible !important;
}
html.allow-scroll {
  scroll-behavior: smooth;
  overflow-x: hidden !important;
}
```

Changes: `overflow-y: auto` → `overflow: visible`, plus the smooth-scroll + horizontal-clamp safety rule.

**2. `src/routes/_authed/entries.tsx`** — `min-h-screen` → `min-h-[100dvh]`.

**3. `src/routes/_authed/winners.tsx`** — same swap.

**4. `src/routes/_authed/leaderboard.tsx`** — same swap (verified: hook is correct, but the wrapper has the same vh issue).

### Why this works

- Short pages (entries, leaderboard at default state): document height ≈ visible viewport → no scroll, no scrollbar, nothing to scroll.
- Long pages (leaderboard scrolled, winners with cards expanded): content naturally exceeds viewport → browser scrolls the document, smooth-scroll active, horizontal locked.
- Game/auth pages (already using `useAllowScroll`): unaffected — they were always meant to scroll when needed and now do so cleanly.

### Files touched

- `src/styles.css` — 6 lines
- `src/routes/_authed/entries.tsx` — 1 line
- `src/routes/_authed/winners.tsx` — 1 line
- `src/routes/_authed/leaderboard.tsx` — 1 line

No new dependencies, no hook/component changes, no route changes.

