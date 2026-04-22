

## CheckMate UX polish — three fixes

### 1. Progressive hint chip + per-tier buttons (`src/routes/_authed/checkmate.tsx`)

**Replace** the current single "next-tier" `HintButton` with three stacked tier buttons rendered inline. Each button:
- Disabled if `currentHintTier >= tier` (already purchased)
- Disabled if `tier > currentHintTier + 1` (must buy in order — tier 2 locked until tier 1 bought)
- Disabled if `coinBalance < cost` or `loading`/`gameOver`
- Shows ✓ when purchased

Keep the `HintButton` component file but no longer use it on this screen — or refactor it to render all three tiers. Cleanest path: build a small inline `HintTierRow` block in `checkmate.tsx` (3 buttons, costs 25/75/150) and stop importing `HintButton` here. WisdomDrop still uses `HintButton` so leave that file untouched.

**Rewrite the hint chip** to render a single line that grows with tier:

```tsx
{session.currentHintTier > 0 && !session.feedback && (
  <div className="rounded-xl bg-coin/10 border border-coin/20 p-3 text-center">
    <p className="text-sm text-coin">
      Move the <strong className="font-semibold">{session.hintData?.piece}</strong>
      {session.currentHintTier >= 2 && <> to <strong className="font-semibold">{session.hintData?.destination}</strong></>}
      {session.currentHintTier >= 3 && session.hintData?.from && (
        <> from <strong className="font-semibold">{session.hintData.from}</strong> to <strong className="font-semibold">{session.hintData.to}</strong></>
      )}
    </p>
  </div>
)}
```

Note: at tier 3 the destination appears twice ("to f7 ... from h5 to f7") — fix by switching the tier-2 phrasing to "to **{destination}**" only when tier === 2, and the tier-3 line replaces it: render either tier-2 OR tier-3 phrasing, not both.

Final shape:
```tsx
<p className="text-sm text-coin">
  Move the <strong>{piece}</strong>
  {tier === 2 && <> to <strong>{destination}</strong></>}
  {tier >= 3 && <> from <strong>{from}</strong> to <strong>{to}</strong></>}
</p>
```

Board hint highlights already work via existing `hintFrom`/`hintTo` props (with `destination` fallback) — no change needed.

### 2. Board visuals (`src/components/games/ChessBoard.tsx`)

- **Square colours**: replace `bg-emerald-dim/30` / `bg-surface-2` with inline styles using `#B8D4A8` (light) and `#4A7C59` (dark). Tailwind arbitrary values would require build-time class generation; inline `style={{ backgroundColor: ... }}` is safer and matches the request's exact hex values.
- **Piece size**: drop the `clamp()` inline style; use `text-3xl sm:text-4xl` classes.
- **Piece contrast**: detect colour from FEN char — `const isWhite = piece === piece.toUpperCase()`. Apply `text-white drop-shadow-sm` for white pieces, `text-gray-900` for black.
- **Board border**: change wrapper from `border border-border` to `border-2 border-emerald-900/50 rounded-lg overflow-hidden`. Keep `shadow-card`.
- Hint/selected ring colours unchanged — they read fine on both square colours.

### 3. Context line + first-time onboarding card (`src/routes/_authed/checkmate.tsx`)

**Side-to-move from FEN** (accurate for all puzzles, including cm-002 which is Black to move):
```tsx
const sideToMove = puzzle?.fen.split(" ")[1] === "w" ? "White" : "Black";
```
Render directly above the board:
```tsx
<p className="text-center text-xs text-muted-foreground">
  {sideToMove} to move — find the best move
</p>
```

**Onboarding card** (one-time, localStorage key `winam_checkmate_onboarded`):
```tsx
const [showOnboarding, setShowOnboarding] = useState(false);
useEffect(() => {
  if (typeof window !== "undefined" && !localStorage.getItem("winam_checkmate_onboarded")) {
    setShowOnboarding(true);
  }
}, []);
const dismissOnboarding = () => {
  localStorage.setItem("winam_checkmate_onboarded", "1");
  setShowOnboarding(false);
};
```

Render above the context line, only on the in-game view (not the start screen):
```tsx
{showOnboarding && (
  <div className="rounded-xl bg-surface-1 border border-emerald/30 p-4 space-y-3">
    <p className="text-sm text-foreground leading-relaxed">
      Tap a piece to select it, then tap where you want it to move.
      Find the winning move to earn your entry.
    </p>
    <button onClick={dismissOnboarding}
      className="w-full h-10 rounded-lg bg-emerald text-emerald-foreground text-sm font-semibold hover:bg-emerald/90 transition-colors">
      Got it
    </button>
  </div>
)}
```

SSR-safe via the `typeof window` guard inside `useEffect`.

### Out of scope / flagged

- **WisdomDrop `HintButton` usage** — left untouched. Only CheckMate gets the per-tier UI per request scope.
- **Colours bypass design tokens** — the requested hex values (`#B8D4A8`, `#4A7C59`, `border-emerald-900/50`) are hardcoded rather than added to `styles.css` as semantic tokens. Acceptable for a chess-board-specific surface; flagged in case you'd prefer tokenising.

### Files touched

- `src/components/games/ChessBoard.tsx` — square hex colours, piece size classes, white/black piece contrast, board border
- `src/routes/_authed/checkmate.tsx` — three-tier hint button row (replacing `HintButton` import on this screen), progressive single-chip hint display, side-to-move context line, one-time onboarding card with localStorage flag

No DB changes. No new dependencies.

