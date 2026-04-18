CREATE TABLE public.winam_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  icon_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.winam_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active banners"
ON public.winam_banners
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE INDEX idx_winam_banners_active_order ON public.winam_banners(is_active, display_order);