-- Schema changes to winam_player_missions
ALTER TABLE public.winam_player_missions
  DROP COLUMN IF EXISTS assigned_date_wat,
  DROP COLUMN IF EXISTS coins_awarded,
  ADD COLUMN IF NOT EXISTS progress_current integer NOT NULL DEFAULT 0;

-- Clean slate for player missions (model changed)
TRUNCATE TABLE public.winam_player_missions;

-- Unique partial index: a player can only hold one pending instance of a mission
CREATE UNIQUE INDEX IF NOT EXISTS winam_player_missions_unique_pending
  ON public.winam_player_missions (player_id, mission_id)
  WHERE status = 'pending';

-- Reseed missions
DELETE FROM public.winam_missions;

INSERT INTO public.winam_missions (title, condition_type, condition_value, reward_type, reward_amount, is_active) VALUES
  ('Solve 5 CheckMate puzzles',                'puzzles_solved', 5,  'entries', 2, true),
  ('Play WisdomDrop today',                    'game_type_mix',  1,  'entries', 1, true),
  ('Solve 3 puzzles without using any hints',  'no_hints',       1,  'entries', 1, true),
  ('Play both CheckMate and WisdomDrop',       'game_type_mix',  2,  'entries', 1, true),
  ('Achieve a 3-day streak',                   'streak_day',     3,  'entries', 1, true),
  ('Solve 10 CheckMate puzzles',               'puzzles_solved', 10, 'entries', 3, true),
  ('Complete 5 WisdomDrop questions',          'puzzles_solved', 5,  'entries', 1, true),
  ('Solve 3 puzzles in a single session',      'puzzles_solved', 3,  'entries', 1, true),
  ('Solve a puzzle without using any hints',   'no_hints',       1,  'entries', 1, true),
  ('Achieve a 5-day streak',                   'streak_day',     5,  'entries', 2, true),
  ('Solve 20 puzzles total',                   'puzzles_solved', 20, 'entries', 3, true),
  ('Achieve a 7-day streak',                   'streak_day',     7,  'entries', 3, true);