-- Add health fields to goats table
ALTER TABLE goats ADD COLUMN birth_date DATE;
ALTER TABLE goats ADD COLUMN weight DECIMAL(5,2);
ALTER TABLE goats ADD COLUMN health_status TEXT DEFAULT 'Healthy' CHECK (health_status IN ('Healthy', 'Sick', 'Under Treatment', 'Quarantine'));
ALTER TABLE goats ADD COLUMN notes TEXT;

-- Create health_records table
CREATE TABLE health_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goat_id UUID REFERENCES goats(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL CHECK (record_type IN ('Vaccination', 'Treatment', 'Checkup', 'Weight', 'Other')),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  next_due_date DATE,
  cost DECIMAL(10,2),
  veterinarian TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS for health_records
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

-- Health records policies
CREATE POLICY "Users can view all health records" ON health_records
  FOR SELECT USING (true);

CREATE POLICY "Users can insert health records" ON health_records
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their health records" ON health_records
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their health records" ON health_records
  FOR DELETE USING (auth.uid() = created_by);