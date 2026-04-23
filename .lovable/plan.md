

## Diagnosis: stale browser cache, not a code bug

I checked the codebase and dev server. Findings:

- **TypeScript passes cleanly** (`bunx tsc --noEmit` returns no errors).
- **Dev server returns 200** for `/leaderboard` (and all other routes).
- **Source files are syntactically valid** — `leaderboard.tsx`, `checkmate.tsx`, `wisdomdrop.tsx` all parse OK.
- **`routeTree.gen.ts` is healthy** — every authed route is registered correctly, no doubled segments.

The console error in the user's preview is:

```
TypeError: Failed to fetch dynamically imported module:
.../src/routes/_authed/leaderboard.tsx?tsr-split=component
```

…and the route match shows the suspicious doubled path `/_authed/leaderboard/leaderboard`.

### What actually happened

The dev-server log shows a sequence of historical crashes earlier in this session:

1. A duplicate `puzzleFen` identifier in one route file (line 124) — already fixed.
2. An "Adjacent JSX elements must be wrapped" error in another route file (line 410:4) — already fixed.
3. Stale imports of `HeroGameGraphics.tsx` and a missing `_authed/index.tsx` — already cleaned up.

While the dev server was crashing, the preview tab fetched and cached chunk URLs (`?tsr-split=component` hashes) that the now-restarted server no longer serves. When the user clicks "Leaderboard" in the menu, the SPA performs a client-side navigation and tries to re-fetch a chunk URL that doesn't exist anymore, throwing `Failed to fetch dynamically imported module`. The error boundary then renders the "Something went wrong" page.

The "doubled path" in the route match (`/_authed/leaderboard/leaderboard`) is the error boundary's own match key, not a real routing issue.

### Fix

There is no code change required. The preview tab needs a hard reload to drop the stale module URLs and pick up the current chunk hashes.

**Action when implementation mode resumes:**

1. Open the preview, hard-reload it (Cmd/Ctrl+Shift+R), and verify that `/leaderboard`, `/profile`, `/entries`, `/winners`, `/checkmate`, and `/wisdomdrop` all load without the error boundary.
2. If any route still 500s after reload, capture the live dev-server log (`tail -n 200 /tmp/dev-server-logs/dev-server.log`) — that will show the real current error rather than the historical crash trail — and patch the source from there.
3. If everything loads, no further code changes ship from this task.

### Files touched

None, unless step 2 surfaces a real error in the post-reload log. In that case, the patch would be scoped to the exact file/line the live log points at, no other changes.

