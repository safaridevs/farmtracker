-- Create goats table
CREATE TABLE goats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_number TEXT NOT NULL UNIQUE,
  owner_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female')),
  goat_photo_url TEXT,
  tag_photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE goats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all goats" ON goats
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own goats" ON goats
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own goats" ON goats
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own goats" ON goats
  FOR DELETE USING (auth.uid() = created_by);

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('goat-photos', 'goat-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Anyone can view goat photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'goat-photos');

CREATE POLICY "Authenticated users can upload goat photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'goat-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'goat-photos' AND auth.uid() = owner);