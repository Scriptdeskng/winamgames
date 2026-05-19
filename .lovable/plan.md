## Undo winners seed data

Delete only the seed batch that was inserted on 2026-05-19 at 15:51:05 UTC — 31 rows across the three settled draw weeks (Apr 20, Apr 27, May 4). The 3 earlier rows (one `position = 1` cash winner per settled week, created on each week's actual draw date) look like genuine draw output and are left untouched.

### Change

Single delete via the insert tool:

```sql
DELETE FROM winam_winners
WHERE created_at = '2026-05-19 15:51:05.312642+00';
```

This removes 31 rows. After deletion, each settled week still has its real position-1 cash winner, so the public Winners screen will show 3 weeks with 1 winner each.

### Out of scope

- `winam_draw_weeks` rows are untouched (statuses preserved).
- `winam_platform_config.winners_published_week_id` is untouched.
- No code changes.

### Verification

Re-query `winam_winners` to confirm only 3 rows remain (the position-1 cash winners from Apr 26, May 4, and May 16 timestamps).