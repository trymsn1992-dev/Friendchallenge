-- Migration to support challenge images

-- 1. Add image_url to challenges
ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Create bucket for challenge images (Note: Bucket creation usually handled via Dashboard/API but good to document)
-- In Supabase, you often need to create the bucket manually or via the API.
-- This SQL is for policies assuming the bucket 'challenge-images' exists.

-- Enable storage policies
-- Note: Replace 'challenge-images' with your bucket name if different.

-- Allow public read access to challenge images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'challenge-images');

-- Allow authenticated users to upload challenge images
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'challenge-images' AND auth.role() = 'authenticated'
);

-- Allow creators to delete their own images
CREATE POLICY "Creators can delete their own images" ON storage.objects FOR DELETE USING (
    bucket_id = 'challenge-images' AND (select auth.uid()) = owner
);
