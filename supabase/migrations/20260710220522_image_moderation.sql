-- Create temporary moderation bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('temp-moderation', 'temp-moderation', false);

-- Revoke direct upload permissions from the client for item-images and avatars
-- We drop the INSERT policies so only the Edge Function (using service_role) can upload.
DROP POLICY IF EXISTS "Authenticated users can upload item images to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;

-- Create auditing logs table
CREATE TABLE IF NOT EXISTS public.image_moderation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    provider TEXT NOT NULL,
    score JSONB,
    approved BOOLEAN NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on the logs table
ALTER TABLE public.image_moderation_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own moderation logs (useful for feedback if needed)
CREATE POLICY "Users can view their own moderation logs"
    ON public.image_moderation_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Note: Only service_role can insert logs (via Edge Function)
-- Since service_role bypasses RLS, we don't strictly need an INSERT policy for it.
-- We intentionally omit INSERT policy for authenticated users so they cannot forge logs.
