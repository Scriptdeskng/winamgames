
## Fix WisdomDrop answer feedback ambiguity and harden correctness checks

The screenshot shows the app highlighting the correct answer in green after an incorrect submission, but it does not show which option the user actually tapped. That makes the feedback look contradictory: “Not quite — answer: respected” while “respected” is highlighted.

I also checked the recorded attempt for that exact puzzle: the backend stored the submitted answer as `loved`, while the correct answer was `respected`. So the immediate issue is the feedback UI not distinguishing **selected answer** from **correct answer**. I’ll fix that and also harden the answer comparison so this cannot fail due to casing or whitespace.

### Changes

#### 1. Track the selected WisdomDrop answer
Update `src/components/games/useGameSession.ts`:
- Add `selectedAnswer` to game state.
- Set it immediately when a player taps an option.
- Clear it when advancing to the next puzzle or starting a new session.
- Store the server-echoed submitted answer if returned, so the UI reflects exactly what was judged.

#### 2. Return submitted answer from the server
Update `src/utils/game.functions.ts`:
- Include `submittedAnswer` in the `submitMove` response.
- Keep recording `moves_submitted` exactly as submitted for audit/debugging.
- Add a small normalization helper for WisdomDrop correctness:
  - `trim()`
  - collapse repeated whitespace
  - compare case-insensitively

This keeps button answers reliable even if database text has invisible extra spacing or capitalization differences.

#### 3. Make answer states explicit in the WisdomDrop UI
Update `src/routes/_authed/wisdomdrop.tsx`:
- Before the server responds, show the tapped option as “checking” with a primary/emerald outline so users know what they selected.
- After feedback:
  - Correct answer: green success style.
  - User-selected wrong answer: red/error style with an X.
  - Other wrong answers: muted/faded.
- If the selected answer is also correct, it remains green.

#### 4. Improve the reveal copy
Change the incorrect reveal from:

```text
Not quite — answer: respected
```

to:

```text
Not quite — you chose: loved · answer: respected
```

For correct answers, keep the current “Correct” feedback.

#### 5. Validation
After implementing:
- Run a typecheck/build to catch TypeScript issues.
- Verify the WisdomDrop flow logic by reviewing:
  - selected answer is cleared between puzzles
  - wrong selected option remains visible in red
  - correct answer remains visible in green
  - result count/lives still follow the server response

### Files touched

- `src/components/games/useGameSession.ts`
- `src/utils/game.functions.ts`
- `src/routes/_authed/wisdomdrop.tsx`

### Out of scope

- Changing puzzle data.
- Changing ticket/XP/lives rules.
- Re-crediting any previous attempts automatically.
