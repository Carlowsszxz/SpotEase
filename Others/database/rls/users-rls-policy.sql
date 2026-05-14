-- Production-ready RLS policies for public.users table

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if re-running
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;
DROP POLICY IF EXISTS "Users manage own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Policy 1: All authenticated users can READ all user profiles
CREATE POLICY "Users can view all profiles"
ON public.users
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy 2: Users can UPDATE only their own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);

-- Policy 3: Users can DELETE only their own profile
CREATE POLICY "Users can delete own profile"
ON public.users
FOR DELETE
USING (
  auth.uid() = id
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
