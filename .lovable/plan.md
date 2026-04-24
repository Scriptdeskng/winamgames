Plan:

1. Update `src/routes/_authed/results.tsx` only.
2. Replace the existing ticket nudge copy block with the requested wording:

```ts
if (puzzlesSolved === 0) {
  nudge = "Solve at least 5 puzzles in a session to earn tickets";
} else if (remainder === 0) {
  nudge = "Every 5 puzzles solved earns 1 ticket";
} else {
  const need = 5 - remainder;
  nudge = `${need} more puzzle${need === 1 ? '' : 's'} would have earned you another ticket`;
}
```

3. Make no other file or behavior changes.