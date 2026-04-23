

## Landing page polish — 7 fixes

All edits in `src/routes/index.tsx`. No other files touched.

### 1. Branding: "WinAm Games" / "WinAm" → "WinamGames"

Replace every occurrence of the brand string in the file:
- Meta titles (lines 16, 24, 39): `"WinAm Games — Africa's smartest puzzle arena"` → `"WinamGames — Africa's smartest puzzle arena"`
- Open Graph image URLs (lines 33, 48): leave the host `winamgames.lovable.app` and asset filename `winam-logo.png` untouched (those are external URLs / asset paths, not brand copy).
- Nav `aria-label` (line 96) and `<img alt>` (line 97): `"WinAm Games home"` → `"WinamGames home"`, alt `"WinAm"` → `"WinamGames"`
- Footer `aria-label` (line 604), alt (line 605), and copyright (line 608): same treatment, `© {year} WinamGames`

Asset import path `@/assets/winam-logo.png` is not user-visible — leave it.

### 2. Remove "DAILY PUZZLE ARENA" badge

Delete the entire `<RevealOnScroll>` wrapper at lines 128–133 containing the Sparkles + "Daily puzzle arena" pill. Remove cleanly — nothing replaces it. The H1 below becomes the first hero element. Drop the `mt-4` on the H1 wrapper so spacing doesn't double up (or keep — `RevealOnScroll` doesn't add margin, the `mt-4` was relative to the badge above; remove `mt-4` from line 136 so the H1 sits flush at the top of the copy column).

### 3. Social proof strip — fix mobile overflow + new copy

Lines 531–559. Update the `facts` array to the four shorter strings:

```ts
const facts = [
  { icon: Users, label: "500+ players this week" },
  { icon: Trophy, label: "50+ winners Sunday" },
  { icon: Coins, label: "₦50,000 prizes weekly" },
  { icon: Sparkles, label: "2 games · infinite fun" },
];
```

Replace the wrapper class on line 542 with `flex flex-wrap justify-center gap-2.5` (drop the horizontal-scroll/snap classes and the negative margins). Drop `snap-start shrink-0` from each pill (line 548) so they wrap naturally instead of being forced onto one row.

### 4. Winners section — refresh dates, remove LIVE badge

- Line 453: `"Last drawn · Sunday, Apr 13"` → `"Last drawn · Sunday, Apr 20"`
- Line 464: `"Week of Apr 7 – 13, 2025"` → `"Week of Apr 20 – 26, 2026"`
- Lines 467–473: remove the entire green pulsing "Live" pill `<span>`. The header row keeps just the calendar + week label on the left and nothing on the right.

The "Recent draw" eyebrow already exists at line 436 — no change needed there. (The "Updated weekly" pulsing dot at lines 438–444 is a different element from the LIVE pill being removed; user asked for "RECENT DRAW label only" — leave the existing "Recent draw" eyebrow and "Updated weekly" subtle indicator as-is since they're already neutral. Only the prominent green "Live" pill on the table header gets removed.)

### 5. Games section copy

Lines 297, 300:
- H2: `"Built for the way you think."` → `"Two games. One draw. Every Sunday."`
- Sub: → `"Play chess puzzles and African proverbs. Solve daily to earn draw tickets and compete for cash prizes every Sunday."`

### 6. CheckMate card copy

Lines 324, 328:
- Badge: `"1-move mates · daily"` → `"Tactical puzzles · daily"` (Tailwind `uppercase` class handles caps)
- Body: → `"Find the best move in tactical chess puzzles. Forks, pins, skewers and more — one puzzle at a time."`

### 7. WisdomDrop badge

Lines 339–341. Replace the purple `bg-xp/10 border-xp/20 text-xp` pill with the same emerald treatment used by CheckMate:

```tsx
<span className="text-[10px] font-semibold uppercase tracking-wider text-emerald bg-emerald/10 border border-emerald/20 rounded-full px-2.5 py-1">
  5+ African regions
</span>
```

### Out of scope (explicitly unchanged)

- `src/assets/winam-logo.png` filename and `winamgames.lovable.app` domain — infra, not copy.
- Any other route file, component, or routing/logic.
- The pulsing "Updated weekly" dot in the winners eyebrow row — already neutral, not the "LIVE" pill being removed.

