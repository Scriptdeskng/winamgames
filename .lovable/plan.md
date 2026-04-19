

## Add explanation to WisdomDrop reveal panel

Surface the puzzle's `explanation` text inside the inline reveal that appears after a player answers, so players learn the wisdom behind the proverb (not just the missing word).

### Changes

**1. `src/utils/game.functions.ts` — `submitMove` handler**

In the wisdomdrop branch, extend the puzzle select and the returned `revealData`:

```ts
.select("options, correct_index, blank, original_proverb, region, explanation")
```

```ts
revealData: {
  correctAnswer: options[correct_index],
  blank,
  originalProverb: original_proverb,
  region,
  explanation,
}
```

The `explanation` column already exists on the puzzles table — no schema change.

**2. `src/components/games/useGameSession.ts` — `RevealData` type**

Add `explanation: string | null` to the local `RevealData` interface so the new field flows through `state.lastReveal`. The existing setState calls already spread `result.revealData` wholesale, so no setter logic changes are needed beyond the type.

**3. `src/routes/_authed/wisdomdrop.tsx` — reveal panel**

Inside the existing `<AnimatePresence>` reveal block (under the proverb + region line), conditionally render the explanation as a third element:

```tsx
{session.lastReveal.explanation && (
  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 pt-1">
    {session.lastReveal.explanation}
  </p>
)}
```

- Muted, smaller than the proverb so it reads as secondary context.
- `line-clamp-3` caps height to keep the panel compact.
- `pt-1` separates it from the region attribution above.

Only added to wisdomdrop — checkmate has no `explanation` field and is unaffected.

### Out of scope

- DB schema, migrations, or new columns.
- Checkmate reveal panel.
- Animations beyond the existing AnimatePresence open/close.

### Files touched

- `src/utils/game.functions.ts`
- `src/components/games/useGameSession.ts`
- `src/routes/_authed/wisdomdrop.tsx`

