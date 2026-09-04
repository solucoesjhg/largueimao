-- 1. Modificar a tabela conversas
ALTER TABLE public.conversas
  ADD COLUMN IF NOT EXISTS status_co TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS closed_reason_co TEXT,
  ADD COLUMN IF NOT EXISTS closed_at_co TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS item_titulo_snap TEXT,
  ADD COLUMN IF NOT EXISTS item_preco_snap NUMERIC,
  ADD COLUMN IF NOT EXISTS item_categoria_snap TEXT;

-- Mudar o ON DELETE de conversas.item_co para SET NULL
ALTER TABLE public.conversas DROP CONSTRAINT IF EXISTS conversas_item_co_fkey;
ALTER TABLE public.conversas ALTER COLUMN item_co DROP NOT NULL;
ALTER TABLE public.conversas ADD CONSTRAINT conversas_item_co_fkey 
  FOREIGN KEY (item_co) REFERENCES public.itens(id_it) ON DELETE SET NULL;

-- Backfill dos snapshots para conversas existentes
UPDATE public.conversas c
SET 
  item_titulo_snap = i.titulo_it,
  item_preco_snap = i.preco_it,
  item_categoria_snap = i.catego_it
FROM public.itens i
WHERE c.item_co = i.id_it 
  AND c.item_titulo_snap IS NULL;

-- 2. Trigger para arredondar GPS nos anúncios para 2 casas decimais (~1.1km precisão)
CREATE OR REPLACE FUNCTION public.arredondar_gps_itens()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitu_it IS NOT NULL THEN
    NEW.latitu_it = ROUND(NEW.latitu_it::numeric, 2);
  END IF;
  IF NEW.longit_it IS NOT NULL THEN
    NEW.longit_it = ROUND(NEW.longit_it::numeric, 2);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Adicionar Trigger na tabela itens
DROP TRIGGER IF EXISTS trg_arredondar_gps_itens ON public.itens;
CREATE TRIGGER trg_arredondar_gps_itens
  BEFORE INSERT OR UPDATE ON public.itens
  FOR EACH ROW
  EXECUTE FUNCTION public.arredondar_gps_itens();
  
-- Arredondar os itens existentes no banco de dados para garantir privacidade retroativa
UPDATE public.itens 
SET latitu_it = ROUND(latitu_it::numeric, 2),
    longit_it = ROUND(longit_it::numeric, 2)
WHERE latitu_it IS NOT NULL AND longit_it IS NOT NULL;

-- 3. Função auxiliar para verificar existência do perfil (proteção JWT residual)
CREATE OR REPLACE FUNCTION public.is_user_active()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.perfis WHERE usuari_pe = auth.uid());
$$;

-- 4. Atualizar RLS de mensagens para impedir mensagens em conversas fechadas e usuários deletados
DROP POLICY IF EXISTS "Participants can send mensagens" ON public.mensagens;
CREATE POLICY "Participants can send mensagens"
  ON public.mensagens FOR INSERT
  WITH CHECK (
    auth.uid() = remete_me
    AND public.is_conversa_participant(auth.uid(), conver_me)
    AND public.is_user_active()
    AND (SELECT status_co FROM public.conversas WHERE id_co = conver_me) = 'active'
  );

-- Atualizar RLS de conversas (INSERT) para exigir usuário ativo
DROP POLICY IF EXISTS "Buyers can create conversas" ON public.conversas;
CREATE POLICY "Buyers can create conversas"
  ON public.conversas FOR INSERT
  WITH CHECK (auth.uid() = compra_co AND public.is_user_active());

-- Atualizar RLS de itens (INSERT, UPDATE) para exigir usuário ativo
DROP POLICY IF EXISTS "Users can create their own itens" ON public.itens;
CREATE POLICY "Users can create their own itens"
  ON public.itens FOR INSERT WITH CHECK (auth.uid() = usuari_it AND public.is_user_active());

DROP POLICY IF EXISTS "Users can update their own itens" ON public.itens;
CREATE POLICY "Users can update their own itens"
  ON public.itens FOR UPDATE USING (auth.uid() = usuari_it AND public.is_user_active());
