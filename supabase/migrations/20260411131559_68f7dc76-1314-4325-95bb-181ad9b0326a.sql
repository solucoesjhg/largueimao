-- Conversas table
CREATE TABLE public.conversas (
  id_co UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_co UUID NOT NULL REFERENCES public.itens(id_it) ON DELETE CASCADE,
  compra_co UUID NOT NULL,
  vended_co UUID NOT NULL,
  criado_co TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atuali_co TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (item_co, compra_co)
);

ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their conversas"
  ON public.conversas FOR SELECT
  USING (auth.uid() = compra_co OR auth.uid() = vended_co);

CREATE POLICY "Buyers can create conversas"
  ON public.conversas FOR INSERT
  WITH CHECK (auth.uid() = compra_co);

-- Mensagens table
CREATE TABLE public.mensagens (
  id_me UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conver_me UUID NOT NULL REFERENCES public.conversas(id_co) ON DELETE CASCADE,
  remete_me UUID NOT NULL,
  text_me TEXT NOT NULL,
  criado_me TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- Security definer function to check conversa membership
CREATE OR REPLACE FUNCTION public.is_conversa_participant(_user_id UUID, _conversa_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversas
    WHERE id_co = _conversa_id
    AND (compra_co = _user_id OR vended_co = _user_id)
  );
$$;

CREATE POLICY "Participants can view mensagens"
  ON public.mensagens FOR SELECT
  USING (public.is_conversa_participant(auth.uid(), conver_me));

CREATE POLICY "Participants can send mensagens"
  ON public.mensagens FOR INSERT
  WITH CHECK (
    auth.uid() = remete_me
    AND public.is_conversa_participant(auth.uid(), conver_me)
  );

-- Timestamp trigger for atuali_co
CREATE OR REPLACE FUNCTION public.update_atuali_co_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atuali_co = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Update timestamp trigger for conversas
CREATE TRIGGER update_conversas_atuali_co
  BEFORE UPDATE ON public.conversas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_atuali_co_column();

-- Enable realtime for mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;
