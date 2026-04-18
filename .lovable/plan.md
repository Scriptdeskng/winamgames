

## Plan

Add a stacked, swipeable banner carousel to the home page between `StreakRankStrip` and `DailyMissions`.

### 1. Database

New table `winam_banners` via migration:
- `id` uuid PK default `gen_random_uuid()`
- `title` text not null
- `subtitle` text not null
- `icon_url` text (nullable — we'll store a lucide icon name string here for the prototype, e.g. `"trophy"`, `"flame"`, `"book"`)
- `is_active` boolean not null default true
- `display_order` int not null default 0
- `created_at` timestamptz not null default `now()`

RLS: enable, add `SELECT` policy for `authenticated` where `is_active = true`. No insert/update/delete from clients.

Seed 3 rows via insert tool:
1. order 1 — "Draw closes Sunday" / "Play daily to maximise your entries before the draw" / `trophy`
2. order 2 — "7-day streak bonus" / "Play 7 days in a row to earn 2 extra entries per session" / `flame`
3. order 3 — "WisdomDrop is live" / "African proverbs game — earn entries across both games" / `book`

### 2. Server function

Add `getActiveBanners` to `src/utils/mission.functions.ts` (or new `banner.functions.ts`):
```ts
export const getActiveBanners = createServerFn({ method: "POST" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("winam_banners")
      .select("id, title, subtitle, icon_url, display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(3);
    if (error) return { success: false, banners: [] };
    return { success: true, banners: data ?? [] };
  });
```

### 3. New component `BannerStack`

`src/components/home/BannerStack.tsx` — handles the stacked-card swipe interaction directly (no embla-carousel; that lib doesn't give us the under-stack peek effect cleanly).

Behaviour:
- Holds an internal `order` state — array of banner indices, front-to-back. On swipe, the front card is removed and re-appended to the end (rotates the stack).
- Renders all banners absolutely positioned in a `relative` container with fixed height (~88px to match the missions empty-state card).
- Stack visuals: each card after the front is offset down by `~6px * stackIndex` and scaled `1 - 0.04 * stackIndex`, with `z-index` decreasing. Only show up to 3.
- Front card uses `framer-motion`'s `motion.div` with `drag="x"`, `dragConstraints={{ left: 0, right: 0 }}`, `dragElastic={0.7}`. On drag end, if `|offset.x| > 80` or velocity threshold exceeded, animate exit (`x: direction * 400, opacity: 0`) then call `rotate()`.
- `framer-motion` is already used widely in shadcn-style projects; verify it's installed. If not, add `framer-motion` dependency. (Will check in implementation.)

Card content:
- Container: `rounded-2xl bg-surface-1 border border-border p-4 shadow-card flex items-start gap-3`
- Left: 48×48 rounded-xl muted square holding the lucide icon (mapped from `icon_url` string: `trophy → Trophy`, `flame → Flame`, `book → BookOpen`; fallback `Sparkles`).
- Right column: title (`text-[13px] font-bold`), subtitle (`text-xs text-muted-foreground mt-1`).
- Top-right "Swipe" label (`text-[10px] text-muted-foreground absolute top-2 right-3`), hidden once `localStorage.getItem("winam_banner_swiped") === "1"`. On first successful swipe, set the flag and hide on re-render.

### 4. Wire into home page

In `src/routes/_authed/index.tsx`:
- Add `getActiveBanners` to the parallel `Promise.all` in the `useEffect`.
- Insert `<BannerStack banners={banners} />` between `<StreakRankStrip />` and `<DailyMissionsSection />`.
- If `banners.length === 0` (fetch failed or empty), the component renders `null` — carousel hidden entirely.

### 5. Files touched

- `src/routes/_authed/index.tsx` — fetch banners, render `BannerStack`
- `src/utils/mission.functions.ts` — add `getActiveBanners` server fn
- `src/components/home/BannerStack.tsx` — new file
- DB migration — create `winam_banners` table + RLS
- DB insert — seed 3 banner rows
- `package.json` — add `framer-motion` if not already present

