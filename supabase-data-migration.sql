-- Data migration script to assign existing data to farms
-- Run this AFTER running supabase-users-extension.sql

-- Step 1: Create a default farm for existing users who have data but no farm
DO $$
DECLARE
    user_record RECORD;
    new_farm_id UUID;
BEGIN
    -- Find users who have goats but no farm profile
    FOR user_record IN 
        SELECT DISTINCT created_by as user_id
        FROM goats 
        WHERE created_by IS NOT NULL 
        AND created_by NOT IN (SELECT id FROM user_profiles)
    LOOP
        -- Create farm for this user
        INSERT INTO farms (name, owner_id)
        VALUES ('My Farm', user_record.user_id)
        RETURNING id INTO new_farm_id;
        
        -- Create user profile
        INSERT INTO user_profiles (id, full_name, role, farm_id)
        VALUES (user_record.user_id, 'Farm Owner', 'owner', new_farm_id);
        
        -- Update all goats for this user
        UPDATE goats 
        SET farm_id = new_farm_id 
        WHERE created_by = user_record.user_id AND farm_id IS NULL;
        
        -- Update health records
        UPDATE health_records 
        SET farm_id = new_farm_id 
        WHERE created_by = user_record.user_id AND farm_id IS NULL;
        
        -- Update breeding records  
        UPDATE breeding_records 
        SET farm_id = new_farm_id 
        WHERE created_by = user_record.user_id AND farm_id IS NULL;
        
        RAISE NOTICE 'Created farm % for user %', new_farm_id, user_record.user_id;
    END LOOP;
END $$;

-- Step 2: For users who already have farms, assign their data to their farm
UPDATE goats 
SET farm_id = (
    SELECT farm_id 
    FROM user_profiles 
    WHERE user_profiles.id = goats.created_by
)
WHERE farm_id IS NULL AND created_by IS NOT NULL;

UPDATE health_records 
SET farm_id = (
    SELECT farm_id 
    FROM user_profiles 
    WHERE user_profiles.id = health_records.created_by
)
WHERE farm_id IS NULL AND created_by IS NOT NULL;

UPDATE breeding_records 
SET farm_id = (
    SELECT farm_id 
    FROM user_profiles 
    WHERE user_profiles.id = breeding_records.created_by
)
WHERE farm_id IS NULL AND created_by IS NOT NULL;

-- Step 3: Clean up any orphaned data (data without created_by)
-- Assign to the first available farm or delete
DO $$
DECLARE
    first_farm_id UUID;
BEGIN
    -- Get the first farm ID
    SELECT id INTO first_farm_id FROM farms LIMIT 1;
    
    IF first_farm_id IS NOT NULL THEN
        -- Assign orphaned goats to first farm
        UPDATE goats 
        SET farm_id = first_farm_id 
        WHERE farm_id IS NULL;
        
        -- Assign orphaned health records to first farm
        UPDATE health_records 
        SET farm_id = first_farm_id 
        WHERE farm_id IS NULL;
        
        -- Assign orphaned breeding records to first farm
        UPDATE breeding_records 
        SET farm_id = first_farm_id 
        WHERE farm_id IS NULL;
        
        RAISE NOTICE 'Assigned orphaned data to farm %', first_farm_id;
    END IF;
END $$;