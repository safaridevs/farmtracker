-- Add breeding fields to goats table
ALTER TABLE goats ADD COLUMN sire_id UUID REFERENCES goats(id);
ALTER TABLE goats ADD COLUMN dam_id UUID REFERENCES goats(id);
ALTER TABLE goats ADD COLUMN breeding_status TEXT DEFAULT 'Available' CHECK (breeding_status IN ('Available', 'Pregnant', 'Nursing', 'Retired'));

-- Create breeding_records table
CREATE TABLE breeding_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doe_id UUID REFERENCES goats(id) ON DELETE CASCADE,
  buck_id UUID REFERENCES goats(id) ON DELETE CASCADE,
  breeding_date DATE NOT NULL,
  expected_due_date DATE,
  actual_birth_date DATE,
  pregnancy_status TEXT DEFAULT 'Bred' CHECK (pregnancy_status IN ('Bred', 'Confirmed', 'Failed', 'Birthed')),
  number_of_kids INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create offspring table (for tracking kids)
CREATE TABLE offspring (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  breeding_record_id UUID REFERENCES breeding_records(id) ON DELETE CASCADE,
  kid_id UUID REFERENCES goats(id) ON DELETE SET NULL,
  birth_order INTEGER,
  birth_weight DECIMAL(4,2),
  gender TEXT CHECK (gender IN ('Male', 'Female')),
  status TEXT DEFAULT 'Alive' CHECK (status IN ('Alive', 'Deceased', 'Sold')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE breeding_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE offspring ENABLE ROW LEVEL SECURITY;

-- Breeding records policies
CREATE POLICY "Users can view all breeding records" ON breeding_records
  FOR SELECT USING (true);

CREATE POLICY "Users can insert breeding records" ON breeding_records
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their breeding records" ON breeding_records
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their breeding records" ON breeding_records
  FOR DELETE USING (auth.uid() = created_by);

-- Offspring policies
CREATE POLICY "Users can view all offspring" ON offspring
  FOR SELECT USING (true);

CREATE POLICY "Users can insert offspring" ON offspring
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM breeding_records 
      WHERE id = breeding_record_id 
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update offspring" ON offspring
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM breeding_records 
      WHERE id = breeding_record_id 
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete offspring" ON offspring
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM breeding_records 
      WHERE id = breeding_record_id 
      AND created_by = auth.uid()
    )
  );