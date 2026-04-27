Plan to fix the two game session bugs:

1. Update final-puzzle game-over logic in `src/components/games/useGameSession.ts`
   - In `submit()`, change `isGameOver` so reaching the last puzzle ends the game regardless of whether the submitted answer was correct.
   - Replace:
     ```ts
     const isGameOver = isDead || (result.correct && isLastPuzzle);
     ```
     with:
     ```ts
     const isGameOver = isDead || isLastPuzzle;
     ```

2. Add fallback navigation when `closeSession()` returns `success: false`
   - In `endSession()`, keep the existing `/results` navigation for successful closes.
   - Add an `else` branch that navigates back to `/app` if the close call completes but reports failure.

3. Verify
   - Run the project build after the edit.
   - Do not modify any file except `src/components/games/useGameSession.ts`.