-- Create new enum with 8 tiers
CREATE TYPE public.rank_tier_new AS ENUM ('starter', 'recruit', 'sergeant', 'veteran', 'champion', 'icon', 'legend', 'immortal');

-- Drop default to allow type cast
ALTER TABLE public.winam_players ALTER COLUMN rank_tier DROP DEFAULT;

-- Migrate existing values to new enum via mapping
ALTER TABLE public.winam_players
  ALTER COLUMN rank_tier TYPE public.rank_tier_new
  USING (
    CASE rank_tier::text
      WHEN 'pawn'   THEN 'starter'
      WHEN 'knight' THEN 'recruit'
      WHEN 'bishop' THEN 'sergeant'
      WHEN 'rook'   THEN 'veteran'
      WHEN 'queen'  THEN 'champion'
      WHEN 'king'   THEN 'legend'
      ELSE 'starter'
    END
  )::public.rank_tier_new;

-- Drop old enum and rename new one
DROP TYPE public.rank_tier;
ALTER TYPE public.rank_tier_new RENAME TO rank_tier;

-- Restore default with new value
ALTER TABLE public.winam_players ALTER COLUMN rank_tier SET DEFAULT 'starter'::public.rank_tier;