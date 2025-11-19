-- Complete Database Migration Script for New Supabase Account
-- Run this in your new Supabase project's SQL editor

-- Step 1: Create all tables with proper structure
CREATE TABLE IF NOT EXISTS goats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_number TEXT UNIQUE NOT NULL,
  owner_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female')),
  goat_photo_url TEXT,
  tag_photo_url TEXT,
  birth_date DATE,
  weight DECIMAL(5,2),
  health_status TEXT DEFAULT 'Healthy' CHECK (health_status IN ('Healthy', 'Sick', 'Under Treatment', 'Quarantine')),
  breeding_status TEXT DEFAULT 'Available' CHECK (breeding_status IN ('Available', 'Pregnant', 'Nursing', 'Retired')),
  sire_id UUID REFERENCES goats(id),
  dam_id UUID REFERENCES goats(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS health_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goat_id UUID REFERENCES goats(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vaccination', 'treatment', 'checkup', 'weight', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  next_due_date DATE,
  veterinarian TEXT,
  cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS breeding_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doe_id UUID REFERENCES goats(id) ON DELETE CASCADE NOT NULL,
  buck_id UUID REFERENCES goats(id) ON DELETE CASCADE,
  breeding_date DATE NOT NULL,
  due_date DATE,
  actual_birth_date DATE,
  status TEXT DEFAULT 'bred' CHECK (status IN ('bred', 'confirmed', 'birthed', 'failed')),
  number_of_kids INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable Row Level Security
ALTER TABLE goats ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Step 3: Create simple authentication-based policies
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

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_goats_tag_number ON goats(tag_number);
CREATE INDEX IF NOT EXISTS idx_goats_owner_name ON goats(owner_name);
CREATE INDEX IF NOT EXISTS idx_goats_gender ON goats(gender);
CREATE INDEX IF NOT EXISTS idx_goats_created_by ON goats(created_by);
CREATE INDEX IF NOT EXISTS idx_health_records_goat_id ON health_records(goat_id);
CREATE INDEX IF NOT EXISTS idx_health_records_date ON health_records(date);
CREATE INDEX IF NOT EXISTS idx_health_records_next_due_date ON health_records(next_due_date);
CREATE INDEX IF NOT EXISTS idx_breeding_records_doe_id ON breeding_records(doe_id);
CREATE INDEX IF NOT EXISTS idx_breeding_records_buck_id ON breeding_records(buck_id);
CREATE INDEX IF NOT EXISTS idx_breeding_records_due_date ON breeding_records(due_date);

-- Step 5: Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('goat-photos', 'goat-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Step 6: Create storage policies
CREATE POLICY "Anyone can view goat photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'goat-photos');

CREATE POLICY "Authenticated users can upload goat photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'goat-photos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own uploads" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'goat-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'goat-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Step 7: Create helpful functions
CREATE OR REPLACE FUNCTION calculate_due_date(breeding_date DATE)
RETURNS DATE
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT breeding_date + INTERVAL '150 days';
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Insert sample data (optional - remove if not needed)
-- This creates a sample user profile for the first authenticated user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();