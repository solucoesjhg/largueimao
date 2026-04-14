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
        .from("conversation_reads")
        .select("conversation_id, last_read_at")
        .in("conversation_id", conversationIds);

      const readMap = new Map(
        (reads || []).map((r) => [r.conversation_id, r.last_read_at])
      );

      const counts: Record<string, number> = {};

      await Promise.all(
        conversationIds.map(async (convId) => {
          const lastRead = readMap.get(convId);
          let query = supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", convId)
            .neq("sender_id", user!.id);

          if (lastRead) {
            query = query.gt("created_at", lastRead);
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
