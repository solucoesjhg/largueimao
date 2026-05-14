import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUnreadCounts(conversationIds: string[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["unread-counts", user?.id, conversationIds],
    queryFn: async () => {
      if (!conversationIds.length) return {};

      const { data: reads } = await supabase
        .from("leituras")
        .select("conver_le, ultima_le")
        .in("conver_le", conversationIds);

      const readMap = new Map(
        (reads || []).map((r) => [r.conver_le, r.ultima_le])
      );

      const counts: Record<string, number> = {};

      await Promise.all(
        conversationIds.map(async (convId) => {
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
          if (count && count > 0) {
            counts[convId] = count;
          }
        })
      );

      return counts;
    },
    enabled: !!user && conversationIds.length > 0,
    refetchInterval: 30000,
  });
}
