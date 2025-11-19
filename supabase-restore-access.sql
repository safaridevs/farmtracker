-- Emergency restore - go back to full access for everyone
-- This will restore your data visibility immediately

-- Step 1: Drop all restrictive policies
DROP POLICY IF EXISTS "users_view_their_farm" ON farms;
DROP POLICY IF EXISTS "owners_manage_farm" ON farms;
DROP POLICY IF EXISTS "users_view_farm_team" ON user_profiles;
DROP POLICY IF EXISTS "users_manage_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admins_manage_team" ON user_profiles;
DROP POLICY IF EXISTS "users_view_farm_goats" ON goats;
DROP POLICY IF EXISTS "workers_add_goats" ON goats;
DROP POLICY IF EXISTS "workers_edit_goats" ON goats;
DROP POLICY IF EXISTS "admins_delete_goats" ON goats;
DROP POLICY IF EXISTS "users_view_farm_health" ON health_records;
DROP POLICY IF EXISTS "workers_manage_health" ON health_records;
DROP POLICY IF EXISTS "users_view_farm_breeding" ON breeding_records;
DROP POLICY IF EXISTS "workers_manage_breeding" ON breeding_records;
DROP POLICY IF EXISTS "admins_manage_invites" ON farm_invitations;
DROP POLICY IF EXISTS "users_view_farm_activity" ON activity_logs;
DROP POLICY IF EXISTS "users_log_activity" ON activity_logs;
DROP POLICY IF EXISTS "temp_owner_access_goats" ON goats;
DROP POLICY IF EXISTS "temp_owner_access_health" ON health_records;
DROP POLICY IF EXISTS "temp_owner_access_breeding" ON breeding_records;

-- Step 2: Create simple, permissive policies that work
CREATE POLICY "allow_authenticated_goats" ON goats
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_authenticated_health" ON health_records
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_authenticated_breeding" ON breeding_records
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_authenticated_farms" ON farms
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_authenticated_profiles" ON user_profiles
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_authenticated_invitations" ON farm_invitations
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_authenticated_logs" ON activity_logs
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);