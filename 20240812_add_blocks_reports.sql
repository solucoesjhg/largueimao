-- Script para criar as tabelas de Bloqueios e Denúncias

-- 1. Tabela de Bloqueios
CREATE TABLE IF NOT EXISTS public.bloqueios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bloqueador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bloqueado_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(bloqueador_id, bloqueado_id)
);

-- Permissões RLS para Bloqueios
ALTER TABLE public.bloqueios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver seus próprios bloqueios" 
    ON public.bloqueios FOR SELECT 
    USING (auth.uid() = bloqueador_id);

CREATE POLICY "Usuários podem criar bloqueios" 
    ON public.bloqueios FOR INSERT 
    WITH CHECK (auth.uid() = bloqueador_id);

CREATE POLICY "Usuários podem remover seus bloqueios" 
    ON public.bloqueios FOR DELETE 
    USING (auth.uid() = bloqueador_id);

-- 2. Tabela de Denúncias
CREATE TABLE IF NOT EXISTS public.denuncias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    denunciante_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    denunciado_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.itens(id_it) ON DELETE CASCADE,
    motivo TEXT NOT NULL,
    detalhes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Uma denúncia deve ter um usuário alvo OU um anúncio alvo (ou ambos)
    CONSTRAINT denuncia_alvo_check CHECK (denunciado_id IS NOT NULL OR item_id IS NOT NULL)
);

-- Permissões RLS para Denúncias
ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem criar denúncias" 
    ON public.denuncias FOR INSERT 
    WITH CHECK (auth.uid() = denunciante_id);

-- Apenas administradores poderiam ver as denúncias
-- Não vamos criar POLICY de SELECT para usuários comuns, pois eles não precisam ver a lista de denúncias.

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_bloqueios_bloqueador ON public.bloqueios(bloqueador_id);
CREATE INDEX IF NOT EXISTS idx_denuncias_denunciante ON public.denuncias(denunciante_id);
