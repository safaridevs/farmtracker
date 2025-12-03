-- Fix breeding_records table structure
-- Run this in your Supabase SQL editor

-- Add missing columns to breeding_records table
ALTER TABLE breeding_records ADD COLUMN IF NOT EXISTS expected_due_date DATE;

-- Update existing records to calculate due dates
UPDATE breeding_records 
SET expected_due_date = breeding_date + INTERVAL '150 days'
WHERE expected_due_date IS NULL AND breeding_date IS NOT NULL;

-- Rename due_date to expected_due_date if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'breeding_records' AND column_name = 'due_date') THEN
        -- Copy data from due_date to expected_due_date
        UPDATE breeding_records SET expected_due_date = due_date WHERE expected_due_date IS NULL;
        -- Drop the old column
        ALTER TABLE breeding_records DROP COLUMN due_date;
    END IF;
END $$;