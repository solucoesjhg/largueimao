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
    if (event.type !== "new_message") {
      return new Response("Unknown event type", { status: 200 });
    }

    const payload = event.payload;
    const { conversa_id, remetente_id, conteudo, created_at } = payload;

    // 1. Descobrir quem é o destinatário (o "outro" usuário da conversa)
    const { data: conversa, error: convErr } = await supabase
      .from('conversas')
      .select('usuario_vendedor_id, usuario_comprador_id, item_id, itens(titulo)')
      .eq('id', conversa_id)
      .single();

    if (convErr || !conversa) {
      console.error("Conversa não encontrada", convErr);
      return new Response("Error", { status: 500 });
    }

    const destinatario_id = conversa.usuario_vendedor_id === remetente_id 
      ? conversa.usuario_comprador_id 
      : conversa.usuario_vendedor_id;

    // 2. Verificar preferências do destinatário e pegar o nome do remetente
    const [destinatarioRes, remetenteRes] = await Promise.all([
      supabase.from('perfis').select('push_mensagens').eq('usuari_pe', destinatario_id).single(),
      supabase.from('perfis').select('nome_pe').eq('usuari_pe', remetente_id).single()
    ]);

    const querPush = destinatarioRes.data?.push_mensagens !== false; // Se for null (sem registro), assume true
    const nomeRemetente = remetenteRes.data?.nome_pe || "Alguém";

    if (!querPush) {
      console.log(`Usuário ${destinatario_id} desativou as notificações.`);
      await markAsProcessed(supabase, event.id, 'completed');
      return new Response("User disabled push", { status: 200 });
    }

    // 3. Verificar se o destinatário JÁ LEU a mensagem (tela de chat aberta)
    // Se a ultima_le >= created_at da mensagem, significa que ele viu na hora.
    const { data: leitura } = await supabase
      .from('leituras')
      .select('ultima_le')
      .eq('conversa_id', conversa_id)
      .eq('usuario_id', destinatario_id)
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

    // 4. Buscar os tokens de push do destinatário
    const { data: tokens, error: tokensErr } = await supabase
      .from('device_push_tokens')
      .select('token, platform')
      .eq('user_id', destinatario_id);

    if (tokensErr || !tokens || tokens.length === 0) {
      console.log(`Nenhum token encontrado para o usuário ${destinatario_id}`);
      await markAsProcessed(supabase, event.id, 'completed');
      return new Response("No tokens", { status: 200 });
    }

    // 5. Enviar o Push para cada aparelho
    // Pode ser que o usuário tenha um iPad, um iPhone e um Android!
    const itemName = conversa.itens?.[0]?.titulo || "um item";
    const title = `${nomeRemetente}`;
    const bodyText = conteudo.length > 50 ? conteudo.substring(0, 50) + "..." : conteudo;

    const pushPromises = tokens.map(async (device: any) => {
      const request = {
        token: device.token,
        title: title,
        body: bodyText,
        data: {
          conversaId: conversa_id,
          tipo: "chat"
        }
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
