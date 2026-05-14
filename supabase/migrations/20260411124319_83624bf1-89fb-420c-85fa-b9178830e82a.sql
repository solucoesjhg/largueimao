-- Create perfis table
CREATE TABLE public.perfis (
  id_pe UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  usuari_pe UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_pe TEXT,
  avatar_pe TEXT,
  bio_pe TEXT,
  criado_pe TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atuali_pe TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Perfis are viewable by everyone"
  ON public.perfis FOR SELECT USING (true);

CREATE POLICY "Users can insert their own perfil"
  ON public.perfis FOR INSERT WITH CHECK (auth.uid() = usuari_pe);

CREATE POLICY "Users can update their own perfil"
  ON public.perfis FOR UPDATE USING (auth.uid() = usuari_pe);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_atuali_pe_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atuali_pe = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_perfis_atuali_pe
  BEFORE UPDATE ON public.perfis
  FOR EACH ROW EXECUTE FUNCTION public.update_atuali_pe_column();

-- Auto-create perfil on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfis (usuari_pe, nome_pe)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
