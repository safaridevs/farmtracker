-- Advanced Breeding & Genealogy System with Inbreeding Prevention
-- Run this in your Supabase SQL editor

-- Enhanced goats table with genealogy
ALTER TABLE goats ADD COLUMN IF NOT EXISTS sire_id UUID REFERENCES goats(id);
ALTER TABLE goats ADD COLUMN IF NOT EXISTS dam_id UUID REFERENCES goats(id);
ALTER TABLE goats ADD COLUMN IF NOT EXISTS generation INTEGER DEFAULT 0;
ALTER TABLE goats ADD COLUMN IF NOT EXISTS inbreeding_coefficient DECIMAL(5,4) DEFAULT 0.0000;
ALTER TABLE goats ADD COLUMN IF NOT EXISTS registration_number TEXT UNIQUE;
ALTER TABLE goats ADD COLUMN IF NOT EXISTS breed TEXT;
ALTER TABLE goats ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE goats ADD COLUMN IF NOT EXISTS birth_weight DECIMAL(5,2);

-- Enhanced breeding_records table
ALTER TABLE breeding_records ADD COLUMN IF NOT EXISTS expected_due_date DATE;
ALTER TABLE breeding_records ADD COLUMN IF NOT EXISTS conception_method TEXT DEFAULT 'natural' CHECK (conception_method IN ('natural', 'artificial_insemination'));
ALTER TABLE breeding_records ADD COLUMN IF NOT EXISTS breeding_season TEXT;
ALTER TABLE breeding_records ADD COLUMN IF NOT EXISTS predicted_inbreeding_coefficient DECIMAL(5,4);
ALTER TABLE breeding_records ADD COLUMN IF NOT EXISTS breeding_approved BOOLEAN DEFAULT true;
ALTER TABLE breeding_records ADD COLUMN IF NOT EXISTS approval_notes TEXT;

-- Create offspring table to track individual kids
CREATE TABLE IF NOT EXISTS offspring (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  breeding_record_id UUID REFERENCES breeding_records(id) ON DELETE CASCADE,
  goat_id UUID REFERENCES goats(id) ON DELETE SET NULL,
  birth_order INTEGER,
  birth_weight DECIMAL(5,2),
  birth_complications TEXT,
  survival_status TEXT DEFAULT 'alive' CHECK (survival_status IN ('alive', 'deceased', 'sold', 'transferred')),
  weaning_date DATE,
  weaning_weight DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pedigree table for detailed ancestry tracking
CREATE TABLE IF NOT EXISTS pedigree (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goat_id UUID REFERENCES goats(id) ON DELETE CASCADE,
  ancestor_id UUID REFERENCES goats(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('sire', 'dam', 'paternal_grandsire', 'paternal_granddam', 'maternal_grandsire', 'maternal_granddam')),
  generation_distance INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(goat_id, ancestor_id, relationship_type)
);

-- Create breeding compatibility table
CREATE TABLE IF NOT EXISTS breeding_compatibility (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doe_id UUID REFERENCES goats(id) ON DELETE CASCADE,
  buck_id UUID REFERENCES goats(id) ON DELETE CASCADE,
  compatibility_score DECIMAL(3,2),
  inbreeding_risk TEXT CHECK (inbreeding_risk IN ('low', 'medium', 'high', 'prohibited')),
  genetic_diversity_score DECIMAL(3,2),
  recommended BOOLEAN DEFAULT true,
  notes TEXT,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(doe_id, buck_id)
);

-- Enable RLS on new tables
ALTER TABLE offspring ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedigree ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding_compatibility ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "approved_users_offspring" ON offspring
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

CREATE POLICY "approved_users_pedigree" ON pedigree
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

CREATE POLICY "approved_users_compatibility" ON breeding_compatibility
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

-- Function to calculate inbreeding coefficient
CREATE OR REPLACE FUNCTION calculate_inbreeding_coefficient(doe_id UUID, buck_id UUID)
RETURNS DECIMAL(5,4)
LANGUAGE plpgsql
AS $$
DECLARE
  common_ancestors INTEGER;
  total_paths INTEGER;
  coefficient DECIMAL(5,4) := 0.0000;
BEGIN
  -- Simple inbreeding calculation based on common ancestors within 3 generations
  SELECT COUNT(DISTINCT p1.ancestor_id)
  INTO common_ancestors
  FROM pedigree p1
  JOIN pedigree p2 ON p1.ancestor_id = p2.ancestor_id
  WHERE p1.goat_id = doe_id 
    AND p2.goat_id = buck_id
    AND p1.generation_distance <= 3
    AND p2.generation_distance <= 3;
  
  -- Calculate coefficient (simplified Wright's formula)
  IF common_ancestors > 0 THEN
    coefficient := common_ancestors * 0.0625; -- 1/16 for each common ancestor
  END IF;
  
  RETURN LEAST(coefficient, 0.5000); -- Cap at 50%
END;
$$;

-- Function to build pedigree when goat is created/updated
CREATE OR REPLACE FUNCTION build_pedigree(goat_id UUID, sire_id UUID, dam_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Clear existing pedigree
  DELETE FROM pedigree WHERE goat_id = goat_id;
  
  -- Add direct parents
  IF sire_id IS NOT NULL THEN
    INSERT INTO pedigree (goat_id, ancestor_id, relationship_type, generation_distance)
    VALUES (goat_id, sire_id, 'sire', 1);
    
    -- Add paternal grandparents
    INSERT INTO pedigree (goat_id, ancestor_id, relationship_type, generation_distance)
    SELECT goat_id, g.sire_id, 'paternal_grandsire', 2
    FROM goats g WHERE g.id = sire_id AND g.sire_id IS NOT NULL;
    
    INSERT INTO pedigree (goat_id, ancestor_id, relationship_type, generation_distance)
    SELECT goat_id, g.dam_id, 'paternal_granddam', 2
    FROM goats g WHERE g.id = sire_id AND g.dam_id IS NOT NULL;
  END IF;
  
  IF dam_id IS NOT NULL THEN
    INSERT INTO pedigree (goat_id, ancestor_id, relationship_type, generation_distance)
    VALUES (goat_id, dam_id, 'dam', 1);
    
    -- Add maternal grandparents
    INSERT INTO pedigree (goat_id, ancestor_id, relationship_type, generation_distance)
    SELECT goat_id, g.sire_id, 'maternal_grandsire', 2
    FROM goats g WHERE g.id = dam_id AND g.sire_id IS NOT NULL;
    
    INSERT INTO pedigree (goat_id, ancestor_id, relationship_type, generation_distance)
    SELECT goat_id, g.dam_id, 'maternal_granddam', 2
    FROM goats g WHERE g.id = dam_id AND g.dam_id IS NOT NULL;
  END IF;
END;
$$;

-- Function to check breeding compatibility
CREATE OR REPLACE FUNCTION check_breeding_compatibility(doe_id UUID, buck_id UUID)
RETURNS TABLE(
  compatible BOOLEAN,
  inbreeding_coefficient DECIMAL(5,4),
  risk_level TEXT,
  recommendation TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  coeff DECIMAL(5,4);
  risk TEXT;
  rec TEXT;
  compatible_result BOOLEAN;
BEGIN
  -- Calculate inbreeding coefficient
  coeff := calculate_inbreeding_coefficient(doe_id, buck_id);
  
  -- Determine risk level and recommendation
  IF coeff = 0 THEN
    risk := 'low';
    rec := 'Excellent breeding pair - no common ancestors detected';
    compatible_result := true;
  ELSIF coeff <= 0.0625 THEN -- 6.25% or less
    risk := 'low';
    rec := 'Good breeding pair - minimal inbreeding risk';
    compatible_result := true;
  ELSIF coeff <= 0.125 THEN -- 12.5% or less
    risk := 'medium';
    rec := 'Acceptable with caution - monitor offspring closely';
    compatible_result := true;
  ELSIF coeff <= 0.25 THEN -- 25% or less
    risk := 'high';
    rec := 'Not recommended - high inbreeding risk';
    compatible_result := false;
  ELSE
    risk := 'prohibited';
    rec := 'Breeding prohibited - excessive inbreeding risk';
    compatible_result := false;
  END IF;
  
  RETURN QUERY SELECT compatible_result, coeff, risk, rec;
END;
$$;

-- Function to create offspring when breeding is successful
CREATE OR REPLACE FUNCTION create_offspring(
  breeding_record_id UUID,
  kid_count INTEGER,
  birth_weights DECIMAL(5,2)[] DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  breeding_rec RECORD;
  i INTEGER;
  kid_id UUID;
  birth_weight DECIMAL(5,2);
BEGIN
  -- Get breeding record details
  SELECT * INTO breeding_rec FROM breeding_records WHERE id = breeding_record_id;
  
  -- Create offspring records
  FOR i IN 1..kid_count LOOP
    -- Generate new goat ID
    kid_id := gen_random_uuid();
    
    -- Get birth weight if provided
    IF birth_weights IS NOT NULL AND array_length(birth_weights, 1) >= i THEN
      birth_weight := birth_weights[i];
    ELSE
      birth_weight := NULL;
    END IF;
    
    -- Create goat record for kid
    INSERT INTO goats (
      id, 
      tag_number, 
      owner_name, 
      gender, 
      sire_id, 
      dam_id, 
      birth_date,
      birth_weight,
      generation,
      created_by
    ) VALUES (
      kid_id,
      'KID-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(i::TEXT, 3, '0'),
      (SELECT owner_name FROM goats WHERE id = breeding_rec.doe_id),
      'Unknown', -- Will be updated when gender is determined
      breeding_rec.buck_id,
      breeding_rec.doe_id,
      breeding_rec.actual_birth_date,
      birth_weight,
      GREATEST(
        COALESCE((SELECT generation FROM goats WHERE id = breeding_rec.buck_id), 0),
        COALESCE((SELECT generation FROM goats WHERE id = breeding_rec.doe_id), 0)
      ) + 1,
      auth.uid()
    );
    
    -- Build pedigree for the kid
    PERFORM build_pedigree(kid_id, breeding_rec.buck_id, breeding_rec.doe_id);
    
    -- Create offspring record
    INSERT INTO offspring (
      breeding_record_id,
      goat_id,
      birth_order,
      birth_weight
    ) VALUES (
      breeding_record_id,
      kid_id,
      i,
      birth_weight
    );
  END LOOP;
END;
$$;

-- Trigger to build pedigree when goat is updated
CREATE OR REPLACE FUNCTION trigger_build_pedigree()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sire_id IS DISTINCT FROM OLD.sire_id OR NEW.dam_id IS DISTINCT FROM OLD.dam_id THEN
    PERFORM build_pedigree(NEW.id, NEW.sire_id, NEW.dam_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS goat_pedigree_trigger ON goats;
CREATE TRIGGER goat_pedigree_trigger
  AFTER UPDATE ON goats
  FOR EACH ROW
  EXECUTE FUNCTION trigger_build_pedigree();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pedigree_goat_id ON pedigree(goat_id);
CREATE INDEX IF NOT EXISTS idx_pedigree_ancestor_id ON pedigree(ancestor_id);
CREATE INDEX IF NOT EXISTS idx_offspring_breeding_record ON offspring(breeding_record_id);
CREATE INDEX IF NOT EXISTS idx_goats_sire_dam ON goats(sire_id, dam_id);
CREATE INDEX IF NOT EXISTS idx_breeding_compatibility ON breeding_compatibility(doe_id, buck_id);