import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const ChatDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Conversation info
  const { data: conversation } = useQuery({
    queryKey: ["conversation", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversas")
        .select("*, itens(titulo_it, imagem_it, preco_it)")
        .eq("id_co", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const partnerId = conversation
    ? conversation.compra_co === user?.id
      ? conversation.vended_co
      : conversation.compra_co
    : null;

  const { data: partnerProfile } = useQuery({
    queryKey: ["partner-profile", partnerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("perfis")
        .select("nome_pe")
        .eq("usuari_pe", partnerId!)
        .single();
      return data;
    },
    enabled: !!partnerId,
  });

  // Messages
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mensagens")
        .select("*")
        .eq("conver_me", id!)
        .order("criado_me", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Realtime subscription
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`messages-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensagens",
          filter: `conver_me=eq.${id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, queryClient]);

  // Mark conversation as read
  const markAsRead = useCallback(async () => {
    if (!id || !user) return;
    await supabase
      .from("leituras")
      .upsert(
        { conver_le: id, usuari_le: user.id, ultima_le: new Date().toISOString() },
        { onConflict: "conver_le,usuari_le" }
      );
    queryClient.invalidateQueries({ queryKey: ["unread-chats"] });
  }, [id, user, queryClient]);

  useEffect(() => {
    markAsRead();
  }, [markAsRead, messages]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!text.trim()) return;
      const { error } = await supabase.from("mensagens").insert({
        conver_me: id!,
        remete_me: user!.id,
        text_me: text.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    },
  });

  const handleSend = () => {
    if (text.trim()) sendMessage.mutate();
  };

  const item = conversation?.itens as any;
  const partnerName = partnerProfile?.nome_pe || "Usuário";

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={() => navigate("/chats")} className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{partnerName}</p>
          {item && (
            <p className="truncate text-xs text-muted-foreground">{item.titulo_it}</p>
          )}
        </div>
      </header>

      {/* Item banner */}
      {item && (
        <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-2">
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            {item.imagem_it ? (
              <img src={item.imagem_it} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm">📦</div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{item.titulo_it}</p>
            <p className="text-xs font-bold text-primary">
              {item.preco_it === 0 ? "Grátis" : `R$ ${Number(item.preco_it).toFixed(2).replace(".", ",")}`}
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-2">
          {messages.map((msg) => {
            const isMine = msg.remete_me === user?.id;
            return (
              <div key={msg.id_me} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    isMine
                      ? "rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-muted text-foreground"
                  }`}
                >
                  {msg.text_me}
                  <p className={`mt-0.5 text-[10px] ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {new Date(msg.criado_me).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background p-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Digite sua mensagem..."
            className="h-10 flex-1 rounded-full border border-input bg-muted px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatDetail;
