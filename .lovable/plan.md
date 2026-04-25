Plan:

1. Update only `src/routes/_authed/results.tsx`.
2. Wrap the existing weekly progress block in a subtle card using:
   - `bg-card`
   - `border border-border`
   - `rounded-2xl`
   - `p-4`
3. Keep these existing elements inside the new card:
   - Weekly tickets line, e.g. `39 of 50 tickets this week`
   - Progress bar
   - Nudge line, when present
   - Streak pill, when present
4. Keep the hero section and CTA buttons outside the card.
5. Add modest vertical margin above and below the card so the page has breathing room without reintroducing the large dead gap.
6. Do not change logic, route data, calculations, navigation, or any files besides `results.tsx`.