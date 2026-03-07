-- Production-ready RLS policies for public.resources table
-- Assumes role column in public.users table with values: 'student', 'faculty', 'admin'

-- Enable RLS on resources table
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if re-running
DROP POLICY IF EXISTS "Resource read access" ON public.resources;
DROP POLICY IF EXISTS "Resource admin write access" ON public.resources;
DROP POLICY IF EXISTS "Resource admin delete access" ON public.resources;

-- Policy 1: Allow all authenticated users to READ resources
-- Students and faculty can see all resources (regardless of is_active)
CREATE POLICY "Resource read access"
ON public.resources
FOR SELECT
USING (
  auth.uid() IS NOT NULL
);

-- Policy 2: Allow only ADMINS to INSERT/UPDATE resources
-- Admins can create and modify resources
CREATE POLICY "Resource admin write access"
ON public.resources
FOR UPDATE
USING (
  auth.role() = 'authenticated_user'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  auth.role() = 'authenticated_user'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy 3: Allow only ADMINS to DELETE resources
CREATE POLICY "Resource admin delete access"
ON public.resources
FOR DELETE
USING (
  auth.role() = 'authenticated_user'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy 4: Allow only ADMINS to INSERT new resources
CREATE POLICY "Resource admin insert access"
ON public.resources
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated_user'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Optional: Create an index for better query performance on active resources
CREATE INDEX IF NOT EXISTS idx_resources_is_active ON public.resources(is_active);
CREATE INDEX IF NOT EXISTS idx_resources_type_location ON public.resources(resource_type, location);
