import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import BottomNav from "@/components/BottomNav";

const Chats = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*, items(title, image_url, price)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Get display names for conversation partners
  const partnerIds = conversations.map((c) =>
    c.buyer_id === user?.id ? c.seller_id : c.buyer_id
  );

  const { data: profiles = [] } = useQuery({
    queryKey: ["chat-profiles", partnerIds],
    queryFn: async () => {
      if (!partnerIds.length) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", partnerIds);
      return data || [];
    },
    enabled: partnerIds.length > 0,
  });

  const convIds = conversations.map((c) => c.id);
  const { data: unreadCounts = {} } = useUnreadCounts(convIds);

  const getPartnerName = (conv: any) => {
    const partnerId = conv.buyer_id === user?.id ? conv.seller_id : conv.buyer_id;
    const profile = profiles.find((p) => p.user_id === partnerId);
    return profile?.display_name || "Usuário";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background px-4 py-3">
        <button onClick={() => navigate("/")} className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Conversas</h1>
      </header>

      {isLoading ? (
        <div className="space-y-0">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-3">
              <div className="h-12 w-12 animate-pulse rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <MessageCircle className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma conversa ainda.</p>
          <p className="text-sm text-muted-foreground">
            Abra um item e toque em "Chamar no chat".
          </p>
        </div>
      ) : (
        <div>
          {conversations.map((conv) => {
            const item = conv.items as any;
            const price = item?.price === 0 ? "Grátis" : `R$ ${Number(item?.price || 0).toFixed(2).replace(".", ",")}`;
            return (
              <button
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/50"
              >
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item?.image_url ? (
                    <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg">📦</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {getPartnerName(conv)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item?.title} · {price}
                  </p>
                </div>
                {unreadCounts[conv.id] > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                    {unreadCounts[conv.id]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Chats;
