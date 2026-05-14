SELECT 
  jsonb_agg(
    jsonb_build_object(
      'schema', schemaname,
      'table', tablename,
      'policy_name', policyname,
      'type', CASE WHEN permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      'roles', roles,
      'using_clause', qual,
      'with_check_clause', with_check
    ) ORDER BY tablename, policyname
  ) AS policies
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN (
    'audit_logs',
    'occupancy_events',
    'reservations',
    'resource_usage_stats',
    'sensor_readings',
    'sensors',
    'users'
  );