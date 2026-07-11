-- 1. Add the column if it doesn't exist
ALTER TABLE public.itens ADD COLUMN IF NOT EXISTS visualizacoes integer DEFAULT 0;

-- 2. Create the increment function
CREATE OR REPLACE FUNCTION public.incrementar_visualizacao(item_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.itens
  SET visualizacoes = COALESCE(visualizacoes, 0) + 1
  WHERE id_it = item_id;
$$;
