Plan:

1. Update only these files:
   - `src/components/games/useGameSession.ts`
   - `src/components/games/AnswerFooter.tsx`
   - `src/routes/_authed/wisdomdrop.tsx`
   - `src/routes/_authed/checkmate.tsx`

2. In `useGameSession.ts`:
   - Add `closing: boolean` to `GameSessionState`.
   - Add `closing: false` to `INITIAL_STATE`.
   - At the top of `endSession()`, guard against missing session or an in-progress close:
     ```ts
     if (!state.sessionId || state.closing) return;
     setState((s) => ({ ...s, closing: true }));
     ```
   - Add `state.closing` to the `endSession()` dependency list.
   - At the top of `advance()`, add:
     ```ts
     if (state.closing) return;
     ```
   - Add `state.closing` to the `advance()` dependency list.
   - No separate return wiring is needed beyond `...state`, because exposing the new `closing` field through the hook return happens automatically.

3. In `AnswerFooter.tsx`:
   - Add an optional `closing?: boolean` prop.
   - When `closing` is true:
     - Disable the button.
     - Show `Loading...` as the label.
     - Do not attach the click handler.
   - Keep existing behavior unchanged when `closing` is false.

4. In `wisdomdrop.tsx` and `checkmate.tsx`:
   - Pass `closing={session.closing}` to `AnswerFooter`.

5. Run the production build after the edits.

No other changes.