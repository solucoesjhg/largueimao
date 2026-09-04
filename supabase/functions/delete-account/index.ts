import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Tratamento de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } }
      }
    )

    // Autenticar o usuário chamador
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Não autorizado. Token inválido ou residual.')
    }

    const userId = user.id;

    // Cliente com Service Role para pular RLS e apagar o usuário
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // --- BLOCO APPLE SIGN IN REVOCATION ---
    try {
      const { data: appleToken } = await supabaseAdmin
        .from('apple_tokens')
        .select('auth_code')
        .eq('user_id', userId)
        .maybeSingle();

      if (appleToken?.auth_code) {
        const teamId = Deno.env.get('APPLE_TEAM_ID');
        const clientId = Deno.env.get('APPLE_CLIENT_ID');
        const keyId = Deno.env.get('APPLE_KEY_ID');
        const privateKey = Deno.env.get('APPLE_PRIVATE_KEY');

        if (teamId && clientId && keyId && privateKey) {
          // Format private key (replace \n with real newlines if it came from a single line string)
          const formattedKey = privateKey.replace(/\\n/g, '\n');
          
          const secretKey = await jose.importPKCS8(formattedKey, 'ES256');
          const clientSecret = await new jose.SignJWT({})
            .setProtectedHeader({ alg: 'ES256', kid: keyId })
            .setIssuer(teamId)
            .setIssuedAt()
            .setExpirationTime('5m')
            .setAudience('https://appleid.apple.com')
            .setSubject(clientId)
            .sign(secretKey);

          const params = new URLSearchParams();
          params.append('client_id', clientId);
          params.append('client_secret', clientSecret);
          params.append('token', appleToken.auth_code);
          params.append('token_type_hint', 'access_token');

          const response = await fetch('https://appleid.apple.com/auth/revoke', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
          });

          if (!response.ok) {
            console.warn('Apple Revocation failed:', await response.text());
          }
        }
      }
    } catch (appleErr) {
      console.error('Error during Apple Revocation:', appleErr);
      // Não interrompemos a exclusão da conta se a Apple falhar, para evitar estado zumbi.
    }
    // --- FIM BLOCO APPLE ---

    // 1. Storage: Apagar imagens do avatar (bucket 'avatars', subpasta 'userId')
    const { data: avatarFiles } = await supabaseAdmin.storage.from('avatars').list(userId)
    if (avatarFiles && avatarFiles.length > 0) {
      const paths = avatarFiles.map((x: any) => `${userId}/${x.name}`)
      await supabaseAdmin.storage.from('avatars').remove(paths)
    }

    // 2. Storage: Apagar imagens dos itens (bucket 'itens', subpasta 'userId')
    const { data: itemFiles } = await supabaseAdmin.storage.from('itens').list(userId)
    if (itemFiles && itemFiles.length > 0) {
      const paths = itemFiles.map((x: any) => `${userId}/${x.name}`)
      await supabaseAdmin.storage.from('itens').remove(paths)
    }

    // 3. Atualizar status das conversas para 'closed'
    await supabaseAdmin
      .from('conversas')
      .update({ 
        status_co: 'closed', 
        closed_reason_co: 'participant_deleted',
        closed_at_co: new Date().toISOString()
      })
      .or(`compra_co.eq.${userId},vended_co.eq.${userId}`)
      .eq('status_co', 'active')

    // 4. Limpar Favoritos que esse usuário deu em itens de terceiros
    await supabaseAdmin.from('favoritos').delete().eq('usuari_fa', userId)

    // 5. Limpar Bloqueios
    await supabaseAdmin.from('bloqueios').delete().or(`bloqueador_id.eq.${userId},bloqueado_id.eq.${userId}`)

    // 6. Deletar o usuário do auth.users (isso dispara os CASCADEs de itens, perfil, user_events)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) {
      throw deleteError
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
