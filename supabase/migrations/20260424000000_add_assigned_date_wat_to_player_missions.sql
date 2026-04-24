ALTER TABLE public.winam_player_missions
ADD COLUMN IF NOT EXISTS assigned_date_wat date;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'winam_player_missions'
      AND column_name = 'created_at'
  ) THEN
    EXECUTE 'UPDATE public.winam_player_missions SET assigned_date_wat = created_at::date WHERE assigned_date_wat IS NULL';
  ELSE
    UPDATE public.winam_player_missions
    SET assigned_date_wat = (NOW() AT TIME ZONE 'Africa/Lagos')::date
    WHERE assigned_date_wat IS NULL;
  END IF;
END $$;
