-- Clean up and complete setup script
-- Run this to fix any partial installations and set up everything properly

-- Step 1: Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view all goats" ON goats;
DROP POLICY IF EXISTS "Users can insert their own goats" ON goats;
DROP POLICY IF EXISTS "Users can update their own goats" ON goats;
DROP POLICY IF EXISTS "Users can delete their own goats" ON goats;
DROP POLICY IF EXISTS "Users can view goats in their farm" ON goats;
DROP POLICY IF EXISTS "Workers can insert goats" ON goats;
DROP POLICY IF EXISTS "Workers can update goats" ON goats;
DROP POLICY IF EXISTS "Admins can delete goats" ON goats;
DROP POLICY IF EXISTS "Users can view goats" ON goats;
DROP POLICY IF EXISTS "Users can insert goats" ON goats;
DROP POLICY IF EXISTS "Users can update goats" ON goats;
DROP POLICY IF EXISTS "Users can delete goats" ON goats;

DROP POLICY IF EXISTS "Users can view all health records" ON health_records;
DROP POLICY IF EXISTS "Users can insert health records" ON health_records;
DROP POLICY IF EXISTS "Users can update their health records" ON health_records;
DROP POLICY IF EXISTS "Users can delete their health records" ON health_records;
DROP POLICY IF EXISTS "Users can view health records" ON health_records;
DROP POLICY IF EXISTS "Users can update health records" ON health_records;
DROP POLICY IF EXISTS "Users can delete health records" ON health_records;

DROP POLICY IF EXISTS "Users can view all breeding records" ON breeding_records;
DROP POLICY IF EXISTS "Users can insert breeding records" ON breeding_records;
DROP POLICY IF EXISTS "Users can update their breeding records" ON breeding_records;
DROP POLICY IF EXISTS "Users can delete their breeding records" ON breeding_records;
DROP POLICY IF EXISTS "Users can view breeding records" ON breeding_records;
DROP POLICY IF EXISTS "Users can update breeding records" ON breeding_records;
DROP POLICY IF EXISTS "Users can delete breeding records" ON breeding_records;

-- Drop farm-related policies
DROP POLICY IF EXISTS "Users can view farms they belong to" ON farms;
DROP POLICY IF EXISTS "Users can view their farms" ON farms;
DROP POLICY IF EXISTS "Farm owners can update their farms" ON farms;
DROP POLICY IF EXISTS "Farm owners can update farms" ON farms;
DROP POLICY IF EXISTS "Farm owners can delete their farms" ON farms;
DROP POLICY IF EXISTS "Farm owners can delete farms" ON farms;

DROP POLICY IF EXISTS "Users can view profiles in their farm" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their farm" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update team profiles" ON user_profiles;

DROP POLICY IF EXISTS "Users can view invitations for their farm" ON farm_invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON farm_invitations;
DROP POLICY IF EXISTS "Admins can manage invitations" ON farm_invitations;

DROP POLICY IF EXISTS "Users can view activity logs for their farm" ON activity_logs;
DROP POLICY IF EXISTS "Users can view farm activity" ON activity_logs;
DROP POLICY IF EXISTS "All users can insert activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can log activities" ON activity_logs;

-- Step 2: Create tables if they don't exist
CREATE TABLE IF NOT EXISTS farms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'worker', 'viewer')),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farm_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'worker', 'viewer')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add farm_id columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goats' AND column_name = 'farm_id') THEN
        ALTER TABLE goats ADD COLUMN farm_id UUID REFERENCES farms(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'health_records' AND column_name = 'farm_id') THEN
        ALTER TABLE health_records ADD COLUMN farm_id UUID REFERENCES farms(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'breeding_records' AND column_name = 'farm_id') THEN
        ALTER TABLE breeding_records ADD COLUMN farm_id UUID REFERENCES farms(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 4: Migrate existing data
DO $$
DECLARE
    user_record RECORD;
    new_farm_id UUID;
    existing_farm_id UUID;
BEGIN
    -- For each user who has created goats but doesn't have a farm
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
            
            -- Create or update user profile
            INSERT INTO user_profiles (id, full_name, role, farm_id)
            VALUES (user_record.user_id, 'Farm Owner', 'owner', new_farm_id)
            ON CONFLICT (id) DO UPDATE SET
                farm_id = new_farm_id,
                role = 'owner';
        ELSE
            new_farm_id := existing_farm_id;
        END IF;
        
        -- Update all data for this user
        UPDATE goats SET farm_id = new_farm_id WHERE created_by = user_record.user_id AND farm_id IS NULL;
        UPDATE health_records SET farm_id = new_farm_id WHERE created_by = user_record.user_id AND farm_id IS NULL;
        UPDATE breeding_records SET farm_id = new_farm_id WHERE created_by = user_record.user_id AND farm_id IS NULL;
    END LOOP;
END $$;

-- Step 5: Enable RLS
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Step 6: Create all policies fresh

-- Farm policies
CREATE POLICY "view_farms" ON farms FOR SELECT USING (
    owner_id = auth.uid() OR
    id IN (SELECT farm_id FROM user_profiles WHERE id = auth.uid() AND is_active = true)
);

CREATE POLICY "update_farms" ON farms FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "delete_farms" ON farms FOR DELETE USING (owner_id = auth.uid());

-- User profiles policies
CREATE POLICY "view_profiles" ON user_profiles FOR SELECT USING (
    id = auth.uid() OR
    farm_id IN (SELECT farm_id FROM user_profiles WHERE id = auth.uid() AND is_active = true)
);

CREATE POLICY "insert_profile" ON user_profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "admin_update_profiles" ON user_profiles FOR UPDATE USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    )
);

-- Goats policies (backward compatible)
CREATE POLICY "view_goats" ON goats FOR SELECT USING (
    farm_id IN (SELECT farm_id FROM user_profiles WHERE id = auth.uid() AND is_active = true) OR
    created_by = auth.uid() OR
    farm_id IS NULL
);

CREATE POLICY "insert_goats" ON goats FOR INSERT WITH CHECK (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'worker') AND is_active = true
    ) OR
    created_by = auth.uid()
);

CREATE POLICY "update_goats" ON goats FOR UPDATE USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'worker') AND is_active = true
    ) OR
    created_by = auth.uid()
);

CREATE POLICY "delete_goats" ON goats FOR DELETE USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    ) OR
    created_by = auth.uid()
);

-- Health records policies
CREATE POLICY "view_health" ON health_records FOR SELECT USING (
    farm_id IN (SELECT farm_id FROM user_profiles WHERE id = auth.uid() AND is_active = true) OR
    created_by = auth.uid() OR
    farm_id IS NULL
);

CREATE POLICY "insert_health" ON health_records FOR INSERT WITH CHECK (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'worker') AND is_active = true
    ) OR
    created_by = auth.uid()
);

CREATE POLICY "update_health" ON health_records FOR UPDATE USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'worker') AND is_active = true
    ) OR
    created_by = auth.uid()
);

CREATE POLICY "delete_health" ON health_records FOR DELETE USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    ) OR
    created_by = auth.uid()
);

-- Breeding records policies
CREATE POLICY "view_breeding" ON breeding_records FOR SELECT USING (
    farm_id IN (SELECT farm_id FROM user_profiles WHERE id = auth.uid() AND is_active = true) OR
    created_by = auth.uid() OR
    farm_id IS NULL
);

CREATE POLICY "insert_breeding" ON breeding_records FOR INSERT WITH CHECK (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'worker') AND is_active = true
    ) OR
    created_by = auth.uid()
);

CREATE POLICY "update_breeding" ON breeding_records FOR UPDATE USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin', 'worker') AND is_active = true
    ) OR
    created_by = auth.uid()
);

CREATE POLICY "delete_breeding" ON breeding_records FOR DELETE USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    ) OR
    created_by = auth.uid()
);

-- Farm invitations policies
CREATE POLICY "manage_invitations" ON farm_invitations FOR ALL USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('owner', 'admin') AND is_active = true
    )
);

-- Activity logs policies
CREATE POLICY "view_activity" ON activity_logs FOR SELECT USING (
    farm_id IN (SELECT farm_id FROM user_profiles WHERE id = auth.uid() AND is_active = true)
);

CREATE POLICY "log_activity" ON activity_logs FOR INSERT WITH CHECK (true);

-- Step 7: Create helper function
CREATE OR REPLACE FUNCTION get_or_create_farm_for_user()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_farm_id UUID;
  new_farm_id UUID;
BEGIN
  -- Check if user already has a farm
  SELECT farm_id INTO user_farm_id 
  FROM user_profiles 
  WHERE id = auth.uid();
  
  IF user_farm_id IS NOT NULL THEN
    RETURN user_farm_id;
  END IF;
  
  -- Create new farm
  INSERT INTO farms (name, owner_id)
  VALUES (COALESCE(auth.email(), 'User') || '''s Farm', auth.uid())
  RETURNING id INTO new_farm_id;
  
  -- Create user profile
  INSERT INTO user_profiles (id, full_name, role, farm_id)
  VALUES (auth.uid(), COALESCE(auth.email(), 'Farm Owner'), 'owner', new_farm_id)
  ON CONFLICT (id) DO UPDATE SET
    farm_id = new_farm_id,
    role = 'owner';
  
  RETURN new_farm_id;
END;
$$;