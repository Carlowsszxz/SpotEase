-- Create one resource + the two door sensors (entry/exit)
-- Change the name/location/capacity + secrets to what you want.

with r as (
  insert into public.resources (resource_type, name, location, capacity, is_active)
  values ('room', 'Main Room', 'Floor 1', 20, true)
  returning id
)
insert into public.sensors
  (resource_id, sensor_identifier, sensor_type, direction, ingest_secret_hash, status)
select
  r.id,
  v.sensor_identifier,
  'ultrasonic',
  v.direction,
  crypt(v.secret, gen_salt('bf')),
  'active'
from r
cross join (values
  ('doorA_entry', 'entry', 'ENTRY_SECRET'),
  ('doorA_exit',  'exit',  'EXIT_SECRET')
) as v(sensor_identifier, direction, secret)
returning sensor_identifier, resource_id, status;