

## Issue
The pre-game start screens for `/checkmate` and `/wisdomdrop` (shown before tapping "Start Game") have no back navigation. Once a session starts, `GameHeader` provides an X button, but on the start screen the user is stranded — they can only proceed forward.

## Fix
Add a back button in the top-left of the start screen on both game pages, linking to `/` (home). Use the same styling as the existing `TopBar` back button for consistency.

### Styling (matches TopBar convention)
```
h-10 w-10 rounded-xl bg-surface-1 border border-border 
flex items-center justify-center hover:border-primary/30 transition-colors
```
With `<ArrowLeft className="h-5 w-5 text-foreground" />` inside.

### Placement
Position absolutely in the top-left of the centered start screen so it sits at the top edge without disrupting the centered hero layout (icon + title + Start Game button).

## Files to update

**1. `src/routes/_authed/checkmate.tsx`** (start screen block, ~lines 47-72)
- Add a `Link to="/"` back button in the top-left of the start screen container
- Add `ArrowLeft` and `Link` imports

**2. `src/routes/_authed/wisdomdrop.tsx`** (start screen block, ~lines 34-58)
- Same change: add back button + imports

## Not changed
- In-game `GameHeader` (after Start Game) — already has the X exit button, which is intentional and correct.

