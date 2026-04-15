-- winam_otp_sessions: allow all operations for anon + authenticated
CREATE POLICY "Allow select on otp_sessions" ON public.winam_otp_sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow insert on otp_sessions" ON public.winam_otp_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update on otp_sessions" ON public.winam_otp_sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- winam_players: allow insert and update for anon + authenticated
CREATE POLICY "Allow insert on players" ON public.winam_players FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update on players" ON public.winam_players FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow select on players for anon" ON public.winam_players FOR SELECT TO anon USING (true);

-- winam_subscriptions: allow insert and update for anon + authenticated  
CREATE POLICY "Allow insert on subscriptions" ON public.winam_subscriptions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow update on subscriptions" ON public.winam_subscriptions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow select on subscriptions for anon" ON public.winam_subscriptions FOR SELECT TO anon USING (true);