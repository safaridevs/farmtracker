-- Fix owner role and data visibility
-- This ensures you can see your data as the farm owner

-- Step 1: Check and fix your user profile
DO $$
DECLARE
    current_user_id UUID;
    user_farm_id UUID;
    user_email TEXT;
BEGIN
    -- Get current user info
    current_user_id := auth.uid();
    SELECT email INTO user_email FROM auth.users WHERE id = current_user_id;
    
    -- Check if user has a profile
    SELECT farm_id INTO user_farm_id FROM user_profiles WHERE id = current_user_id;
    
    IF user_farm_id IS NULL THEN
        -- User has no profile, create farm and profile
        INSERT INTO farms (name, owner_id)
        VALUES (COALESCE(user_email, 'My Farm'), current_user_id)
        RETURNING id INTO user_farm_id;
        
        -- Create owner profile
        INSERT INTO user_profiles (id, full_name, role, farm_id, is_active)
        VALUES (current_user_id, COALESCE(user_email, 'Farm Owner'), 'owner', user_farm_id, true);
        
        -- Assign all existing data to this farm
        UPDATE goats SET farm_id = user_farm_id WHERE created_by = current_user_id;
        UPDATE health_records SET farm_id = user_farm_id WHERE created_by = current_user_id;
        UPDATE breeding_records SET farm_id = user_farm_id WHERE created_by = current_user_id;
        
        RAISE NOTICE 'Created farm % and owner profile for user %', user_farm_id, current_user_id;
    ELSE
        -- User has profile, ensure they're active and owner
        UPDATE user_profiles 
        SET role = 'owner', is_active = true 
        WHERE id = current_user_id;
        
        -- Ensure their data is assigned to their farm
        UPDATE goats SET farm_id = user_farm_id WHERE created_by = current_user_id AND farm_id IS NULL;
        UPDATE health_records SET farm_id = user_farm_id WHERE created_by = current_user_id AND farm_id IS NULL;
        UPDATE breeding_records SET farm_id = user_farm_id WHERE created_by = current_user_id AND farm_id IS NULL;
        
        RAISE NOTICE 'Updated profile for user % with farm %', current_user_id, user_farm_id;
    END IF;
END $$;

-- Step 2: Add temporary permissive policy for your user while we fix the system
CREATE POLICY "temp_owner_access_goats" ON goats
  FOR ALL USING (
    created_by = auth.uid() OR
    farm_id IN (SELECT farm_id FROM user_profiles WHERE id = auth.uid() AND is_active = true)
  ) WITH CHECK (
    created_by = auth.uid() OR
    farm_id IN (SELECT farm_id FROM user_profiles WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "temp_owner_access_health" ON health_records
  FOR ALL USING (
    created_by = auth.uid() OR
    farm_id IN (SELECT farm_id FROM user_profiles WHERE id = auth.uid() AND is_active = true)
  ) WITH CHECK (
    created_by = auth.uid() OR
    farm_id IN (SELECT farm_id FROM user_profiles WHERE id = auth.uid() AND is_active = true)
  );

CREATE POLICY "temp_owner_access_breeding" ON breeding_records
  FOR ALL USING (
    created_by = auth.uid() OR
    farm_id IN (SELECT farm_id FROM user_profiles WHERE id = auth.uid() AND is_active = true)
  ) WITH CHECK (
    created_by = auth.uid() OR
    farm_id IN (SELECT farm_id FROM user_profiles WHERE id = auth.uid() AND is_active = true)
  );