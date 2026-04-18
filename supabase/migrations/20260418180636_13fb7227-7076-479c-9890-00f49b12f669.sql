DROP POLICY IF EXISTS "Anyone can read active banners" ON public.winam_banners;

CREATE POLICY "Public can read active banners"
ON public.winam_banners
FOR SELECT
TO anon, authenticated
USING (is_active = true);