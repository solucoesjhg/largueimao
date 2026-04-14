
CREATE TABLE public.conversation_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE public.conversation_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reads"
ON public.conversation_reads FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own reads"
ON public.conversation_reads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reads"
ON public.conversation_reads FOR UPDATE
USING (auth.uid() = user_id);
