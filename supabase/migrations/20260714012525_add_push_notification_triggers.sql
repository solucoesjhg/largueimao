-- 1. Favoritos Trigger (item_favorited)
CREATE OR REPLACE FUNCTION notify_item_favorited()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notification_events (type, payload)
  VALUES (
    'item_favorited',
    json_build_object(
      'id_fa', NEW.id_fa,
      'item_id', NEW.item_fa,
      'usuario_id', NEW.usuari_fa,
      'created_at', NEW.criado_fa
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_favorito_added
  AFTER INSERT ON public.favoritos
  FOR EACH ROW
  EXECUTE FUNCTION notify_item_favorited();


-- 2. Redução de Preço (price_dropped)
CREATE OR REPLACE FUNCTION notify_price_dropped()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only trigger if price actually decreased
  IF NEW.preco_it < OLD.preco_it THEN
    INSERT INTO public.notification_events (type, payload)
    VALUES (
      'price_dropped',
      json_build_object(
        'item_id', NEW.id_it,
        'old_price', OLD.preco_it,
        'new_price', NEW.preco_it
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_item_price_dropped
  AFTER UPDATE OF preco_it ON public.itens
  FOR EACH ROW
  EXECUTE FUNCTION notify_price_dropped();


-- 3. Reação de Mensagem (message_reaction)
CREATE OR REPLACE FUNCTION notify_message_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If reaction changed and is not null (so we don't notify when a reaction is removed)
  IF (NEW.reacao_me IS DISTINCT FROM OLD.reacao_me) AND (NEW.reacao_me IS NOT NULL) THEN
    INSERT INTO public.notification_events (type, payload)
    VALUES (
      'message_reaction',
      json_build_object(
        'message_id', NEW.id_me,
        'conversa_id', NEW.conver_me,
        'remetente_id', NEW.remete_me,
        'reaction', NEW.reacao_me
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_reaction_added
  AFTER UPDATE OF reacao_me ON public.mensagens
  FOR EACH ROW
  EXECUTE FUNCTION notify_message_reaction();


-- 4. Abandoned Chat Cron Job
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION check_abandoned_chats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notification_events (type, payload)
  SELECT DISTINCT 'abandoned_chat',
         json_build_object(
           'conversa_id', c.id_co,
           'item_id', c.item_co,
           'destinatario_id', CASE WHEN m.remete_me = c.compra_co THEN c.vended_co ELSE c.compra_co END
         )
  FROM public.mensagens m
  JOIN public.conversas c ON c.id_co = m.conver_me
  LEFT JOIN public.leituras l ON l.conver_le = c.id_co 
                              AND l.usuari_le = (CASE WHEN m.remete_me = c.compra_co THEN c.vended_co ELSE c.compra_co END)
  WHERE m.criado_me < (now() - interval '24 hours')
    AND m.criado_me >= (now() - interval '48 hours')
    AND (l.ultima_le IS NULL OR l.ultima_le < m.criado_me);
    
END;
$$;

DO $$
BEGIN
  -- Attempt to unschedule if it exists to avoid conflicts
  BEGIN
    PERFORM cron.unschedule('abandoned-chats-daily');
  EXCEPTION WHEN OTHERS THEN
    -- Ignore
  END;
  
  -- Schedule to run daily at 12:00
  PERFORM cron.schedule('abandoned-chats-daily', '0 12 * * *', 'SELECT check_abandoned_chats()');
END $$;
