-- Migration script: Consolidate all individual seat resources into ONE resource per location
-- Example: All 16 library seats -> single "Library" resource with capacity 16
--          All parking spots -> single "Parking" resource with total capacity

-- Step 1: Delete any previously created consolidated resources (Table 1, Table 2, Library, Parking created by earlier migrations)
DELETE FROM resources
WHERE resource_type IN ('library_seat', 'parking')
  AND name IN ('Library', 'Parking', 'Table 1', 'Table 2', 'Parking Lot A')
  AND created_at > NOW() - INTERVAL '24 hours';  -- Only delete recent ones to avoid accidents

-- Step 2: Reactivate all remaining seats (the original individual entries)
UPDATE resources
SET is_active = true
WHERE resource_type IN ('library_seat', 'parking');

-- Step 3: Create consolidated resources by location and type
-- One resource per location showing total capacity
INSERT INTO resources (id, resource_type, name, location, capacity, is_active, created_at)
SELECT 
  gen_random_uuid() as id,
  CASE 
    WHEN resource_type = 'library_seat' THEN 'library_seat'
    WHEN resource_type = 'parking' THEN 'parking'
    ELSE resource_type
  END as resource_type,
  CASE 
    WHEN resource_type = 'library_seat' THEN 'Library'
    WHEN resource_type = 'parking' THEN 'Parking'
    ELSE 'Resource'
  END as name,
  location,
  COUNT(*) as capacity,  -- Total number of seats/spots
  true as is_active,
  NOW() as created_at
FROM resources
WHERE is_active = true
  AND resource_type IN ('library_seat', 'parking')
GROUP BY location, resource_type;

-- Step 4: Mark old individual seat entries as inactive (hide them from display)
UPDATE resources
SET is_active = false
WHERE resource_type IN ('library_seat', 'parking')
  AND name NOT IN ('Library', 'Parking')  -- Keep only the consolidated ones active
  AND is_active = true;

-- Step 5: Verify results - show what's active
SELECT 
  name,
  resource_type,
  location,
  capacity
FROM resources
WHERE is_active = true
  AND resource_type IN ('library_seat', 'parking')
ORDER BY name, location;
