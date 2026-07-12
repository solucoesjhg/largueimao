-- Migration for Push Notifications
-- Creates token storage, outbox pattern, and preferences

-- 1. Preferences in 'perfis'
ALTER TABLE public.perfis 
ADD COLUMN IF NOT EXISTS push_mensagens BOOLEAN DEFAULT true;

-- 2. Device Push Tokens Table
CREATE TABLE IF NOT EXISTS public.device_push_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE public.device_push_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for device_push_tokens
CREATE POLICY "Users can view their own tokens"
    ON public.device_push_tokens FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
    ON public.device_push_tokens FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
    ON public.device_push_tokens FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
    ON public.device_push_tokens FOR DELETE
    USING (auth.uid() = user_id);

-- 3. Notification Events Table (Outbox Pattern)
CREATE TABLE IF NOT EXISTS public.notification_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Note: notification_events is mostly used by the backend triggers/edge functions, 
-- but let's secure it.
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;
-- No policies needed for public access, as it's triggered by DB functions and read by Edge Functions (Service Role)

-- 4. Trigger on 'mensagens' table to insert into 'notification_events'
CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notification_events (type, payload)
    VALUES (
        'new_message',
        jsonb_build_object(
            'message_id', NEW.id,
            'conversa_id', NEW.conversa_id,
            'remetente_id', NEW.remetente_id,
            'conteudo', NEW.conteudo,
            'created_at', NEW.created_at
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_message_for_notification
    AFTER INSERT ON public.mensagens
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_message_notification();
