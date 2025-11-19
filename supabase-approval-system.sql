-- User Approval System
-- Run this in your Supabase account

-- Add approval status to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Create pending_users table for registration requests
CREATE TABLE IF NOT EXISTS pending_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on pending_users
ALTER TABLE pending_users ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view pending users
CREATE POLICY "authenticated_view_pending" ON pending_users
  FOR SELECT TO authenticated
  USING (true);

-- Anyone can insert registration requests
CREATE POLICY "anyone_can_register" ON pending_users
  FOR INSERT TO anon
  WITH CHECK (true);

-- Only authenticated users can update (approve/reject)
CREATE POLICY "authenticated_update_pending" ON pending_users
  FOR UPDATE TO authenticated
  USING (true);

-- Update user creation function to set pending status
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, approval_status, is_active)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
    'pending',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update policies to only allow approved users
DROP POLICY IF EXISTS "authenticated_users_goats" ON goats;
CREATE POLICY "approved_users_goats" ON goats
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND approval_status = 'approved' 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND approval_status = 'approved' 
      AND is_active = true
    )
  );

-- Apply same pattern to other tables
DROP POLICY IF EXISTS "authenticated_users_health" ON health_records;
CREATE POLICY "approved_users_health" ON health_records
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND approval_status = 'approved' 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND approval_status = 'approved' 
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "authenticated_users_breeding" ON breeding_records;
CREATE POLICY "approved_users_breeding" ON breeding_records
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND approval_status = 'approved' 
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND approval_status = 'approved' 
      AND is_active = true
    )
  );

-- Function to approve user
CREATE OR REPLACE FUNCTION approve_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_profiles 
  SET 
    approval_status = 'approved',
    is_active = true,
    approved_by = auth.uid(),
    approved_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;

-- Function to reject user
CREATE OR REPLACE FUNCTION reject_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_profiles 
  SET 
    approval_status = 'rejected',
    is_active = false,
    approved_by = auth.uid(),
    approved_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$;