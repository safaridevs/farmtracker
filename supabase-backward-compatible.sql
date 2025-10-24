-- Backward compatible policies that work with existing data
-- Run this instead of the complex migration

-- Drop the restrictive policies
DROP POLICY IF EXISTS "Users can view goats in their farm" ON goats;
DROP POLICY IF EXISTS "Workers can insert goats" ON goats;
DROP POLICY IF EXISTS "Workers can update goats" ON goats;
DROP POLICY IF EXISTS "Admins can delete goats" ON goats;

-- Create backward compatible policies
CREATE POLICY "Users can view goats" ON goats
  FOR SELECT USING (
    -- Either the goat belongs to their farm OR they created it (backward compatibility)
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
    OR created_by = auth.uid()
    OR farm_id IS NULL  -- Allow viewing data without farm_id
  );

CREATE POLICY "Users can insert goats" ON goats
  FOR INSERT WITH CHECK (
    -- Either they have farm permissions OR it's their own data
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'worker') 
      AND is_active = true
    )
    OR auth.uid() = created_by
    OR farm_id IS NULL
  );

CREATE POLICY "Users can update goats" ON goats
  FOR UPDATE USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'worker') 
      AND is_active = true
    )
    OR created_by = auth.uid()
    OR farm_id IS NULL
  );

CREATE POLICY "Users can delete goats" ON goats
  FOR DELETE USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin') 
      AND is_active = true
    )
    OR created_by = auth.uid()
    OR farm_id IS NULL
  );

-- Update health records policies
DROP POLICY IF EXISTS "Users can view all health records" ON health_records;
DROP POLICY IF EXISTS "Users can insert health records" ON health_records;
DROP POLICY IF EXISTS "Users can update their health records" ON health_records;
DROP POLICY IF EXISTS "Users can delete their health records" ON health_records;

CREATE POLICY "Users can view health records" ON health_records
  FOR SELECT USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
    OR created_by = auth.uid()
    OR farm_id IS NULL
  );

CREATE POLICY "Users can insert health records" ON health_records
  FOR INSERT WITH CHECK (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'worker') 
      AND is_active = true
    )
    OR auth.uid() = created_by
    OR farm_id IS NULL
  );

CREATE POLICY "Users can update health records" ON health_records
  FOR UPDATE USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'worker') 
      AND is_active = true
    )
    OR created_by = auth.uid()
    OR farm_id IS NULL
  );

CREATE POLICY "Users can delete health records" ON health_records
  FOR DELETE USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin') 
      AND is_active = true
    )
    OR created_by = auth.uid()
    OR farm_id IS NULL
  );

-- Update breeding records policies
DROP POLICY IF EXISTS "Users can view all breeding records" ON breeding_records;
DROP POLICY IF EXISTS "Users can insert breeding records" ON breeding_records;
DROP POLICY IF EXISTS "Users can update their breeding records" ON breeding_records;
DROP POLICY IF EXISTS "Users can delete their breeding records" ON breeding_records;

CREATE POLICY "Users can view breeding records" ON breeding_records
  FOR SELECT USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() AND is_active = true
    )
    OR created_by = auth.uid()
    OR farm_id IS NULL
  );

CREATE POLICY "Users can insert breeding records" ON breeding_records
  FOR INSERT WITH CHECK (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'worker') 
      AND is_active = true
    )
    OR auth.uid() = created_by
    OR farm_id IS NULL
  );

CREATE POLICY "Users can update breeding records" ON breeding_records
  FOR UPDATE USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'worker') 
      AND is_active = true
    )
    OR created_by = auth.uid()
    OR farm_id IS NULL
  );

CREATE POLICY "Users can delete breeding records" ON breeding_records
  FOR DELETE USING (
    farm_id IN (
      SELECT farm_id FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin') 
      AND is_active = true
    )
    OR created_by = auth.uid()
    OR farm_id IS NULL
  );