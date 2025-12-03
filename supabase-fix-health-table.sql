-- Fix health_records table structure
-- Run this in your Supabase SQL editor

-- Add missing columns to health_records table
ALTER TABLE health_records ADD COLUMN IF NOT EXISTS record_type TEXT;

-- Update existing records to use 'type' value for 'record_type' if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'health_records' AND column_name = 'type') THEN
        UPDATE health_records SET record_type = type WHERE record_type IS NULL;
    END IF;
END $$;

-- Set default record_type for any remaining NULL values
UPDATE health_records SET record_type = 'checkup' WHERE record_type IS NULL;

-- Add constraint to record_type
ALTER TABLE health_records ADD CONSTRAINT health_records_record_type_check 
CHECK (record_type IN ('vaccination', 'treatment', 'checkup', 'weight', 'other'));