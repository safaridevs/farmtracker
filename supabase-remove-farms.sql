-- Remove farm concept - simplify to single farm system
-- This removes all farm-related complexity and makes it work like the original system

-- Step 1: Drop all existing policies
DROP POLICY IF EXISTS "allow_authenticated_goats" ON goats;
DROP POLICY IF EXISTS "allow_authenticated_health" ON health_records;
DROP POLICY IF EXISTS "allow_authenticated_breeding" ON breeding_records;
DROP POLICY IF EXISTS "allow_authenticated_farms" ON farms;
DROP POLICY IF EXISTS "allow_authenticated_profiles" ON user_profiles;
DROP POLICY IF EXISTS "allow_authenticated_invitations" ON farm_invitations;
DROP POLICY IF EXISTS "allow_authenticated_logs" ON activity_logs;

-- Step 2: Remove farm_id from all tables
ALTER TABLE goats DROP COLUMN IF EXISTS farm_id;
ALTER TABLE health_records DROP COLUMN IF EXISTS farm_id;
ALTER TABLE breeding_records DROP COLUMN IF EXISTS farm_id;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS farm_id;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS role;
ALTER TABLE activity_logs DROP COLUMN IF EXISTS farm_id;

-- Step 3: Drop farm-related tables
DROP TABLE IF EXISTS farm_invitations;
DROP TABLE IF EXISTS farms;

-- Step 4: Create simple policies for single farm
CREATE POLICY "authenticated_users_goats" ON goats
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_users_health" ON health_records
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_users_breeding" ON breeding_records
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_users_profiles" ON user_profiles
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_users_logs" ON activity_logs
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);