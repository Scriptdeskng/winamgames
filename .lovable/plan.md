

## Add coin balance + animated hint chip to game screens

Two small UI additions, both files. No logic changes.

### 1. `src/routes/_authed/checkmate.tsx`

**Imports** — add to existing `lucide-react` import (`Lightbulb` is already imported), and add a new framer-motion import:

```tsx
import { motion, AnimatePresence } from "framer-motion";
```

**Replace the static tier-1 hint chip** (currently a plain `div` with "Move the [piece]") with the animated card:

```tsx
<AnimatePresence>
  {session.currentHintTier >= 1 && !session.feedback && session.hintData?.piece && (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl bg-gradient-to-br from-coin/15 to-coin/5 border border-coin/30 p-3 flex items-center gap-3"
    >
      <div className="h-10 w-10 rounded-lg bg-coin/20 border border-coin/30 flex items-center justify-center shrink-0">
        <Lightbulb className="h-5 w-5 text-coin" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-coin/80 font-semibold">
          {session.currentHintTier >= 2 ? "Move hint" : "Piece hint"}
        </p>
        <p className="text-sm font-bold text-foreground">
          Move the highlighted <span className="text-coin">{session.hintData.piece}</span>
        </p>
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

**Add coin balance row** directly above the existing 2-column hint grid (inside the `{!session.feedback && (...)}` block), wrapping grid + balance in a `space-y-2` container:

```tsx
{!session.feedback && (
  <div className="space-y-2">
    <div className="flex items-center justify-end gap-1.5 px-1">
      <Coins className="w-3.5 h-3.5 text-coin" />
      <span className="text-xs font-semibold text-coin tabular-nums">
        {session.coinBalance} coins
      </span>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {/* existing HINT_TIERS map unchanged */}
    </div>
  </div>
)}
```

### 2. `src/routes/_authed/wisdomdrop.tsx`

Insert the same coin balance row inside the existing `space-y-2` "Need a hint?" wrapper, between the label `<p>` and the `grid grid-cols-3` grid:

```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between px-1">
    <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70 font-semibold">
      Need a hint?
    </p>
    <div className="flex items-center gap-1.5">
      <Coins className="w-3.5 h-3.5 text-coin" />
      <span className="text-xs font-semibold text-coin tabular-nums">
        {session.coinBalance} coins
      </span>
    </div>
  </div>
  <div className="grid grid-cols-3 gap-2">
    {/* existing tiers map unchanged */}
  </div>
</div>
```

Pairing the balance with the "Need a hint?" label on one row keeps it compact and avoids an extra vertical block. (`Coins` is already imported.)

### Verification

1. CheckMate session → coin balance visible above the 2-button hint grid; updates after buying a hint.
2. CheckMate tier 1 purchase → animated coin-themed chip slides in with "Piece hint" label.
3. CheckMate tier 2 purchase → chip label switches to "Move hint"; arrow on board still shows destination.
4. WisdomDrop session → coin balance visible on the same row as "Need a hint?", right-aligned.
5. After feedback (correct/wrong) on either game → hint area (incl. balance) hides as before.

### Files touched

- `src/routes/_authed/checkmate.tsx` — add framer-motion import, animated hint chip, coin balance row above grid.
- `src/routes/_authed/wisdomdrop.tsx` — add coin balance to existing "Need a hint?" header row.

No DB, schema, shared component, or game-logic changes.

