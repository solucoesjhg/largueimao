CREATE TABLE public.favoritos (
  id_fa UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuari_fa UUID NOT NULL,
  item_fa UUID NOT NULL REFERENCES public.itens(id_it) ON DELETE CASCADE,
  criado_fa TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (usuari_fa, item_fa)
);

ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favoritos"
  ON public.favoritos FOR SELECT
  USING (auth.uid() = usuari_fa);

CREATE POLICY "Users can add favoritos"
  ON public.favoritos FOR INSERT
  WITH CHECK (auth.uid() = usuari_fa);

CREATE POLICY "Users can remove favoritos"
  ON public.favoritos FOR DELETE
  USING (auth.uid() = usuari_fa);
