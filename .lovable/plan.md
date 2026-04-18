

## Plan

Single-file restructure of `src/routes/_authed/index.tsx` with one small server-fn addition for the dynamic tip stat.

### New layout order
1. `<TopBar />`
2. **DrawHeroCard** (full-width, dominant)
3. **StreakRankStrip** (slim, no border)
4. **DailyMissions** (moved up, with new empty state)
5. **Play Now** game cards (unchanged design, moved down)
6. **DynamicTip** (context-aware)

### 1. DrawHeroCard
- Replace the existing draw card. Live ticking countdown via `useEffect` + `setInterval(1000ms)` returning `HH:MM:SS` string.
- Target time: prefer `drawWeek.drawExecutesAt` if open. If null/past, compute next Sunday 20:00 WAT client-side (`getNextSundayWAT()` helper — find next Sunday, set time to 20:00 WAT = 19:00 UTC).
- Layout:
  - Small uppercase muted "Weekly Draw" label
  - Large `font-mono` (DM Mono — already configured via `--font-mono`) `text-5xl tabular-nums` countdown `HH:MM:SS`
  - Below: `{weekTotal} / {weekCap} entries this week`
  - Full-width progress bar (`<div class="h-2 bg-surface-2 rounded-full">` with inner emerald fill at `weekTotal/weekCap * 100%`)
  - Footer row: muted "Draw every Sunday at 20:00 WAT" left, `<Link to="/entries">View all entries →</Link>` right
- Card styling: `rounded-2xl bg-surface-1 border border-border p-5 shadow-card` — slightly more padding than other cards for dominance.

### 2. StreakRankStrip
- Replace current full streak card with slim row: `rounded-xl bg-surface-1/60 px-4 py-2.5 flex items-center` (no border, subtle fill).
- Left: `<Flame class="text-streak h-4 w-4">` + `{streak}` + "day streak" muted.
- Vertical divider: `<div class="h-5 w-px bg-border mx-3">`.
- Right: rank icon (from `RANK_CONFIG[tier].icon`) + rank label, both colored with `RANK_CONFIG[tier].color`.

### 3. DailyMissions (moved above games)
- Existing rows unchanged.
- Replace empty state (`missions.length === 0`) with retention card:
  ```
  <div class="rounded-2xl bg-surface-1 border border-border p-4 text-center">
    <p class="text-sm font-semibold">Missions reset at midnight</p>
    <p class="text-xs text-muted-foreground mt-1">Play now to build your streak and earn entries</p>
    <Link to="/checkmate" class="...primary button styles..." mt-3>Play now</Link>
  </div>
  ```

### 4. Play Now cards
Move existing block below missions. No design changes.

### 5. DynamicTip
Replace `<DidYouKnow />` with `<DynamicTip />` that selects content via this priority:
1. If `totalSessions === 0` → show onboarding tip (current rotating TIPS array, lightbulb icon).
2. Else if `weekTotal < weekCap` → "{weekCap - weekTotal} more entries to hit your weekly cap".
3. Else if next rank exists → "{nextMin - xpTotal} XP to {nextRankLabel}".
4. Else → "Your best session: {bestSession} puzzles".

To get `totalSessions` and `bestSession`, extend `getPlayerData` server fn to also query `winam_game_sessions`:
```ts
const { data: sessions } = await supabaseAdmin
  .from("winam_game_sessions")
  .select("puzzles_solved")
  .eq("player_id", data.playerId);

const totalSessions = sessions?.length ?? 0;
const bestSession = sessions?.reduce((m, s) => Math.max(m, s.puzzles_solved ?? 0), 0) ?? 0;
```
Return `totalSessions` and `bestSession` in the response. Also surface `xpTotal` (already in `player`) and reuse `RANK_CONFIG` from `RankBadge.tsx` to compute next rank in the component.

Card styling: same as today (`rounded-2xl bg-surface-1 border border-border p-4`), lightbulb icon stays.

### Files touched
- `src/routes/_authed/index.tsx` — full restructure: new `DrawHeroCard`, `StreakRankStrip`, reordered sections, new missions empty state, replaced `DidYouKnow` with `DynamicTip`. Add `useEffect` ticker.
- `src/utils/mission.functions.ts` — extend `getPlayerData` to return `totalSessions` and `bestSession`.

No new files. No new dependencies. No DB changes. No route changes.

