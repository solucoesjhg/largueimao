-- Fix insecure storage policy for item-images bucket

-- Drop the old overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can upload item images" ON storage.objects;

-- Create the new secure policy
-- This ensures that users can only upload files into a folder that exactly matches their user ID
CREATE POLICY "Authenticated users can upload item images to their own folder"
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'item-images' 
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
