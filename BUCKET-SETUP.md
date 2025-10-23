# 🪣 Storage Bucket Setup

If you're getting "Bucket not found" error, follow these steps:

## Method 1: Manual Creation (Recommended)

1. Go to your Supabase dashboard
2. Navigate to **Storage** in the sidebar
3. Click **"New Bucket"**
4. Fill in:
   - **Name**: `goat-photos`
   - **Public bucket**: ✅ **Checked**
   - **File size limit**: 50MB (optional)
   - **Allowed MIME types**: `image/*` (optional)
5. Click **"Create bucket"**

## Method 2: SQL Creation

If the bucket wasn't created by the SQL script, run this in SQL Editor:

```sql
-- Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('goat-photos', 'goat-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up policies
CREATE POLICY "Anyone can view goat photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'goat-photos');

CREATE POLICY "Authenticated users can upload goat photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'goat-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'goat-photos' AND auth.uid() = owner);
```

## Verify Setup

1. Go to **Storage** → **goat-photos**
2. You should see an empty bucket
3. Try uploading a test image to verify it works

## Test Upload

Once the bucket is created, your app should work. The upload function will create folders automatically:
- `goats/` - for goat photos
- `tags/` - for tag photos