Plan to apply the requested code-only banner constraints:

1. Update `src/routes/admin.banners.tsx`
   - Add local constants for `TITLE_MAX = 60` and `SUBTITLE_MAX = 120`.
   - Show live counters under the Title and Subtitle inputs in the create/edit modal, formatted like `42 / 60` and `87 / 120`.
   - Mark counters as error-colored when the value exceeds its limit.
   - Disable Save when Title is empty, Subtitle is empty, Title is over 60 characters, or Subtitle is over 120 characters.
   - Leave Icon URL behavior unchanged with no counter.

2. Update `src/utils/admin.functions.ts`
   - Tighten the `bannerFields` Zod validator from `title.max(120)` to `title.max(60)`.
   - Tighten `subtitle.max(240)` to `subtitle.max(120)`.
   - No database, migration, game logic, or unrelated admin changes.

3. Verify
   - Run the project build/typecheck after edits to confirm the stricter validation and JSX changes compile cleanly.