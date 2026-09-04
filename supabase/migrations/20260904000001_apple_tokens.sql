-- 1. Criar a tabela apple_tokens para armazenar os códigos de autorização
CREATE TABLE IF NOT EXISTS public.apple_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    auth_code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.apple_tokens ENABLE ROW LEVEL SECURITY;

-- 3. Criar política para o usuário gerenciar seus próprios tokens
DROP POLICY IF EXISTS "Users can manage their own apple tokens" ON public.apple_tokens;
CREATE POLICY "Users can manage their own apple tokens"
ON public.apple_tokens
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Adicionar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_apple_tokens_user_id ON public.apple_tokens(user_id);
