import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUnreadChats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["unread-chats", user?.id],
    queryFn: async () => {
      // Get all conversations the user is part of
      const { data: conversations } = await supabase
        .from("conversas")
        .select("id_co");
      if (!conversations?.length) return false;

      const convIds = conversations.map((c) => c.id_co);

      // Get user's read timestamps
      const { data: reads } = await supabase
        .from("leituras")
        .select("conver_le, ultima_le")
        .in("conver_le", convIds);

      const readMap = new Map(
        (reads || []).map((r) => [r.conver_le, r.ultima_le])
      );

      // Check each conversation for messages newer than last read
      for (const convId of convIds) {
        const lastRead = readMap.get(convId);
        let query = supabase
          .from("mensagens")
          .select("id_me", { count: "exact", head: true })
          .eq("conver_me", convId)
          .neq("remete_me", user!.id);

        if (lastRead) {
          query = query.gt("criado_me", lastRead);
        }

        const { count } = await query;
        if (count && count > 0) return true;
      }

      return false;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}
