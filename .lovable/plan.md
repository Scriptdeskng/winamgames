

## Good catch — streak shouldn't live on the completion card

You're right. The streak is a **player-level lifetime stat**, not a session outcome. A session can't change it (well, the first session of a day can extend it, but it's still about the player, not "what just happened"). Putting it on the completion card creates two problems:

1. **Repetition fatigue.** Play 3 sessions in a day → see "Day 7 streak" three times in a row. Feels stale, makes the screen feel like padding.
2. **Wrong context.** The completion card answers "what did I just earn?" Streak answers "who am I as a player?" — that belongs on Profile.

### The fix: remove streak from results entirely

The streak chip / pill comes off the results screen. It already exists on the Profile page (verified earlier — `RankBadge` + streak display live there). That's its home.

The session breakdown still **uses** the streak bonus — `Streak bonus +1` in the entries breakdown line tells the player they got extra entries because of their streak. That's the session-relevant signal. The day count itself is profile information.

### Updated layout

```
┌─────────────────────────────────────┐
│  [Trophy]                           │
│  Session Complete!                  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   +2 entries                  │  │  ← hero
│  │   Base 1 · Streak bonus +1    │  │  ← breakdown (streak shown HERE as bonus)
│  │                               │  │
│  │   ─────────────────────────   │  │  ← divider
│  │                               │  │
│  │   Entries this week    1/50   │  │
│  │   ▓▓░░░░░░░░░░░░░░░░░░░░░░░   │  │
│  │                               │  │
│  │   Solve 5 next session for    │  │  ← nudge
│  │   another entry               │  │
│  └───────────────────────────────┘  │
│                                     │
│  [    Play again    ]               │
│  [   Back to Home   ]               │
└─────────────────────────────────────┘
```

Cleaner. One card, one purpose: "here's what this session earned you." Profile handles identity/progression.

### What stays the same

- Single unified card (from previous plan).
- Hero / divider / progress / nudge structure.
- Rank-up notification still shown above the card (one-time event, not a recurring stat).
- Entries breakdown still references streak bonus when it applies — player still sees the value of their streak in context.

### What changes from previous plan

- Drop the streak chip in the card's top-right.
- Drop the standalone streak pill below the card (already removed in previous plan).
- Drop `Flame` icon import — no longer used.

### Files touched

- `src/routes/_authed/results.tsx` — remove streak chip block + Flame import. Card structure otherwise as previously planned.

