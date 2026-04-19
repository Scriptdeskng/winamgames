

## UX audit — My Tickets (`/entries`)

### What works
- Tight mobile layout, clear "This Week" hero with progress bar.
- Familiar list pattern for past weeks.
- TopBar back nav consistent with rest of app.

### Problems

1. **All data is hardcoded mock.** "12 / 50", past weeks, win amounts — none of it is wired to the player. On a real account this is misleading. Must hydrate from `getPlayerData` (already returns `weekTotal`, `weekCap`) + a new query for ledger history.
2. **No countdown to draw.** The whole point of a ticket page is "when do I find out?". Home and Profile both show a Sunday 20:00 WAT countdown — Tickets should too.
3. **No "how to earn more tickets" CTA.** A user with 12/50 has no path forward from this screen. Dead end.
4. **Past week rows have a `ChevronRight` but don't navigate anywhere.** Affordance lies — either link to a week detail (winners for that draw) or remove the chevron.
5. **"Result" column oversimplified.** Shows "No win" or "Won ₦5,000!" but no context: which prize tier, did the user place 1st/2nd/3rd, was it cash/airtime/data. Even "No win" feels harsh — soften to "Not selected" or show their entry count vs. winning odds.
6. **No empty state.** A new user sees the same mock past weeks as a veteran. Need empty state for week 1 players.
7. **No ticket breakdown.** 12 tickets came from somewhere (puzzles, missions, streaks). Showing the source builds trust and reinforces the earn loop. Profile already has weekly entries; this page should go deeper.
8. **Cap framing.** "12 / 50" is fine but doesn't say *why* 50. A one-liner ("Max 50 tickets per draw") prevents confusion when users hit the wall.
9. **Visual hierarchy.** Hero card and past-week cards use the same `surface-1 + border` treatment — hero should feel heavier (gradient or shadow-glow like the home `DrawHeroCard`) so it anchors the page.
10. **No link to Winners page.** Natural cross-link: "See who won last week →".

### Recommended changes (priority order)

**Must do (correctness):**
- Wire to real data: replace mocks with `getPlayerData` for current week + a new `getEntryHistory` server fn that aggregates `winam_entry_ledger` by `draw_week_id`, joined with `winam_draw_weeks` for dates and the user's win status (check `winam_draw_results` for that player+week).
- Remove or wire up the `ChevronRight` — either link to a per-week breakdown route or drop the icon.

**Should do (UX):**
- Add a Sunday-WAT countdown above or inside the hero card (reuse the home `DrawHeroCard` pattern — extract to a shared component).
- Add a "How tickets are earned" mini-section or inline hint chip linking to `/wisdomdrop` and `/checkmate` (clear next action when not at cap).
- Add a "See all winners →" link to `/winners` at the bottom of past weeks.
- Empty state for new users: friendly card with "Your first draw is this Sunday — play to earn tickets" + Play CTA.

**Nice to have (depth):**
- Source breakdown for current week (puzzles X · missions Y · streak Z) as a small row under the progress bar.
- Per-week detail route (`/entries/$weekId`) showing source breakdown + draw outcome for that week (only if chevron stays).
- Cap tooltip: small "(i)" next to "12 / 50" explaining the 50/week cap.

**Remove:**
- The harsh "No win" copy → soften to "Not selected this week".
- Chevron on past-week rows if no detail route is built.

### Out of scope
- Schema changes (data already exists in `winam_entry_ledger` + `winam_draw_results`).
- Notifications/push when draw runs.
- Sharing wins.

### Suggested next step

Pick the priority slice. Two reasonable cuts:
- **Slice A (data correctness only):** wire current week + history to real data, soften copy, remove dead chevron. ~1 file + 1 server fn.
- **Slice B (data + countdown + CTAs):** Slice A plus countdown, earn CTA, winners link, empty state. ~1 file + 1 server fn + extract shared countdown component.

