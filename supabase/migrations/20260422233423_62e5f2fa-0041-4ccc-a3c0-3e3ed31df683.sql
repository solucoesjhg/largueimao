ALTER TABLE public.itens
ADD COLUMN IF NOT EXISTS fotos_it text[] NOT NULL DEFAULT '{}';