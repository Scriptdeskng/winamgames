

## WisdomDrop — three-tier inline hint grid + premium chip

Single file change: `src/routes/_authed/wisdomdrop.tsx`. No backend, no shared component changes.

### 1. Imports

- Remove `HintButton` import.
- Add `Lightbulb` to existing `lucide-react` imports.

### 2. Tier definitions (top of file)

```ts
const WISDOM_HINT_TIERS = [
  { tier: 1, label: "Eliminate 2", cost: 25 },
  { tier: 2, label: "First letter", cost: 75 },
  { tier: 3, label: "Reveal", cost: 150 },
] as const;
```

### 3. Tier-3 reveal on option buttons

Compute alongside `eliminatedOptions`:

```ts
const revealedAnswer = session.hintData?.answer ?? null;
```

Add a branch in the option-button `className` cascade so that when `!showState && revealedAnswer && normalize(option) === normalize(revealedAnswer)` the button gets `bg-success/10 border-success/40 text-success ring-1 ring-success/30 shadow-glow` — the player sees which button to tap. Tier 1 elimination styling stays as-is.

### 4. Premium hint chip (replaces existing plain text chip)

```tsx
<AnimatePresence>
  {!session.feedback && session.hintData && (session.hintData.startsWidth || session.hintData.answer) && (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mx-6 mb-4 rounded-xl bg-gradient-to-br from-coin/15 to-coin/5 border border-coin/30 p-3 flex items-center gap-3"
    >
      <div className="h-10 w-10 rounded-lg bg-coin/20 border border-coin/30 flex items-center justify-center shrink-0">
        <Lightbulb className="h-5 w-5 text-coin" />
      </div>
      <div className="min-w-0 flex-1">
        {session.hintData.answer ? (
          <>
            <p className="text-[11px] uppercase tracking-wide text-coin/80 font-semibold">Answer revealed</p>
            <p className="text-sm font-bold text-foreground truncate">Tap "{session.hintData.answer}"</p>
          </>
        ) : (
          <>
            <p className="text-[11px] uppercase tracking-wide text-coin/80 font-semibold">Starts with</p>
            <p className="text-2xl font-extrabold text-coin tabular-nums leading-none mt-0.5">{session.hintData.startsWidth}</p>
          </>
        )}
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

(Tier 1 alone shows no chip — eliminated buttons are the visual feedback.)

### 5. Replace `<HintButton />` with inline 3-column grid

```tsx
{!session.feedback && (
  <div className="space-y-2">
    <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70 font-semibold px-1">
      Need a hint?
    </p>
    <div className="grid grid-cols-3 gap-2">
      {WISDOM_HINT_TIERS.map(({ tier, label, cost }) => {
        const purchased = session.currentHintTier >= tier;
        const locked = tier > session.currentHintTier + 1;
        const canAfford = session.coinBalance >= cost;
        const isDisabled = purchased || locked || !canAfford || session.loading || session.gameOver;

        return (
          <button
            key={tier}
            onClick={() => !isDisabled && session.requestHint(tier as 1 | 2 | 3)}
            disabled={isDisabled}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-xs font-medium transition-all border min-h-[72px]",
              purchased
                ? "bg-success/10 border-success/30 text-success"
                : locked
                  ? "bg-surface-1/50 border-border/50 text-muted-foreground cursor-not-allowed opacity-50"
                  : !canAfford
                    ? "bg-surface-1/50 border-border/50 text-muted-foreground cursor-not-allowed opacity-40"
                    : "bg-surface-1 border-border text-foreground hover:border-primary/30 active:scale-95"
            )}
          >
            {purchased ? <Check className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
            <span className="font-semibold">{label}</span>
            <span className="text-[10px] opacity-70">
              {purchased ? "Used" : `${cost} coins`}
            </span>
          </button>
        );
      })}
    </div>
  </div>
)}
```

### Verification (report all six)

1. Three-tier grid renders; tier 1 active, tiers 2 and 3 locked.
2. Buy tier 1 → green check + "Used"; two wrong options grey out + strikethrough; tier 2 unlocks.
3. Buy tier 2 → large bold coin-coloured first letter chip animates in.
4. Buy tier 3 → correct option button highlights green with glow ring; chip shows `Tap "[answer]"`.
5. Insufficient coins → button greyed out, not clickable.
6. After correct/wrong answer → entire hint area (chip + grid) hides.

### Files touched

- `src/routes/_authed/wisdomdrop.tsx` — only file.

No DB, schema, or other component changes. No change to `HintButton.tsx`, `useGameSession.ts`, or `game.functions.ts`.

