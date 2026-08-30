-- Create the user_events table for behavioral telemetry
CREATE TABLE IF NOT EXISTS public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.itens(id_it) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  session_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- Enable Row Level Security
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can only insert their own events
CREATE POLICY "Users can insert their own events" 
  ON public.user_events 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Explicitly grant insert permission (no select, update, or delete)
GRANT INSERT ON public.user_events TO authenticated;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_events_user_time ON public.user_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_events_type_item ON public.user_events(event_type, item_id);
