-- Direct fix - replace YOUR_EMAIL_HERE with your actual email
-- This bypasses the auth.uid() issue

-- Step 1: Find your user ID and create profile
-- REPLACE 'YOUR_EMAIL_HERE' with your actual email address
DO $$
DECLARE
    user_record RECORD;
    user_farm_id UUID;
BEGIN
    -- Find your user by email - CHANGE THIS EMAIL TO YOURS
    SELECT id, email INTO user_record 
    FROM auth.users 
    WHERE email = 'YOUR_EMAIL_HERE';  -- <-- CHANGE THIS TO YOUR EMAIL
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found. Please update the email in the script.';
    END IF;
    
    -- Check if user has a profile
    SELECT farm_id INTO user_farm_id FROM user_profiles WHERE id = user_record.id;
    
    IF user_farm_id IS NULL THEN
        -- Create farm for this user
        INSERT INTO farms (name, owner_id)
        VALUES (user_record.email || '''s Farm', user_record.id)
        RETURNING id INTO user_farm_id;
        
        -- Create owner profile
        INSERT INTO user_profiles (id, full_name, role, farm_id, is_active)
        VALUES (user_record.id, user_record.email, 'owner', user_farm_id, true);
        
        RAISE NOTICE 'Created farm % and owner profile for user %', user_farm_id, user_record.id;
    ELSE
        -- Update existing profile to owner
        UPDATE user_profiles 
        SET role = 'owner', is_active = true 
        WHERE id = user_record.id;
        
        RAISE NOTICE 'Updated profile for user % with farm %', user_record.id, user_farm_id;
    END IF;
    
    -- Assign all data created by this user to their farm
    UPDATE goats SET farm_id = user_farm_id WHERE created_by = user_record.id;
    UPDATE health_records SET farm_id = user_farm_id WHERE created_by = user_record.id;
    UPDATE breeding_records SET farm_id = user_farm_id WHERE created_by = user_record.id;
    
    RAISE NOTICE 'Assigned all data to farm % for user %', user_farm_id, user_record.email;
END $$;