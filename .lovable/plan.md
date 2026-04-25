Plan to fix the 11 double-blank WisdomDrop puzzles:

1. Update existing data only
- Run UPDATE statements on `winam_wisdom_puzzles.display_text` for the 11 affected row IDs.
- No schema changes, migrations, code changes, or file edits.

2. Use confirmed answer context
- I checked the affected rows first. This table does not have `answer` or `correct_answer` columns; it has `blank`, `options`, `correct_index`, `original_proverb`, and `explanation`.
- The first blank answer is confirmed by `options[correct_index]` / `blank` for each row.
- The second blank replacement words are not stored as a separate answer column, so I will use the provided replacements, which match the row explanations and context.

3. Run these final data updates
```sql
UPDATE winam_wisdom_puzzles SET display_text = 'The ____ that rises before dawn sees what others miss' WHERE id = 'yd_eth_040';
UPDATE winam_wisdom_puzzles SET display_text = 'The ____ that flows through stone does not lose its course' WHERE id = 'yd_eth_044';
UPDATE winam_wisdom_puzzles SET display_text = 'The ____ that speaks the truth in the king''s court needs legs that are ready to run' WHERE id = 'yd_waf_015';
UPDATE winam_wisdom_puzzles SET display_text = 'The ____ that falls on dry ground teaches the farmer where not to plant' WHERE id = 'yd_waf_017';
UPDATE winam_wisdom_puzzles SET display_text = 'The ____ that heals the wound does not always remove the scar' WHERE id = 'yd_waf_027';
UPDATE winam_wisdom_puzzles SET display_text = 'The ____ that runs toward danger to prove its courage has already lost its mind' WHERE id = 'yd_waf_031';
UPDATE winam_wisdom_puzzles SET display_text = 'The ____ that burns at both ends gives twice the light and half the life' WHERE id = 'yd_waf_037';
UPDATE winam_wisdom_puzzles SET display_text = 'The ____ that watches the battlefield from the hill does not know the smell of blood' WHERE id = 'yd_waf_043';
UPDATE winam_wisdom_puzzles SET display_text = 'The ____ that is planted in anger will bear bitter fruit' WHERE id = 'yd_waf_045';
UPDATE winam_wisdom_puzzles SET display_text = 'The ____ that has been broken and mended is stronger than the one that was never tested' WHERE id = 'yd_wol_032';
UPDATE winam_wisdom_puzzles SET display_text = 'The ____ that sleeps while others work will beg while others feast' WHERE id = 'yd_wol_036';
```

4. Verify after updating
- Re-query the same 11 rows.
- Confirm each has exactly one `____` occurrence.
- Return the updated count/result summary.