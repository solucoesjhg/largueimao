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
        .from("conversations")
        .select("id");
      if (!conversations?.length) return false;

      const convIds = conversations.map((c) => c.id);

      // Get user's read timestamps
      const { data: reads } = await supabase
        .from("conversation_reads")
        .select("conversation_id, last_read_at")
        .in("conversation_id", convIds);

      const readMap = new Map(
        (reads || []).map((r) => [r.conversation_id, r.last_read_at])
      );

      // Check each conversation for messages newer than last read
      for (const convId of convIds) {
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
        if (count && count > 0) return true;
      }

      return false;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}
