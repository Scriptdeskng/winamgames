

## Profile hero — tone down the avatar

Avatar is currently solid emerald (`bg-primary` + white icon) which competes with the weekly entries CTA. Revert to a muted, neutral-grey treatment so identity recedes and the entries card leads.

### Change to `IdentityHero` only

**Avatar styling**
- Background: `bg-primary` → `bg-surface-2` (neutral grey surface token, already used elsewhere in the hero)
- Icon: `text-primary-foreground` → `text-muted-foreground` (greyed out, matches secondary text)
- Size, shape, ring on pill, rest of hero: unchanged

### Why these tokens

`bg-surface-2` + `text-muted-foreground` is the same pairing used for the streak/coins tile backgrounds and the XP bar track — keeps the avatar in the same visual layer as other secondary chrome instead of acting as a focal point. Pill (tier color) stays vivid so rank still pops.

### Resulting hierarchy

```
   ⊙ (grey circle, grey icon — recedes)
   [Veteran]              ← pill keeps tier color → only pop in hero
   King Ed ✏️
   ▓▓▓░░░░
   440 XP to Champion

──────────────────────────
┃ THIS WEEK              ┃ ← clear primary
┃ 12 / 50 entries        ┃
┃ [Play to earn more →]  ┃
──────────────────────────
```

### Files touched

- `src/routes/_authed/profile.tsx` — `IdentityHero` avatar div only (2 className swaps).

