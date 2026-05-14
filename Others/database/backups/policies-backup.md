[
  {
    "tablename": "reservations",
    "policyname": "Admins can manage all reservations",
    "recreate_statement": "CREATE POLICY Admins can manage all reservations ON public.reservations FOR ALL TO public USING ((EXISTS ( SELECT 1\n   FROM users\n  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1\n   FROM users\n  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text)))));"
  },
  {
    "tablename": "reservations",
    "policyname": "Users can create reservations",
    "recreate_statement": "CREATE POLICY Users can create reservations ON public.reservations FOR INSERT TO public WITH CHECK (((auth.uid() IS NOT NULL) AND (auth.uid() = user_id)));"
  },
  {
    "tablename": "reservations",
    "policyname": "Users can delete own reservations",
    "recreate_statement": "CREATE POLICY Users can delete own reservations ON public.reservations FOR SELECT TO public USING ((((auth.uid() = user_id) AND ((status)::text = 'pending'::text)) OR (EXISTS ( SELECT 1\n   FROM users\n  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text))))));"
  },
  {
    "tablename": "reservations",
    "policyname": "Users can update own reservations",
    "recreate_statement": "CREATE POLICY Users can update own reservations ON public.reservations FOR ALL TO public USING (((auth.uid() = user_id) AND ((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'approved'::character varying])::text[])))) WITH CHECK (((auth.uid() = user_id) AND ((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'approved'::character varying, 'cancelled'::character varying, 'expired'::character varying])::text[]))));"
  },
  {
    "tablename": "reservations",
    "policyname": "Users can view own reservations",
    "recreate_statement": "CREATE POLICY Users can view own reservations ON public.reservations FOR SELECT TO public USING (((auth.uid() = user_id) OR (EXISTS ( SELECT 1\n   FROM users\n  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text))))));"
  },
  {
    "tablename": "users",
    "policyname": "Users can delete own profile",
    "recreate_statement": "CREATE POLICY Users can delete own profile ON public.users FOR SELECT TO public USING ((auth.uid() = id));"
  },
  {
    "tablename": "users",
    "policyname": "Users can insert their own row",
    "recreate_statement": "CREATE POLICY Users can insert their own row ON public.users FOR INSERT TO public WITH CHECK ((auth.uid() = id));"
  },
  {
    "tablename": "users",
    "policyname": "Users can read their own row",
    "recreate_statement": "CREATE POLICY Users can read their own row ON public.users FOR SELECT TO public USING ((auth.uid() = id));"
  },
  {
    "tablename": "users",
    "policyname": "Users can update own profile",
    "recreate_statement": "CREATE POLICY Users can update own profile ON public.users FOR ALL TO public USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));"
  },
  {
    "tablename": "users",
    "policyname": "Users can view all profiles",
    "recreate_statement": "CREATE POLICY Users can view all profiles ON public.users FOR SELECT TO public USING ((auth.uid() IS NOT NULL));"
  }
]