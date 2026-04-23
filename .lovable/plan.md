

## Add missing CheckMate theme goals

`GOAL_BY_THEME` in `src/routes/_authed/checkmate.tsx` (lines 22–34) is missing two themes that exist in `winam_checkmate_puzzles`. Without them, puzzles with these themes fall back to the generic `"Find the best move."` string.

### Change

Add two entries to the `GOAL_BY_THEME` object, after the existing `"Discovered attack"` entry:

```ts
"Skewer": "A high value piece is under attack — moving it will expose a less valuable piece behind it. Find the skewer.",
"Back rank mate": "Your opponent's king is trapped on the back rank with no escape. Find the checkmate.",
```

### Files touched

- `src/routes/_authed/checkmate.tsx` — `GOAL_BY_THEME` map only. No other changes.

