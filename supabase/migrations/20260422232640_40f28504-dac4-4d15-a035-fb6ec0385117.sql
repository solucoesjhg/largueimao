ALTER TABLE public.itens
ADD COLUMN IF NOT EXISTS latitu_it DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longit_it DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS idx_itens_lat_lon ON public.itens (latitu_it, longit_it);