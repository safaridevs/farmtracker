-- Create farms table
CREATE TABLE farms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'worker', 'viewer')),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create farm_invitations table
CREATE TABLE farm_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'worker', 'viewer')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add farm_id to existing tables
ALTER TABLE goats ADD COLUMN farm_id UUID REFERENCES farms(id) ON DELETE CASCADE;
ALTER TABLE health_records ADD COLUMN farm_id UUID REFERENCES farms(id) ON DELETE CASCADE;
ALTER TABLE breeding_records ADD COLUMN farm_id UUID REFERENCES farms(id) ON DELETE CASCADE;

-- Enable RLS on new tables
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Farm policies
CREATE POLICY "Users can view farms they belong to" ON farms
  FOR SELECT USING (
    id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Farm owners can update their farms" ON farms
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Farm owners can delete their farms" ON farms
  FOR DELETE USING (owner_id = auth.uid());

-- User profiles policies
CREATE POLICY "Users can view profiles in their farm" ON user_profiles
  FOR SELECT USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can update profiles in their farm" ON user_profiles
  FOR UPDATE USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin') 
      AND is_active = true
    )
  );

-- Farm invitations policies
CREATE POLICY "Users can view invitations for their farm" ON farm_invitations
  FOR SELECT USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin') 
      AND is_active = true
    )
  );

CREATE POLICY "Admins can create invitations" ON farm_invitations
  FOR INSERT WITH CHECK (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin') 
      AND is_active = true
    )
  );

-- Activity logs policies
CREATE POLICY "Users can view activity logs for their farm" ON activity_logs
  FOR SELECT USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "All users can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (true);

-- Update existing table policies for multi-farm support
DROP POLICY IF EXISTS "Users can view all goats" ON goats;
DROP POLICY IF EXISTS "Users can insert their own goats" ON goats;
DROP POLICY IF EXISTS "Users can update their own goats" ON goats;
DROP POLICY IF EXISTS "Users can delete their own goats" ON goats;

CREATE POLICY "Users can view goats in their farm" ON goats
  FOR SELECT USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Workers can insert goats" ON goats
  FOR INSERT WITH CHECK (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'worker') 
      AND is_active = true
    )
  );

CREATE POLICY "Workers can update goats" ON goats
  FOR UPDATE USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'worker') 
      AND is_active = true
    )
  );

CREATE POLICY "Admins can delete goats" ON goats
  FOR DELETE USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin') 
      AND is_active = true
    )
  );

-- Function to create farm and set owner
CREATE OR REPLACE FUNCTION create_farm_and_profile(
  farm_name TEXT,
  user_full_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_farm_id UUID;
BEGIN
  -- Create farm
  INSERT INTO farms (name, owner_id)
  VALUES (farm_name, auth.uid())
  RETURNING id INTO new_farm_id;
  
  -- Create user profile as owner
  INSERT INTO user_profiles (id, full_name, role, farm_id)
  VALUES (auth.uid(), user_full_name, 'owner', new_farm_id)
  ON CONFLICT (id) DO UPDATE SET
    role = 'owner',
    farm_id = new_farm_id,
    full_name = COALESCE(user_full_name, user_profiles.full_name);
  
  RETURN new_farm_id;
END;
$$;