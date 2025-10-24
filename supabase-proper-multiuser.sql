-- Proper Multi-User System with Invitation Workflow
-- This replaces the emergency fix with secure, role-based access

-- Step 1: Clean up emergency policies
DROP POLICY IF EXISTS "allow_all_goats" ON goats;
DROP POLICY IF EXISTS "allow_all_health" ON health_records;
DROP POLICY IF EXISTS "allow_all_breeding" ON breeding_records;
DROP POLICY IF EXISTS "allow_all_farms" ON farms;
DROP POLICY IF EXISTS "allow_all_profiles" ON user_profiles;
DROP POLICY IF EXISTS "allow_all_invitations" ON farm_invitations;
DROP POLICY IF EXISTS "allow_all_logs" ON activity_logs;

-- Step 2: Ensure your existing data has proper farm assignment
DO $$
DECLARE
    user_record RECORD;
    new_farm_id UUID;
    existing_farm_id UUID;
BEGIN
    -- For each user who has goats but no farm profile
    FOR user_record IN 
        SELECT DISTINCT created_by as user_id
        FROM goats 
        WHERE created_by IS NOT NULL 
        AND created_by NOT IN (SELECT id FROM user_profiles WHERE farm_id IS NOT NULL)
    LOOP
        -- Check if user already has a farm
        SELECT farm_id INTO existing_farm_id 
        FROM user_profiles 
        WHERE id = user_record.user_id;
        
        IF existing_farm_id IS NULL THEN
            -- Create farm for this user
            INSERT INTO farms (name, owner_id)
            VALUES ('My Farm', user_record.user_id)
            RETURNING id INTO new_farm_id;
            
            -- Create user profile as owner
            INSERT INTO user_profiles (id, full_name, role, farm_id)
            VALUES (user_record.user_id, 'Farm Owner', 'owner', new_farm_id)
            ON CONFLICT (id) DO UPDATE SET
                farm_id = new_farm_id,
                role = 'owner';
        ELSE
            new_farm_id := existing_farm_id;
        END IF;
        
        -- Assign all their data to their farm
        UPDATE goats SET farm_id = new_farm_id WHERE created_by = user_record.user_id AND farm_id IS NULL;
        UPDATE health_records SET farm_id = new_farm_id WHERE created_by = user_record.user_id AND farm_id IS NULL;
        UPDATE breeding_records SET farm_id = new_farm_id WHERE created_by = user_record.user_id AND farm_id IS NULL;
    END LOOP;
END $$;

-- Step 3: Create secure, role-based policies

-- Farm policies
CREATE POLICY "users_view_their_farm" ON farms
  FOR SELECT USING (
    owner_id = auth.uid() OR
    id IN (SELECT farm_id FROM user_profiles WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "owners_manage_farm" ON farms
  FOR ALL USING (owner_id = auth.uid());

-- User profiles policies  
CREATE POLICY "users_view_farm_team" ON user_profiles
  FOR SELECT USING (
    id = auth.uid() OR
    farm_id IN (SELECT farm_id FROM user_profiles WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "users_manage_own_profile" ON user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own_profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "admins_manage_team" ON user_profiles
  FOR UPDATE USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    )
  );

-- Goats policies (secure but backward compatible)
CREATE POLICY "users_view_farm_goats" ON goats
  FOR SELECT USING (
    farm_id IN (SELECT farm_id FROM user_profiles WHERE id = auth.uid() AND is_active = true) OR
    (created_by = auth.uid() AND farm_id IS NULL) -- Backward compatibility
  );

CREATE POLICY "workers_add_goats" ON goats
  FOR INSERT WITH CHECK (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'worker') AND is_active = true
    )
  );

CREATE POLICY "workers_edit_goats" ON goats
  FOR UPDATE USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'worker') AND is_active = true
    ) OR
    (created_by = auth.uid() AND farm_id IS NULL) -- Backward compatibility
  );

CREATE POLICY "admins_delete_goats" ON goats
  FOR DELETE USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    ) OR
    (created_by = auth.uid() AND farm_id IS NULL) -- Backward compatibility
  );

-- Health records policies
CREATE POLICY "users_view_farm_health" ON health_records
  FOR SELECT USING (
    farm_id IN (SELECT farm_id FROM user_profiles WHERE id = auth.uid() AND is_active = true) OR
    (created_by = auth.uid() AND farm_id IS NULL)
  );

CREATE POLICY "workers_manage_health" ON health_records
  FOR ALL USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'worker') AND is_active = true
    ) OR
    (created_by = auth.uid() AND farm_id IS NULL)
  );

-- Breeding records policies
CREATE POLICY "users_view_farm_breeding" ON breeding_records
  FOR SELECT USING (
    farm_id IN (SELECT farm_id FROM user_profiles WHERE id = auth.uid() AND is_active = true) OR
    (created_by = auth.uid() AND farm_id IS NULL)
  );

CREATE POLICY "workers_manage_breeding" ON breeding_records
  FOR ALL USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'worker') AND is_active = true
    ) OR
    (created_by = auth.uid() AND farm_id IS NULL)
  );

-- Invitations policies
CREATE POLICY "admins_manage_invites" ON farm_invitations
  FOR ALL USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    )
  );

-- Activity logs policies
CREATE POLICY "users_view_farm_activity" ON activity_logs
  FOR SELECT USING (
    farm_id IN (SELECT farm_id FROM user_profiles WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "users_log_activity" ON activity_logs
  FOR INSERT WITH CHECK (
    farm_id IN (SELECT farm_id FROM user_profiles WHERE id = auth.uid() AND is_active = true)
  );

-- Step 4: Create invitation acceptance function
CREATE OR REPLACE FUNCTION accept_farm_invitation(invitation_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
  user_email TEXT;
BEGIN
  -- Get current user email
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  -- Find valid invitation
  SELECT * INTO invitation_record 
  FROM farm_invitations 
  WHERE email = invitation_email 
    AND email = user_email
    AND accepted_at IS NULL 
    AND expires_at > NOW()
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Create user profile with invited role
  INSERT INTO user_profiles (id, full_name, role, farm_id)
  VALUES (auth.uid(), user_email, invitation_record.role, invitation_record.farm_id)
  ON CONFLICT (id) DO UPDATE SET
    role = invitation_record.role,
    farm_id = invitation_record.farm_id,
    is_active = true;
  
  -- Mark invitation as accepted
  UPDATE farm_invitations 
  SET accepted_at = NOW() 
  WHERE id = invitation_record.id;
  
  RETURN TRUE;
END;
$$;

-- Step 5: Auto-accept invitations on login
CREATE OR REPLACE FUNCTION auto_accept_invitation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
  
  -- Try to accept any pending invitation
  PERFORM accept_farm_invitation(user_email);
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-accepting invitations
DROP TRIGGER IF EXISTS auto_accept_invitation_trigger ON user_profiles;
CREATE TRIGGER auto_accept_invitation_trigger
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_accept_invitation();