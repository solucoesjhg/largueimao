-- Create itens table
CREATE TABLE public.itens (
  id_it UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuari_it UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo_it TEXT NOT NULL,
  descri_it TEXT,
  preco_it DECIMAL(10,2) NOT NULL DEFAULT 0,
  catego_it TEXT NOT NULL DEFAULT 'outros',
  local_it TEXT,
  imagem_it TEXT,
  status_it TEXT NOT NULL DEFAULT 'active' CHECK (status_it IN ('active', 'sold', 'reserved')),
  criado_it TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atuali_it TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.itens ENABLE ROW LEVEL SECURITY;

-- Anyone can view active itens
CREATE POLICY "Anyone can view active itens"
  ON public.itens FOR SELECT USING (true);

-- Users can create their own itens
CREATE POLICY "Users can create their own itens"
  ON public.itens FOR INSERT WITH CHECK (auth.uid() = usuari_it);

-- Users can update their own itens
CREATE POLICY "Users can update their own itens"
  ON public.itens FOR UPDATE USING (auth.uid() = usuari_it);

-- Users can delete their own itens
CREATE POLICY "Users can delete their own itens"
  ON public.itens FOR DELETE USING (auth.uid() = usuari_it);

-- Timestamp trigger for atuali_it
CREATE OR REPLACE FUNCTION public.update_atuali_it_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atuali_it = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_itens_atuali_it
  BEFORE UPDATE ON public.itens
  FOR EACH ROW EXECUTE FUNCTION public.update_atuali_it_column();

-- Index for faster queries
CREATE INDEX idx_itens_status_it ON public.itens(status_it);
CREATE INDEX idx_itens_catego_it ON public.itens(catego_it);
CREATE INDEX idx_itens_usuari_it ON public.itens(usuari_it);

-- Storage bucket for item images
INSERT INTO storage.buckets (id, name, public) VALUES ('item-images', 'item-images', true);

CREATE POLICY "Item images are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'item-images');

CREATE POLICY "Authenticated users can upload item images"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'item-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own item images"
  ON storage.objects FOR UPDATE USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own item images"
  ON storage.objects FOR DELETE USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);
