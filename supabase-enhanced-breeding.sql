-- Enhanced Professional Breeding System
-- Run this in your Supabase SQL editor

-- Add breeding performance tracking
CREATE TABLE IF NOT EXISTS breeding_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goat_id UUID REFERENCES goats(id) ON DELETE CASCADE,
  total_breedings INTEGER DEFAULT 0,
  successful_breedings INTEGER DEFAULT 0,
  total_offspring INTEGER DEFAULT 0,
  average_litter_size DECIMAL(3,2),
  conception_rate DECIMAL(5,2),
  kidding_interval_days INTEGER,
  last_breeding_date DATE,
  breeding_efficiency_score DECIMAL(3,2),
  genetic_value_score DECIMAL(3,2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add heat cycle tracking for does
CREATE TABLE IF NOT EXISTS heat_cycles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doe_id UUID REFERENCES goats(id) ON DELETE CASCADE,
  heat_start_date DATE NOT NULL,
  heat_end_date DATE,
  cycle_length_days INTEGER,
  intensity TEXT CHECK (intensity IN ('weak', 'moderate', 'strong')),
  bred BOOLEAN DEFAULT false,
  breeding_record_id UUID REFERENCES breeding_records(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add pregnancy monitoring
CREATE TABLE IF NOT EXISTS pregnancy_monitoring (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  breeding_record_id UUID REFERENCES breeding_records(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,
  check_type TEXT CHECK (check_type IN ('visual', 'palpation', 'ultrasound', 'blood_test')),
  pregnancy_confirmed BOOLEAN,
  estimated_kids INTEGER,
  fetal_heartbeat_detected BOOLEAN,
  complications TEXT,
  veterinarian TEXT,
  next_check_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add kidding records (birth details)
CREATE TABLE IF NOT EXISTS kidding_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  breeding_record_id UUID REFERENCES breeding_records(id) ON DELETE CASCADE,
  kidding_date TIMESTAMP WITH TIME ZONE NOT NULL,
  kidding_type TEXT CHECK (kidding_type IN ('natural', 'assisted', 'cesarean')),
  labor_duration_minutes INTEGER,
  total_kids_born INTEGER NOT NULL,
  kids_alive INTEGER NOT NULL,
  kids_stillborn INTEGER DEFAULT 0,
  placenta_expelled BOOLEAN DEFAULT true,
  complications TEXT,
  veterinarian_present BOOLEAN DEFAULT false,
  veterinarian_name TEXT,
  dam_condition TEXT CHECK (dam_condition IN ('excellent', 'good', 'fair', 'poor', 'critical')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add genetic traits tracking
CREATE TABLE IF NOT EXISTS genetic_traits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goat_id UUID REFERENCES goats(id) ON DELETE CASCADE,
  trait_name TEXT NOT NULL,
  trait_value TEXT,
  trait_category TEXT CHECK (trait_category IN ('physical', 'production', 'temperament', 'health', 'other')),
  inheritance_pattern TEXT CHECK (inheritance_pattern IN ('dominant', 'recessive', 'codominant', 'polygenic')),
  desirability TEXT CHECK (desirability IN ('highly_desirable', 'desirable', 'neutral', 'undesirable', 'defect')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add breeding goals and plans
CREATE TABLE IF NOT EXISTS breeding_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_name TEXT NOT NULL,
  breeding_season TEXT,
  target_traits TEXT[],
  doe_ids UUID[],
  buck_ids UUID[],
  expected_breedings INTEGER,
  actual_breedings INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  goals TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add lineage analysis cache
CREATE TABLE IF NOT EXISTS lineage_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goat_id UUID REFERENCES goats(id) ON DELETE CASCADE,
  total_ancestors INTEGER,
  unique_ancestors INTEGER,
  genetic_diversity_index DECIMAL(5,4),
  most_common_ancestor_id UUID REFERENCES goats(id),
  ancestor_contribution DECIMAL(5,4),
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE breeding_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE heat_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pregnancy_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE kidding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE genetic_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineage_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for new tables
CREATE POLICY "approved_users_breeding_performance" ON breeding_performance
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

CREATE POLICY "approved_users_heat_cycles" ON heat_cycles
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

CREATE POLICY "approved_users_pregnancy_monitoring" ON pregnancy_monitoring
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

CREATE POLICY "approved_users_kidding_records" ON kidding_records
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

CREATE POLICY "approved_users_genetic_traits" ON genetic_traits
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

CREATE POLICY "approved_users_breeding_plans" ON breeding_plans
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

CREATE POLICY "approved_users_lineage_analysis" ON lineage_analysis
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

-- Function to update breeding performance
CREATE OR REPLACE FUNCTION update_breeding_performance(goat_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  total_breeds INTEGER;
  successful_breeds INTEGER;
  total_kids INTEGER;
  avg_litter DECIMAL(3,2);
  conception_pct DECIMAL(5,2);
BEGIN
  -- Calculate statistics
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'birthed'),
    COALESCE(SUM(number_of_kids), 0),
    COALESCE(AVG(number_of_kids) FILTER (WHERE number_of_kids > 0), 0)
  INTO total_breeds, successful_breeds, total_kids, avg_litter
  FROM breeding_records
  WHERE doe_id = goat_id OR buck_id = goat_id;
  
  -- Calculate conception rate
  IF total_breeds > 0 THEN
    conception_pct := (successful_breeds::DECIMAL / total_breeds) * 100;
  ELSE
    conception_pct := 0;
  END IF;
  
  -- Update or insert performance record
  INSERT INTO breeding_performance (
    goat_id,
    total_breedings,
    successful_breedings,
    total_offspring,
    average_litter_size,
    conception_rate,
    updated_at
  ) VALUES (
    goat_id,
    total_breeds,
    successful_breeds,
    total_kids,
    avg_litter,
    conception_pct,
    NOW()
  )
  ON CONFLICT (goat_id) DO UPDATE SET
    total_breedings = EXCLUDED.total_breedings,
    successful_breedings = EXCLUDED.successful_breedings,
    total_offspring = EXCLUDED.total_offspring,
    average_litter_size = EXCLUDED.average_litter_size,
    conception_rate = EXCLUDED.conception_rate,
    updated_at = NOW();
END;
$$;

-- Function to predict heat cycle
CREATE OR REPLACE FUNCTION predict_next_heat(doe_id UUID)
RETURNS DATE
LANGUAGE plpgsql
AS $$
DECLARE
  avg_cycle_length INTEGER;
  last_heat_date DATE;
  predicted_date DATE;
BEGIN
  -- Get average cycle length
  SELECT AVG(cycle_length_days)::INTEGER
  INTO avg_cycle_length
  FROM heat_cycles
  WHERE heat_cycles.doe_id = predict_next_heat.doe_id
    AND cycle_length_days IS NOT NULL;
  
  -- Default to 21 days if no history
  IF avg_cycle_length IS NULL THEN
    avg_cycle_length := 21;
  END IF;
  
  -- Get last heat date
  SELECT heat_start_date
  INTO last_heat_date
  FROM heat_cycles
  WHERE heat_cycles.doe_id = predict_next_heat.doe_id
  ORDER BY heat_start_date DESC
  LIMIT 1;
  
  IF last_heat_date IS NOT NULL THEN
    predicted_date := last_heat_date + avg_cycle_length;
  ELSE
    predicted_date := NULL;
  END IF;
  
  RETURN predicted_date;
END;
$$;

-- Function to calculate genetic diversity
CREATE OR REPLACE FUNCTION calculate_genetic_diversity(goat_id UUID)
RETURNS DECIMAL(5,4)
LANGUAGE plpgsql
AS $$
DECLARE
  total_ancestors INTEGER;
  unique_ancestors INTEGER;
  diversity_index DECIMAL(5,4);
BEGIN
  -- Count total ancestors within 4 generations
  SELECT COUNT(*)
  INTO total_ancestors
  FROM pedigree
  WHERE pedigree.goat_id = calculate_genetic_diversity.goat_id
    AND generation_distance <= 4;
  
  -- Count unique ancestors
  SELECT COUNT(DISTINCT ancestor_id)
  INTO unique_ancestors
  FROM pedigree
  WHERE pedigree.goat_id = calculate_genetic_diversity.goat_id
    AND generation_distance <= 4;
  
  -- Calculate diversity index (higher is better)
  IF total_ancestors > 0 THEN
    diversity_index := unique_ancestors::DECIMAL / total_ancestors;
  ELSE
    diversity_index := 1.0000; -- No ancestors = maximum diversity
  END IF;
  
  RETURN diversity_index;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_breeding_performance_goat ON breeding_performance(goat_id);
CREATE INDEX IF NOT EXISTS idx_heat_cycles_doe ON heat_cycles(doe_id);
CREATE INDEX IF NOT EXISTS idx_heat_cycles_date ON heat_cycles(heat_start_date);
CREATE INDEX IF NOT EXISTS idx_pregnancy_monitoring_breeding ON pregnancy_monitoring(breeding_record_id);
CREATE INDEX IF NOT EXISTS idx_kidding_records_breeding ON kidding_records(breeding_record_id);
CREATE INDEX IF NOT EXISTS idx_genetic_traits_goat ON genetic_traits(goat_id);
CREATE INDEX IF NOT EXISTS idx_lineage_analysis_goat ON lineage_analysis(goat_id);