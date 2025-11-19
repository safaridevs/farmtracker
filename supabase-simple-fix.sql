-- Simple fix to restore your data access
-- Just fixes your user profile without touching policies

-- Fix your user profile and farm assignment
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
        VALUES (COALESCE(user_email || '''s Farm', 'My Farm'), current_user_id)
        RETURNING id INTO user_farm_id;
        
        -- Create owner profile
        INSERT INTO user_profiles (id, full_name, role, farm_id, is_active)
        VALUES (current_user_id, COALESCE(user_email, 'Farm Owner'), 'owner', user_farm_id, true);
        
        RAISE NOTICE 'Created farm % and owner profile for user %', user_farm_id, current_user_id;
    ELSE
        -- User has profile, ensure they're active and owner
        UPDATE user_profiles 
        SET role = 'owner', is_active = true 
        WHERE id = current_user_id;
        
        RAISE NOTICE 'Updated profile for user % with farm %', current_user_id, user_farm_id;
    END IF;
    
    -- Assign all existing data to this user's farm
    UPDATE goats SET farm_id = user_farm_id WHERE created_by = current_user_id;
    UPDATE health_records SET farm_id = user_farm_id WHERE created_by = current_user_id;
    UPDATE breeding_records SET farm_id = user_farm_id WHERE created_by = current_user_id;
    
    RAISE NOTICE 'Assigned all data to farm %', user_farm_id;
END $$;