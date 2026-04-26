Plan to align winner ticket IDs with the My Tickets display format:

1. Update `src/utils/draw-engine.ts`
   - Extend `LedgerRow` to include `id: string`.
   - Change `expandTickets()` so it expands tickets per ledger row instead of generating IDs from `playerId` totals.
   - Preserve the weekly cap per player while generating ticket IDs from each ledger row ID and ticket index within that row:
     ```ts
     WG-${ledgerIdWithoutDashesUppercaseFirst6}-${twoDigitIndex}
     ```
   - Keep flagged-player exclusion and deterministic winner selection behavior unchanged.

2. Update `src/utils/game.functions.ts`
   - In `autoExecuteDrawIfReady()`, update the ledger query used for `expandTickets()` from:
     ```ts
     .select("player_id, entries_delta")
     ```
     to:
     ```ts
     .select("id, player_id, entries_delta")
     ```

3. Update `src/utils/admin.functions.ts`
   - In `executeDrawWeek()`, update the ledger query used for `expandTickets()` the same way:
     ```ts
     .select("id, player_id, entries_delta")
     ```
   - Leave unrelated ledger queries unchanged, since they only calculate totals and do not feed the draw engine.

4. Verify
   - Run the project build after the edits.
   - Confirm there are no TypeScript errors from the stricter `LedgerRow` type.

No database changes. No route/UI changes. No other files beyond the requested implementation files.