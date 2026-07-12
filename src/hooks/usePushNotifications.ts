import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications, Token } from "@capacitor/push-notifications";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const usePushNotifications = () => {
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return; // Web não tem push nativo dessa forma
    }

    const registerPush = async () => {
      try {
        // Verifica permissões
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.warn('Permissão de notificações negada pelo usuário.');
          return;
        }

        // Registra o aparelho na Apple/Google
        await PushNotifications.register();
      } catch (e) {
        console.error("Erro ao registrar push notifications", e);
      }
    };

    registerPush();

    // Listeners do registro
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      setPushToken(token.value);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const platform = Capacitor.getPlatform(); // 'ios', 'android' ou 'web'
          await supabase.from('device_push_tokens').upsert({
            user_id: user.id,
            token: token.value,
            platform: platform
          }, { onConflict: 'user_id, token' });
          console.log('Token salvo no Supabase com sucesso para a plataforma:', platform);
        }
      } catch (error) {
        console.error('Erro ao salvar token no Supabase:', error);
      }
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
      toast.error('Erro ao registrar push. Veja o console.');
    });

    // Listener de notificação recebida (app aberto em primeiro plano)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ', notification);
      toast.success(notification.title + " - " + notification.body);
    });

    // Listener de toque na notificação
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ', notification);
      const data = notification.notification.data;
      if (data && data.conversaId) {
        // Redireciona via window.location para forçar a navegação fora do contexto de roteador (ou se preferir, passe o navigate pro hook)
        window.location.href = `/chat/${data.conversaId}`;
      }
    });

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, []);

  return { pushToken };
};
