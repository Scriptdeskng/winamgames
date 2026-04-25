I’ll make the requested string-only copy updates with no logic changes and no other files touched.

Files to update:

1. `src/routes/_authed/entries.tsx`
   - Change page title text from `My Entries` to `My Tickets`.

2. `src/routes/_authed/results.tsx`
   - Change `Session Complete` to `Round Complete`.
   - Change `No entries this time` to `No tickets this time`.
   - Change the zero-puzzle nudge to use `round` instead of `session`.
   - Change all four streak bonus strings from `per session` to `per round`.

3. `src/routes/_authed/profile.tsx`
   - Change explanatory copy to use `round`/`rounds` instead of `session`/`sessions` in the specified ticket, coin, streak, and bonus text.
   - Change the streak tile bonus text from `/ session` to `/ round`.

4. `src/components/games/DrawLockBanner.tsx`
   - Change `Draw tickets locked · Coins only this session` to `Draw tickets locked · Coins only this round`.

Validation:
- After applying, I’ll run a targeted search for `entries`, `session`, and `sessions` in the same folders to confirm the requested strings were replaced and no unintended files were changed.