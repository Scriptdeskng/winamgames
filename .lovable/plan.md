

## Borrow Quiz Flash AI's answered-state UX for WisdomDrop

### Pattern from Quiz Flash AI (reference)

After a player answers:
1. **Explanation panel animates open** beneath the choices (height + opacity tween) and auto-scrolls into view.
2. **Footer changes**: tappable "Next" button always shown. On **correct** answers, an animated SVG ring counts down 5s next to the button, then auto-advances. On **wrong** answers, **no auto-advance** — player must tap Next to move on (so they can read the explanation).
3. Tapping Next at any time cancels the timer and advances immediately.
4. Manual advance also works on the last question — the button label flips to "See Results".

### What's wrong with WisdomDrop today

- Reveal panel sits **above** the puzzle card — visually disconnected from where the player just tapped.
- Auto-advance fires after a fixed `1800ms` on correct answers with **no countdown indicator** and **no way to skip ahead**.
- On wrong answers there's no auto-advance OR next button — the screen just sits there until the next puzzle silently appears (actually it doesn't; it only advances on correct). The player can't progress on a wrong answer at all without losing a life and waiting for the implicit flow.
- Reveal copy uses a different visual language (rounded card with X/Check icon) than the puzzle itself.

### Proposed changes

#### 1. Move reveal panel inline with the puzzle card

Re-order the page so the puzzle card is the anchor. Render the reveal **inside / directly attached to the puzzle card** (just below the choices), animated open with framer-motion (`height: 0 → auto`, opacity fade). This matches the QuixFlash pattern where the explanation feels like part of the same surface the player just tapped.

#### 2. Add an auto-advance countdown ring (correct answers only)

New small component `AutoAdvanceRing` (mirrors QuixFlash's, restyled in our emerald tokens):
- 44px SVG ring, 5s linear stroke fill from 0 → full circumference.
- Uses `hsl(var(--success))` / emerald token.
- Renders only when `feedback === "correct"`.

Bump the auto-advance window from **1800ms → 4000ms** (shorter than QuixFlash's 5s since proverbs are quicker to read, but long enough for the reveal to register).

#### 3. Always-present "Next" button after answering

A persistent footer button below the puzzle card whenever `feedback !== null`:
- **Correct + not last**: `[ring countdown] Next →` (auto-advance armed, button skips it)
- **Correct + last puzzle**: `[ring countdown] See Results →`
- **Wrong + lives remaining**: `Continue →` (no ring, no auto-advance, player taps to proceed)
- **Wrong + game over (0 lives)**: `See Results →` (no ring)

This solves the current dead state on wrong answers — the player can read the reveal as long as they want, then tap to move on.

#### 4. Hook changes (`useGameSession.ts`)

Currently `submit()` auto-fires the next puzzle on a `setTimeout` for correct answers and never advances on wrong. We need to:
- Expose an `advance()` method that flushes the pending advance immediately (clearing any timer).
- For **wrong** answers (when not game over), no longer silently consume — keep the current puzzle visible, set `feedback: "incorrect"`, and wait for `advance()` to be called explicitly. Then `advance()` either moves to the next puzzle (lives remain) or triggers `endSession` (lives at 0).
- For **correct** answers, keep the auto-advance `setTimeout` (now 4000ms) **and** allow `advance()` to clear it and advance early. Use a `pendingAdvanceRef` so both paths converge.
- For game-over states, `advance()` calls `endSession` immediately.

Add `advance` to the returned API. Both pages call it from the new Next button.

#### 5. Tidy reveal styling

- Inline the reveal beneath the choices (still inside the `surface-1` card border so it visually belongs).
- Smaller icon row: `Check` / `X` in 16px, no big colored panel — just a tinted divider line + the existing reveal text (answer, full proverb, region).
- Animate `height: 0 → auto` + opacity using `framer-motion` (already in `package.json`, used in `BannerStack`).

### Files touched

- **`src/components/games/useGameSession.ts`** — refactor `submit()` to defer wrong-answer advance; add `pendingAdvanceRef` + new `advance()` method; bump auto-advance to 4000ms; export `advance`.
- **`src/components/games/AutoAdvanceRing.tsx`** *(new)* — 44px SVG countdown ring using emerald success token.
- **`src/components/games/AnswerFooter.tsx`** *(new)* — sticky-ish footer block that renders the ring + Next/Continue/See Results button based on feedback + lives + last-puzzle state.
- **`src/routes/_authed/wisdomdrop.tsx`** — move reveal inline beneath the choices inside the puzzle card; replace the standalone reveal block; add `<AnswerFooter>` after the choices; wire `session.advance` to it.
- **`src/routes/_authed/checkmate.tsx`** — apply the same footer pattern (ring + Next button, auto-advance on correct, manual on wrong) for consistency. Reveal handling is simpler there (no proverb text), so just feedback chip + Continue/Next.

### Out of scope

- Lives/coin/hint UI — unchanged.
- GameHeader, timer, exit flow — unchanged.
- Backend / `submitMove` / scoring — unchanged.
- Onboarding / landing screens — unchanged.

### Open question (will use defaults unless you say otherwise)

- **Auto-advance duration**: defaulting to **4s** for WisdomDrop (proverbs are short to re-read) and **5s** for CheckMate (board state takes longer to absorb). Say the word if you want both at 5s or both at 4s.

