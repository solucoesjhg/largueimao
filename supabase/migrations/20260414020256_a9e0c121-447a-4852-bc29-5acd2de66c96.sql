CREATE TABLE public.leituras (
  id_le UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conver_le UUID NOT NULL REFERENCES public.conversas(id_co) ON DELETE CASCADE,
  usuari_le UUID NOT NULL,
  ultima_le TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conver_le, usuari_le)
);

ALTER TABLE public.leituras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own leituras"
ON public.leituras FOR SELECT
USING (auth.uid() = usuari_le);

CREATE POLICY "Users can upsert their own leituras"
ON public.leituras FOR INSERT
WITH CHECK (auth.uid() = usuari_le);

CREATE POLICY "Users can update their own leituras"
ON public.leituras FOR UPDATE
USING (auth.uid() = usuari_le);
