

## Compact WisdomDrop hint chip

Single change in `src/routes/_authed/wisdomdrop.tsx` — replace the current tall hint chip card with a slim, single-line pill. Keep `motion.div` + `AnimatePresence` wrapper for the entrance animation; only the inner markup and classes shrink.

### Change

Inside the existing `<AnimatePresence>` block (the chip rendered between the proverb prompt and the choices), swap the contents of the `motion.div`:

```tsx
<AnimatePresence>
  {!session.feedback && session.hintData && (session.hintData.startsWidth || session.hintData.answer) && (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-6 mb-4 rounded-lg bg-coin/10 border border-coin/20 px-3 py-2 flex items-center gap-2"
    >
      <Lightbulb className="w-3.5 h-3.5 text-coin shrink-0" />
      <div className="min-w-0 flex-1">
        {session.hintData.answer ? (
          <p className="text-xs font-semibold text-foreground">
            Answer revealed · Tap <span className="text-coin">"{session.hintData.answer}"</span>
          </p>
        ) : (
          <p className="text-xs font-semibold text-foreground">
            Starts with <span className="text-coin text-base font-extrabold">{session.hintData.startsWidth}</span>
          </p>
        )}
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

Notes:
- Drops the 40×40 icon tile, gradient background, two-line label/value layout, and large 2xl letter — replaced by a single-line pill.
- Keeps `mx-6 mb-4` so spacing inside the puzzle card stays consistent.
- Coin colour + bold preserved on the first letter / answer for emphasis.

### Files touched

- `src/routes/_authed/wisdomdrop.tsx` — only this file.

No other components, logic, styles, or backend changes.

