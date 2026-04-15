-- Enums
CREATE TYPE public.subscription_status AS ENUM ('active', 'grace', 'suspended', 'cancelled', 'churned');
CREATE TYPE public.rank_tier AS ENUM ('pawn', 'knight', 'bishop', 'rook', 'queen', 'king');
CREATE TYPE public.game_type AS ENUM ('checkmate', 'wisdomdrop');
CREATE TYPE public.draw_week_status AS ENUM ('open', 'locked', 'drawn', 'settled');
CREATE TYPE public.puzzle_result AS ENUM ('correct', 'incorrect', 'hint_used', 'timeout');
CREATE TYPE public.mission_condition_type AS ENUM ('puzzles_solved', 'no_hints', 'streak_day', 'game_type_mix');
CREATE TYPE public.reward_type AS ENUM ('coins', 'entries');
CREATE TYPE public.mission_status AS ENUM ('pending', 'completed', 'expired');
CREATE TYPE public.entry_source_type AS ENUM ('game_session', 'mission', 'streak_bonus');
CREATE TYPE public.subscription_plan AS ENUM ('daily', 'weekly');

-- winam_players
CREATE TABLE public.winam_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  msisdn_hash TEXT NOT NULL UNIQUE,
  msisdn_last4 TEXT NOT NULL,
  nickname TEXT,
  avatar_id INT DEFAULT 0,
  rank_tier public.rank_tier NOT NULL DEFAULT 'pawn',
  xp_total INT NOT NULL DEFAULT 0,
  coin_balance INT NOT NULL DEFAULT 0,
  current_streak INT NOT NULL DEFAULT 0,
  last_session_date DATE,
  device_fingerprint TEXT,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.winam_players ENABLE ROW LEVEL SECURITY;

-- winam_otp_sessions
CREATE TABLE public.winam_otp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  msisdn_hash TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.winam_otp_sessions ENABLE ROW LEVEL SECURITY;

-- winam_subscriptions
CREATE TABLE public.winam_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.winam_players(id) ON DELETE CASCADE,
  plan public.subscription_plan NOT NULL DEFAULT 'daily',
  status public.subscription_status NOT NULL DEFAULT 'active',
  grace_until TIMESTAMPTZ,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  last_billed_at TIMESTAMPTZ,
  carrier_ref TEXT
);
ALTER TABLE public.winam_subscriptions ENABLE ROW LEVEL SECURITY;

-- winam_draw_weeks
CREATE TABLE public.winam_draw_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start_wat DATE NOT NULL,
  week_end_wat DATE NOT NULL,
  draw_executes_at TIMESTAMPTZ NOT NULL,
  entry_lock_at TIMESTAMPTZ NOT NULL,
  status public.draw_week_status NOT NULL DEFAULT 'open',
  draw_seed TEXT,
  total_entries INT NOT NULL DEFAULT 0
);
ALTER TABLE public.winam_draw_weeks ENABLE ROW LEVEL SECURITY;

-- winam_game_sessions
CREATE TABLE public.winam_game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.winam_players(id) ON DELETE CASCADE,
  draw_week_id UUID NOT NULL REFERENCES public.winam_draw_weeks(id),
  game_type public.game_type NOT NULL,
  puzzles_solved INT NOT NULL DEFAULT 0,
  hints_used INT NOT NULL DEFAULT 0,
  net_puzzles INT NOT NULL DEFAULT 0,
  duration_seconds INT NOT NULL DEFAULT 0,
  entries_awarded INT NOT NULL DEFAULT 0,
  coins_awarded INT NOT NULL DEFAULT 0,
  is_free_session BOOLEAN NOT NULL DEFAULT false,
  session_date_wat DATE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.winam_game_sessions ENABLE ROW LEVEL SECURITY;

-- winam_puzzle_attempts
CREATE TABLE public.winam_puzzle_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.winam_game_sessions(id) ON DELETE CASCADE,
  puzzle_id TEXT NOT NULL,
  moves_submitted TEXT[] NOT NULL DEFAULT '{}',
  result public.puzzle_result NOT NULL,
  time_to_solve_ms INT NOT NULL DEFAULT 0,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.winam_puzzle_attempts ENABLE ROW LEVEL SECURITY;

-- winam_missions
CREATE TABLE public.winam_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  game_type public.game_type,
  condition_type public.mission_condition_type NOT NULL,
  condition_value INT NOT NULL,
  reward_type public.reward_type NOT NULL,
  reward_amount INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.winam_missions ENABLE ROW LEVEL SECURITY;

-- winam_player_missions
CREATE TABLE public.winam_player_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.winam_players(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.winam_missions(id),
  draw_week_id UUID NOT NULL REFERENCES public.winam_draw_weeks(id),
  assigned_date_wat DATE NOT NULL,
  status public.mission_status NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  entries_awarded INT NOT NULL DEFAULT 0,
  coins_awarded INT NOT NULL DEFAULT 0
);
ALTER TABLE public.winam_player_missions ENABLE ROW LEVEL SECURITY;

-- winam_entry_ledger
CREATE TABLE public.winam_entry_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.winam_players(id) ON DELETE CASCADE,
  draw_week_id UUID NOT NULL REFERENCES public.winam_draw_weeks(id),
  source_type public.entry_source_type NOT NULL,
  source_id UUID,
  entries_delta INT NOT NULL DEFAULT 0,
  week_total_after INT NOT NULL DEFAULT 0,
  cap_overflow INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.winam_entry_ledger ENABLE ROW LEVEL SECURITY;

-- winam_platform_config
CREATE TABLE public.winam_platform_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.winam_platform_config ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES =====

CREATE POLICY "Players can read own data" ON public.winam_players
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Players read own subscriptions" ON public.winam_subscriptions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can read draw weeks" ON public.winam_draw_weeks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Players read own sessions" ON public.winam_game_sessions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Players read own attempts" ON public.winam_puzzle_attempts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can read active missions" ON public.winam_missions
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Players read own missions" ON public.winam_player_missions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Players read own entries" ON public.winam_entry_ledger
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can read config" ON public.winam_platform_config
  FOR SELECT TO authenticated USING (true);

-- ===== REVOKE dangerous operations =====
REVOKE UPDATE, DELETE ON public.winam_entry_ledger FROM authenticated, anon;
REVOKE UPDATE, DELETE ON public.winam_game_sessions FROM authenticated, anon;
REVOKE INSERT, UPDATE ON public.winam_draw_weeks FROM authenticated, anon;
REVOKE ALL ON public.winam_otp_sessions FROM authenticated, anon;

-- ===== SEED platform_config =====
INSERT INTO public.winam_platform_config (key, value, updated_by) VALUES
  ('base_N', '5'::jsonb, 'system'),
  ('weekly_cap', '50'::jsonb, 'system'),
  ('hint_penalty', '1'::jsonb, 'system'),
  ('puzzle_weight_checkmate', '1.0'::jsonb, 'system'),
  ('puzzle_weight_wisdomdrop', '1.0'::jsonb, 'system'),
  ('free_session_mode', '{"enabled": false, "sessions_per_day": 1, "entry_eligible": true, "activation_reason": "", "activated_at": null, "activated_by": null}'::jsonb, 'system');

-- ===== INDEXES =====
CREATE INDEX idx_players_msisdn_hash ON public.winam_players(msisdn_hash);
CREATE INDEX idx_otp_msisdn_hash ON public.winam_otp_sessions(msisdn_hash);
CREATE INDEX idx_subscriptions_player ON public.winam_subscriptions(player_id);
CREATE INDEX idx_game_sessions_player ON public.winam_game_sessions(player_id);
CREATE INDEX idx_game_sessions_draw_week ON public.winam_game_sessions(draw_week_id);
CREATE INDEX idx_entry_ledger_player_week ON public.winam_entry_ledger(player_id, draw_week_id);
CREATE INDEX idx_player_missions_player ON public.winam_player_missions(player_id);
CREATE INDEX idx_puzzle_attempts_session ON public.winam_puzzle_attempts(session_id);