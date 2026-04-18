

## Audit: all routes for the viewport/scroll pattern

Let me check every route file for the `useAllowScroll()` hook + `min-h-[100dvh]` pattern.
<lov-tool-use id="toolu_vrtx_01829Xrqwr82JAPsFLMt6HU8" name="code--search_files" integration-id="code" data="{\"query\": \"useAllowScroll|min-h-screen|min-h-\\\\[100dvh\\\\]\", \"include_patterns\": \"src/routes/**/*.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_0185tXNMQsbaJbxTRMr1yTCC" name="code--search_files" integration-id="code" data="{\"include_patterns\": \"src/routes/**/*.tsx\", \"query\": \"useAllowScroll|min-h-screen|min-h-\\\\[100dvh\\\\]\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_0161XFXcQgbzUszpex6wq7jT" name="code--view" integration-id="code" data="{\"file_path\": \"src/routes/_authed/profile.tsx\", \"lines\": \"1-50\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01Ch4VmehQn2LHTa1h6NVV7H" name="code--view" integration-id="code" data="{\"file_path\": \"src/routes/_authed/results.tsx\", \"lines\": \"1-60\"}">
</lov-tool-use>
I have enough. Let me also confirm `_authed.tsx` and `__root.tsx`.

<lov-plan>

## Comprehensive scroll/viewport audit & fix

You're right — earlier passes only touched the routes I had open. Full sweep below.

### Status of every route

| Route | `useAllowScroll()` | wrapper height | Action |
|---|---|---|---|
| `_authed/index.tsx` (home) | ✅ yes | `min-h-screen` ❌ | swap to `min-h-[100dvh]` |
| `_authed/profile.tsx` | ✅ yes | `min-h-screen` ❌ | swap to `min-h-[100dvh]` |
| `_authed/results.tsx` | ✅ yes | `min-h-screen` ❌ | swap to `min-h-[100dvh]` |
| `_authed/leaderboard.tsx` | ✅ yes | `min-h-[100dvh]` ✅ | already fixed |
| `_authed/entries.tsx` | ✅ yes | `min-h-[100dvh]` ✅ | already fixed |
| `_authed/winners.tsx` | ✅ yes | `min-h-[100dvh]` ✅ | already fixed |
| `_authed/checkmate.tsx` (intro + game) | ❌ no | `min-h-screen` ❌ | add hook + swap (×2 wrappers, plus inner `min-h-screen` flex) |
| `_authed/wisdomdrop.tsx` (intro + game) | ❌ no | `min-h-screen` ❌ | add hook + swap (×2 wrappers, plus inner `min-h-screen` flex) |
| `login.tsx` | ❌ no | `min-h-screen` ❌ | add hook + swap |
| `verify.tsx` | ❌ no | `min-h-screen` ❌ | add hook + swap |
| `onboarding.tsx` | ❌ no | `min-h-screen` ❌ | add hook + swap |
| `renew.tsx` | ✅ yes | `min-h-screen` ❌ | swap to `min-h-[100dvh]` |
| `_authed.tsx` (loading splash) | n/a (transient) | `min-h-screen` ❌ | swap to `min-h-[100dvh]` |
| `__root.tsx` (404) | n/a | `min-h-screen` ❌ | swap to `min-h-[100dvh]` |

### What gets done

**Add `useAllowScroll()` import + call** in 5 routes: `checkmate`, `wisdomdrop`, `login`, `verify`, `onboarding`. Game pages need it for the intro screen + small viewports where the board/options + hint button overflow. Auth pages need it to handle the on-screen keyboard.

**Replace every `min-h-screen` with `min-h-[100dvh]`** across all 14 listed routes (including the inner `min-h-screen` used inside the game intro flex containers). This eliminates the mobile-chrome phantom-scroll on every short page consistently.

No CSS, hook, schema, or component-library changes. CSS lock from the previous fix already uses `overflow: visible`, so the only remaining gap was viewport units + missing hook coverage.

### Files touched (14)

- `src/routes/__root.tsx`
- `src/routes/_authed.tsx`
- `src/routes/_authed/index.tsx`
- `src/routes/_authed/profile.tsx`
- `src/routes/_authed/results.tsx`
- `src/routes/_authed/checkmate.tsx`
- `src/routes/_authed/wisdomdrop.tsx`
- `src/routes/login.tsx`
- `src/routes/verify.tsx`
- `src/routes/onboarding.tsx`
- `src/routes/renew.tsx`

(`leaderboard`, `entries`, `winners` already done — no further edits.)

