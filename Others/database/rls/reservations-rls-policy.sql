-- Production-ready RLS policies for public.reservations table

-- Enable RLS on reservations table
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if re-running
DROP POLICY IF EXISTS "Users can view own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can delete own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Admins can manage all reservations" ON public.reservations;

-- Policy 1: Users can READ their own reservations + admins can read all
CREATE POLICY "Users can view own reservations"
ON public.reservations
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 2: Authenticated users can INSERT their own reservations
CREATE POLICY "Users can create reservations"
ON public.reservations
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
);

-- Policy 3: Users can UPDATE their own reservations (pending, confirmed, approved status)
CREATE POLICY "Users can update own reservations"
ON public.reservations
FOR UPDATE
USING (
  auth.uid() = user_id
  AND status IN ('pending', 'confirmed', 'approved')
)
WITH CHECK (
  auth.uid() = user_id
  AND status IN ('pending', 'confirmed', 'approved', 'cancelled', 'expired')
);

-- Policy 4: Users can DELETE their own pending reservations + admins can delete any
CREATE POLICY "Users can delete own reservations"
ON public.reservations
FOR DELETE
USING (
  (auth.uid() = user_id AND status = 'pending')
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 5: Admin override - admins can INSERT/UPDATE/DELETE any reservation
CREATE POLICY "Admins can manage all reservations"
ON public.reservations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Optional: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_resource_id ON public.reservations(resource_id);
CREATE INDEX IF NOT EXISTS idx_reservations_reserved_from_until ON public.reservations(reserved_from, reserved_until);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
