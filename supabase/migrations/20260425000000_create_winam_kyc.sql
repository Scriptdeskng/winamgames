CREATE TABLE IF NOT EXISTS public.winam_kyc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES public.winam_players(id) NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  dob date NOT NULL,
  id_type text CHECK (id_type IN ('nin', 'bvn')) NOT NULL,
  id_number text NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  account_number text,
  bank_code text,
  bank_name text,
  account_name text,
  bank_details_submitted_at timestamptz,
  verified boolean DEFAULT false,
  verified_at timestamptz,
  verified_by uuid REFERENCES public.winam_admin_users(id),
  payment_processed boolean DEFAULT false,
  payment_processed_at timestamptz,
  payment_processed_by uuid REFERENCES public.winam_admin_users(id)
);

ALTER TABLE public.winam_kyc ENABLE ROW LEVEL SECURITY;
