import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications, Token } from "@capacitor/push-notifications";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import { useUnreadChats } from "./useUnreadChats";
import { useNavigate } from "react-router-dom";

export const usePushNotifications = () => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const { data: hasUnread } = useUnreadChats();
  const navigate = useNavigate();

  useEffect(() => {
    if (Capacitor.isNativePlatform() && hasUnread === false) {
      PushNotifications.removeAllDeliveredNotifications().catch(console.error);
    }
  }, [hasUnread]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return; // Web não tem push nativo dessa forma
    }

    const registerPush = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.warn('Permissão de notificações negada pelo usuário.');
          return;
        }

        await PushNotifications.register();
      } catch (e) {
        console.error("Erro ao registrar push notifications", e);
      }
    };

    registerPush();

    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      setPushToken(token.value);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const platform = Capacitor.getPlatform();
          await supabase.from('device_push_tokens').upsert({
            user_id: user.id,
            token: token.value,
            platform: platform
          }, { onConflict: 'user_id, token' });
        }
      } catch (error) {
        console.error('Erro ao salvar token no Supabase:', error);
      }
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
      toast.error('Erro ao registrar push. Veja o console.');
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ', notification);
      toast(notification.title + " - " + notification.body, {
        icon: <Bell className="w-5 h-5 text-primary" />,
      });
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ', notification);
      const data = notification.notification.data;
      if (data && data.conversaId) {
        navigate(`/chat/${data.conversaId}`);
      } else if (data && data.itemId) {
        navigate(`/item/${data.itemId}`);
      }
    });

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [navigate]);

  return { pushToken };
};
