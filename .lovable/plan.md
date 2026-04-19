

## Refine the WisdomDrop tagline

Current: *"Where ancient wisdom meets modern play."* — generic, slightly clichéd, and doesn't hint at the actual mechanic (completing proverbs) or the African heritage angle.

### Direction

Pick a tagline that does at least two of:
- Hints at the gameplay (completing/finishing proverbs, filling the missing word)
- Nods to oral tradition / African heritage without being on-the-nose
- Has rhythm — short, ideally with a beat that feels proverb-like itself

### Options to choose from

1. **"Finish the proverb. Inherit the wisdom."**
   Action + reward. Mirrors proverb cadence (two clauses, parallel structure). Tells the player exactly what they do.

2. **"Every proverb has a missing word. Find it."**
   Direct, intriguing, mechanic-forward. Sounds like a proverb itself.

3. **"The elders left a word out. Can you?"**
   Warm, story-led, has voice. Implies heritage without naming it.

4. **"Wisdom passed down. One word at a time."**
   Lyrical, evokes oral tradition, ties to the gameplay (one blank per puzzle).

5. **"Old words. New game."**
   Punchy, four-word minimalism. Lots of white space, modern feel.

My recommendation: **Option 1** — "Finish the proverb. Inherit the wisdom." It's the most distinctive, has proverb-like rhythm, and explains the mechanic in five words.

### Implementation

Single edit in `src/routes/_authed/wisdomdrop.tsx`: replace the tagline string inside the `<p className="mt-3 text-sm italic ...">` element on the landing screen. Keep the existing italic + muted-foreground styling — the cadence does the work.

If the chosen tagline runs longer (e.g. option 2 or 4), bump `max-w-[280px]` to `max-w-[300px]` to keep it on two clean lines on the 390px viewport.

### Out of scope

CheckMate tagline, in-game UI, any styling changes beyond the optional max-width tweak.

