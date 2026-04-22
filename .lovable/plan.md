

## CheckMate — retag puzzle themes to Lichess taxonomy

### 1. `src/data/checkmate-puzzles.ts`

The `ChessPuzzle` interface currently has no `theme` field but every puzzle is being assigned one. Add `theme: string` to the interface, then set the theme on each of the 20 puzzles per the mapping:

| ID | Theme |
|---|---|
| cm-001 | Fork |
| cm-002 | Checkmate in 1 |
| cm-003 | Pin |
| cm-004 | Attacking f2 or f7 |
| cm-005 | Attacking f2 or f7 |
| cm-006 | Fork |
| cm-007 | Clearance |
| cm-008 | Pin |
| cm-009 | Exposed king |
| cm-010 | Advanced pawn |
| cm-011 | Hanging piece |
| cm-012 | Trapped piece |
| cm-013 | Exposed king |
| cm-014 | Clearance |
| cm-015 | Capture the defender |
| cm-016 | Clearance |
| cm-017 | Pin |
| cm-018 | Hanging piece |
| cm-019 | Clearance |
| cm-020 | Discovered attack |

### 2. `src/routes/_authed/checkmate.tsx`

Replace the existing `GOAL_BY_THEME` map (which holds the old descriptive themes like "Scholar's mate", "Fork the king", etc.) with the new 11-key Lichess-aligned map:

```ts
const GOAL_BY_THEME: Record<string, string> = {
  "Fork": "Your piece can attack two opponent pieces at once. Find the fork.",
  "Checkmate in 1": "You have an immediate checkmate. Can you find it?",
  "Pin": "You can pin a piece against a more valuable one behind it. Find the pin.",
  "Attacking f2 or f7": "The f7 square is weak and under-defended. How do you exploit it?",
  "Clearance": "Find the move that develops your piece to its most active square.",
  "Exposed king": "The king is exposed in the centre. Find the move that exploits it.",
  "Advanced pawn": "A strong pawn push controls the centre and gains space. Find it.",
  "Hanging piece": "An opponent piece is undefended or can be attacked with tempo. Find it.",
  "Trapped piece": "An opponent piece has no safe escape. Find the move that proves it.",
  "Capture the defender": "Capturing this piece removes a key defender. Find the winning exchange.",
  "Discovered attack": "Moving one piece reveals a hidden attack from another. Find it.",
};
```

The existing fallback `?? "Find the best move."` stays in place. The `(puzzle as any).theme` lookup is unchanged — server already passes the theme through.

### Files touched
- `src/data/checkmate-puzzles.ts` — add `theme` to interface, set on all 20 puzzles
- `src/routes/_authed/checkmate.tsx` — swap `GOAL_BY_THEME` contents

No DB, schema, or dependency changes.

