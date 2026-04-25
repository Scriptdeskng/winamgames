Plan to apply the requested banner character limit changes only:

1. Update `src/routes/admin.banners.tsx`
   - Change `TITLE_MAX` from `60` to `30`.
   - Change `SUBTITLE_MAX` from `120` to `80`.
   - The existing live counters and Save-disabled logic will automatically reflect the new constants.

2. Update `src/utils/admin.functions.ts`
   - Change banner title validation from `.max(60)` to `.max(30)`.
   - Change banner subtitle validation from `.max(120)` to `.max(80)`.

3. Verify
   - Run a build/typecheck after the edits to confirm both files compile cleanly.

No other files or behavior will be changed.