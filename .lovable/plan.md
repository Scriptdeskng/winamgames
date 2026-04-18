

## Plan

Yes — auto-advance simplifies things significantly and makes the index-based carousel even cleaner. Here's the proposal:

### Approach: index-based carousel + auto-advance, no drag

Drop the swipe gesture entirely. The carousel cycles automatically every ~5 seconds. This removes:
- All `framer-motion` drag handling (`drag`, `dragSnapToOrigin`, `onDragEnd`, threshold math, velocity detection)
- The "swipe" hint label and its `localStorage` flag
- The dismissing state machine (`dismissing` / `onAnimationComplete` race)
- All the edge cases around partial drags, fast flicks, and exit-completion timing

### Mechanics

```tsx
const [activeIndex, setActiveIndex] = useState(0);
const N = visible.length;

useEffect(() => {
  if (N <= 1) return;
  const id = setInterval(() => setActiveIndex(i => (i + 1) % N), 5000);
  return () => clearInterval(id);
}, [N]);

// For each banner:
const slot = (i - activeIndex + N) % N;
<motion.div
  key={banner.id}
  animate={{ y: slot * 6, scale: 1 - slot * 0.04, opacity: slot < 3 ? 1 : 0 }}
  transition={{ type: "spring", stiffness: 280, damping: 30 }}
  style={{ zIndex: N - slot }}
/>
```

That's the entire interaction logic. ~40 lines total.

### Visual behaviour

- 3 cards stacked, peek effect identical to current design (offset 6px, scale -0.04 per slot)
- Every 5s, `activeIndex` increments → all slots recompute → front card animates back to slot 1, slot 1 animates forward to slot 0, etc. Smooth spring transition handles all motion.
- Since cards stay mounted and only `y`/`scale` change, the front card slides smoothly into the back-stack position rather than flying sideways. This is a cleaner, calmer "deck shuffle" feel.

### Trade-off to confirm

The original spec said "horizontally swipeable, no auto-advance". Switching to auto-advance means:
- ✅ Bulletproof — no gesture state, no race conditions, no failure modes
- ✅ Removes "Swipe" label + localStorage complexity
- ❌ User can't manually advance to a specific banner
- ❌ Cards no longer fly off sideways — they cycle into the back-stack instead

If you want **both** auto-advance AND tap-to-advance (no drag, just tap front card to skip), that's still trivial — add `onClick={() => setActiveIndex(i => (i + 1) % N)}` to the front card. No gesture math needed.

### Files touched

- `src/components/home/BannerStack.tsx` — full rewrite, ~40 lines
- `src/utils/mission.functions.ts` — no changes
- DB — no changes

