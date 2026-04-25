Plan to update `src/routes/_authed/wisdomdrop.tsx` only:

1. Make the active WisdomDrop game layout scroll correctly
   - Change the active game page shell to a vertical flex container with viewport-height bounds and hidden outer overflow.
   - Update the main content wrapper that contains the puzzle card, `AnswerFooter`, and hints to:
     - `min-h-0`
     - `flex-1`
     - `overflow-y-auto`
     - touch momentum scrolling via Tailwind arbitrary property: `[-webkit-overflow-scrolling:touch]`
   - Keep existing padding and spacing classes intact.

2. Auto-scroll to the Next/Continue button after the reveal animation
   - Add a `nextButtonRef` in `WisdomDropPage`.
   - Add a `React.useEffect` watching `session.feedback`.
   - When feedback becomes truthy, wait `350ms`, then call:
     ```ts
     nextButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
     ```
   - Clear the timeout on cleanup.

3. Attach the ref without changing shared components
   - Because the request limits changes to `src/routes/_authed/wisdomdrop.tsx`, wrap `AnswerFooter` in a `<div ref={nextButtonRef}>` rather than modifying `AnswerFooter.tsx`.

No game state, scoring, answer logic, or other files will be changed.