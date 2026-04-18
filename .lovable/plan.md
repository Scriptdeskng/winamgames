

## Plan

Update the first banner row in `winam_banners` (the one with `display_order = 1`) to draw-prize copy.

### DB update

```sql
UPDATE public.winam_banners
SET title = 'Win up to ₦50,000 this week',
    subtitle = 'Play daily, solve more puzzles, earn more draw entries'
WHERE display_order = 1;
```

Icon stays as `trophy`. No code changes — `BannerStack` renders whatever the DB returns.

### Files touched

- DB only (one UPDATE via insert tool).

