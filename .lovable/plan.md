

## UX improvements for the entire Profile page

Looking at the current page (screenshot + code), it works but has structural issues that compound: identity is buried, the rank system isn't legible, stats are decorative, navigation feels like an afterthought, and the explainer is a wall of text. Here's a holistic pass ranked by impact.

### Current structure (what's there now)

```
TopBar + "Profile" title + Logout
Identity card (avatar + nickname + ****0000)
XP Progress bar (rank badge + xp/next + progress bar)
3 stat tiles (Coins | Streak | Entries)
2 link rows (My Entries | Winners)
"How entries work" — 4 paragraphs
```

### Problems

1. **Identity card is generic.** Big avatar icon, nickname, masked phone — no sense of "who I am as a player." Rank lives in a *separate* card below, disconnected from identity. Players think of their rank as part of who they are.
2. **Rank progress is functional but cold.** "150 / 500 XP · 350 XP to Sergeant" is a spec readout, not motivating. No visual sense of journey.
3. **Stats tiles compete with each other.** Coins, Streak, Entries all the same size, same weight — eye doesn't know what matters. Entries (the whole point of the app) ties for least visual weight.
4. **Logout in the header is a destructive action sitting next to the page title.** Easy mis-tap, wrong place semantically. Logout belongs at the bottom of the page, after everything else.
5. **No "this week" framing.** Entries tile shows a number with no context — is that good? Bad? Compared to what?
6. **Navigation links are flat.** My Entries and Winners are the only two destinations and they look identical. Winners is a community/discovery thing; Entries is personal. Different intent → different treatment.
7. **No call-to-action.** Player lands on profile, looks around, then... what? No "Play now" button. Profile is a dead-end.
8. **Missing useful info.** No "next draw in 2d 14h," no "your best rank," no "lifetime entries," no "join date." Profile feels thin.

### Proposed redesign (ordered top to bottom)

```
┌─────────────────────────────────────┐
│  ← Back                             │  ← TopBar (no logout here)
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │  [Avatar]  Nickname           │  │  ← Hero identity card
│  │            ****0000           │  │     (rank merged in)
│  │                               │  │
│  │  [Veteran badge]   1,200 XP   │  │
│  │  ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░     │  │  ← rank progress lives
│  │  1,300 XP to Champion         │  │     INSIDE identity
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  This week                    │  │  ← Primary stat: hero
│  │  12 / 50 entries              │  │     (entries = the point
│  │  ▓▓▓▓▓░░░░░░░░░░░░░░░░░       │  │      of the app)
│  │  Next draw in 2d 14h          │  │
│  │                               │  │
│  │  [    Play to earn more   ]   │  │  ← CTA to home/game
│  └───────────────────────────────┘  │
│                                     │
│  ┌──────────────┬────────────────┐  │  ← Secondary stats
│  │  🪙 Coins    │  🔥 Streak     │  │     (2-up, equal weight)
│  │  450         │  Day 7         │  │
│  │              │  +2 bonus/sess │  │
│  └──────────────┴────────────────┘  │
│                                     │
│  My activity                        │  ← Section label
│  ┌───────────────────────────────┐  │
│  │  🎟  My Entries          12 → │  │  ← count badge on right
│  │  🏆  Recent Winners         → │  │
│  └───────────────────────────────┘  │
│                                     │
│  How entries work                   │  ← Numbered list
│  ┌───────────────────────────────┐  │     (from prior plan)
│  │  1. Solve to earn             │  │
│  │     5 puzzles = 1 entry       │  │
│  │  2. Streak bonuses            │  │
│  │     Day 3 +1, Day 7 +2…       │  │
│  │  3. Mission rewards           │  │
│  │  4. Weekly draw               │  │
│  └───────────────────────────────┘  │
│                                     │
│         [  Log out  ]               │  ← Quiet, bottom of page
│                                     │
└─────────────────────────────────────┘
```

### Key changes explained

**1. Merge identity + rank into one hero card.** Rank is identity. One card with avatar/nickname/MSISDN on top, rank badge + XP bar + "X XP to next" on the bottom. Reduces 2 cards → 1. Stronger sense of "who I am."

**2. Promote weekly entries to primary stat card.** It's the whole reason the app exists. Big card with progress bar, "next draw in" countdown, and a primary "Play to earn more" CTA that routes to home. Turns profile from dead-end into a launch pad.

**3. Demote coins + streak to a 2-up grid.** They're secondary stats. Equal weight to each other, smaller than entries. Streak tile shows the bonus it currently confers ("Day 7 · +2 bonus/session") so the value is clear.

**4. Move logout to the bottom.** Quiet ghost button at the very end, after explainer. Removes mis-tap risk, follows iOS settings convention. Keep TopBar clean with just back button.

**5. Add count badges to nav rows.** "My Entries" with a `12 →` on the right tells the player there's something there. Recent Winners just shows the arrow — it's discovery, not personal data.

**6. Section label "My activity"** above the nav rows gives the page rhythm and hints at hierarchy.

**7. Apply the numbered-list treatment** from the prior plan to "How entries work."

**8. Add countdown to next draw** under the entries hero. Creates urgency and answers "when does this matter?"

### What's removed / changed

- Logout chip in header → quiet button at page bottom.
- Standalone XP card → merged into identity hero.
- 3-up stat tiles → 1 hero card (entries) + 2-up grid (coins, streak).
- Plain nav rows → nav rows with count badges + section label.
- "How entries work" 4 paragraphs → 4 numbered rules with bold leads.

### What stays

- TopBar with back button.
- All existing data sources (`getPlayerData`, session) — no schema changes.
- Color tokens, surface treatments, border radii — uses existing design system.
- All current routes and navigation targets.

### Optional extras (call out, don't auto-include)

- **Lifetime stats footer** — "Lifetime: 247 puzzles solved · 38 entries · joined Mar 2026." Adds depth but adds height. Skip unless you want the page to feel meatier.
- **Rank journey visualization** — show all 8 rank tiers as a horizontal track with current position marked. High effort, high payoff for engagement, but a separate task.
- **Mission progress tile** — if any missions are active, surface them on profile. Currently missions only show on home. Consider for a follow-up.

### Files touched

- `src/routes/_authed/profile.tsx` — restructure entire page layout.
- `src/components/profile/RankBadge.tsx` — likely reuse `XpProgressBar` inside the new identity hero with minor style tweaks (remove its outer card wrapper, since it'll live inside another card).

No new data, no schema changes, no new routes. Pure layout/composition work plus the existing "next draw in" calculation (already used elsewhere on home — can reuse).

### Recommendation

Implement the full redesign as one pass. Each piece reinforces the others — you can't fix the identity card without addressing the disconnected rank card, can't promote entries without demoting coins/streak. Doing it piecemeal would mean two awkward in-between states.

