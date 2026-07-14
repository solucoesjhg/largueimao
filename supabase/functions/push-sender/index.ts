import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { ApnsPushProvider, FcmPushProvider } from "./providers.ts";

const apns = new ApnsPushProvider();
const fcm = new FcmPushProvider();

serve(async (req: Request) => {
  try {
    // Inicializa o Supabase Client com a role de Serviço (Service Role)
    // para podermos ler todas as tabelas, ignorando o RLS.
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();

    // Aceita apenas INSERTs na tabela notification_events
    if (body.type !== "INSERT" || body.table !== "notification_events") {
      return new Response("Ignored", { status: 200 });
    }

    const event = body.record;
    const eventType = event.type;
    const payload = event.payload;

    // Default recipients list
    let destinatariosIds: string[] = [];
    let notificationTitle = "Notificação";
    let notificationBody = "";
    let actionData: any = {};

    switch (eventType) {
      case "new_message": {
        const { conversa_id, remetente_id, conteudo, created_at } = payload;
        
        // Descobrir quem é o destinatário
        const { data: conversa, error: convErr } = await supabase
          .from('conversas')
          .select('vended_co, compra_co, item_co, itens(titulo_it)')
          .eq('id_co', conversa_id)
          .single();

        if (convErr || !conversa) {
          console.error("Conversa não encontrada", convErr);
          return new Response("Error", { status: 500 });
        }

        const destinatario_id = conversa.vended_co === remetente_id 
          ? conversa.compra_co 
          : conversa.vended_co;

        // Verificar se já leu a mensagem
        const { data: leitura } = await supabase
          .from('leituras')
          .select('ultima_le')
          .eq('conver_le', conversa_id)
          .eq('usuari_le', destinatario_id)
          .single();

        if (leitura && leitura.ultima_le) {
          const lidaEm = new Date(leitura.ultima_le).getTime();
          const enviadaEm = new Date(created_at).getTime();
          if (lidaEm >= enviadaEm) {
             console.log(`Mensagem já lida pelo usuário ${destinatario_id}. Abortando push.`);
             await markAsProcessed(supabase, event.id, 'completed');
             return new Response("Already read", { status: 200 });
          }
        }

        const remetenteRes = await supabase.from('perfis').select('nome_pe').eq('usuari_pe', remetente_id).single();
        const nomeRemetente = remetenteRes.data?.nome_pe || "Alguém";
        const itemData = Array.isArray(conversa.itens) ? conversa.itens[0] : conversa.itens;
        const itemName = itemData?.titulo_it || "um item";

        destinatariosIds = [destinatario_id];
        notificationTitle = nomeRemetente;
        notificationBody = conteudo.length > 50 ? conteudo.substring(0, 50) + "..." : conteudo;
        actionData = { conversaId: conversa_id, tipo: "chat" };
        break;
      }

      case "item_favorited": {
        const { item_id, usuario_id } = payload;
        // Pega os dados do item e o dono
        const { data: itemData, error: itemErr } = await supabase
          .from('itens')
          .select('usuari_it, titulo_it')
          .eq('id_it', item_id)
          .single();
          
        if (itemErr || !itemData || itemData.usuari_it === usuario_id) {
          await markAsProcessed(supabase, event.id, 'ignored');
          return new Response("Ignored", { status: 200 });
        }

        const remetenteRes = await supabase.from('perfis').select('nome_pe').eq('usuari_pe', usuario_id).single();
        const nomeRemetente = remetenteRes.data?.nome_pe || "Alguém";

        destinatariosIds = [itemData.usuari_it];
        notificationTitle = "Novo Favorito ❤️";
        notificationBody = `${nomeRemetente} favoritou seu item "${itemData.titulo_it}"!`;
        actionData = { itemId: item_id, tipo: "favorito" };
        break;
      }

      case "price_dropped": {
        const { item_id, old_price, new_price } = payload;
        
        const { data: itemData } = await supabase
          .from('itens')
          .select('titulo_it')
          .eq('id_it', item_id)
          .single();
          
        const itemName = itemData?.titulo_it || "Um item que você curtiu";
        
        // Pega quem favoritou o item
        const { data: favoritos, error: favErr } = await supabase
          .from('favoritos')
          .select('usuari_fa')
          .eq('item_fa', item_id);
          
        if (favErr || !favoritos || favoritos.length === 0) {
          await markAsProcessed(supabase, event.id, 'completed');
          return new Response("No favorites to notify", { status: 200 });
        }

        destinatariosIds = favoritos.map((f: any) => f.usuari_fa);
        notificationTitle = "Preço Reduzido! 📉";
        
        const formatPrice = (p: number) => `R$ ${Number(p).toFixed(2).replace(".", ",")}`;
        notificationBody = `O item "${itemName}" abaixou de ${formatPrice(old_price)} para ${formatPrice(new_price)}!`;
        actionData = { itemId: item_id, tipo: "preco" };
        break;
      }

      case "message_reaction": {
        const { message_id, conversa_id, remetente_id, reaction } = payload;
        
        // Descobrir o destinatario = o outro usuario da conversa
        const { data: conversa } = await supabase
          .from('conversas')
          .select('vended_co, compra_co')
          .eq('id_co', conversa_id)
          .single();
          
        if (!conversa) {
          return new Response("Error", { status: 500 });
        }

        const destinatario_id = conversa.vended_co === remetente_id 
          ? conversa.compra_co 
          : conversa.vended_co;

        const remetenteRes = await supabase.from('perfis').select('nome_pe').eq('usuari_pe', remetente_id).single();
        const nomeRemetente = remetenteRes.data?.nome_pe || "Alguém";

        destinatariosIds = [destinatario_id];
        notificationTitle = "Nova Reação";
        notificationBody = `${nomeRemetente} reagiu com ${reaction} à sua mensagem.`;
        actionData = { conversaId: conversa_id, tipo: "chat" };
        break;
      }
      
      case "abandoned_chat": {
        const { conversa_id, item_id, destinatario_id } = payload;
        
        const { data: itemData } = await supabase
          .from('itens')
          .select('titulo_it')
          .eq('id_it', item_id)
          .single();
          
        const itemName = itemData?.titulo_it || "um item";

        destinatariosIds = [destinatario_id];
        notificationTitle = "Mensagens não lidas 💬";
        notificationBody = `Você tem mensagens esperando por você sobre "${itemName}".`;
        actionData = { conversaId: conversa_id, tipo: "chat" };
        break;
      }

      default:
        await markAsProcessed(supabase, event.id, 'ignored');
        return new Response("Unknown event type", { status: 200 });
    }

    if (destinatariosIds.length === 0) {
      await markAsProcessed(supabase, event.id, 'completed');
      return new Response("No recipients", { status: 200 });
    }

    // 4. Buscar os tokens de push dos destinatários
    const { data: tokens, error: tokensErr } = await supabase
      .from('device_push_tokens')
      .select('token, platform, user_id')
      .in('user_id', destinatariosIds);

    if (tokensErr || !tokens || tokens.length === 0) {
      console.log(`Nenhum token encontrado.`);
      await markAsProcessed(supabase, event.id, 'completed');
      return new Response("No tokens", { status: 200 });
    }

    // Filtrar preferências de notificação (apenas para destinatários encontrados nos tokens)
    const usersWithTokens = [...new Set(tokens.map((t: any) => t.user_id))];
    const { data: prefs } = await supabase
      .from('perfis')
      .select('usuari_pe, push_mensagens')
      .in('usuari_pe', usersWithTokens);

    const disabledUsers = new Set(
      (prefs || []).filter((p: any) => p.push_mensagens === false).map((p: any) => p.usuari_pe)
    );

    // 5. Enviar o Push para cada aparelho
    const pushPromises = tokens.map(async (device: any) => {
      // Pula se o usuario desligou pushes
      if (disabledUsers.has(device.user_id)) return null;

      const request = {
        token: device.token,
        title: notificationTitle,
        body: notificationBody,
        data: actionData
      };

      if (device.platform === 'ios') {
        return apns.send(request);
      } else if (device.platform === 'android') {
        return fcm.send(request);
      }
      return null;
    });

    const results = await Promise.all(pushPromises);
    console.log("Push Results:", results);

    // 6. Marcar o evento como processado
    await markAsProcessed(supabase, event.id, 'completed');
    
    return new Response(JSON.stringify({ success: true, results }), { status: 200 });

  } catch (error: any) {
    console.error("Critical Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

async function markAsProcessed(supabase: any, eventId: string, status: string) {
  await supabase
    .from('notification_events')
    .update({ status, processed_at: new Date().toISOString() })
    .eq('id', eventId);
}
