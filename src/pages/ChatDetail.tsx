import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";

const ChatDetail = () => {
  const { id: LId } = useParams<{ id: string }>();
  const LNavigate = useNavigate();
  const { user: LUser } = useAuth();
  const LQueryClient = useQueryClient();
  // Estado local e referências ganham o prefixo "L"
  const [LText, setText] = useState("");
  const LBottomRef = useRef<HTMLDivElement>(null);
  const { keyboardHeight } = useKeyboardOpen();

  // Verbos para ações de busca no banco
  const pesquisarConversa = async () => {
    const { data: LData, error: LError } = await supabase
      .from("conversas")
      .select("*, itens(titulo_it, imagem_it, preco_it)")
      .eq("id_co", LId!)
      .single();
    if (LError) throw LError;
    return LData;
  };

  const { data: LConversation } = useQuery({
    queryKey: ["conversation", LId],
    queryFn: pesquisarConversa,
    enabled: !!LId,
  });

  const LPartnerId = LConversation
    ? LConversation.compra_co === LUser?.id
      ? LConversation.vended_co
      : LConversation.compra_co
    : null;

  const pesquisarPerfil = async () => {
    const { data: LData } = await supabase
      .from("perfis")
      .select("nome_pe")
      .eq("usuari_pe", LPartnerId!)
      .single();
    return LData;
  };

  const { data: LPartnerProfile } = useQuery({
    queryKey: ["partner-profile", LPartnerId],
    queryFn: pesquisarPerfil,
    enabled: !!LPartnerId,
  });

  const pesquisarMensagens = async () => {
    const { data: LData, error: LError } = await supabase
      .from("mensagens")
      .select("*")
      .eq("conver_me", LId!)
      .order("criado_me", { ascending: true });
    if (LError) throw LError;
    return LData || [];
  };

  const { data: LMessages = [] } = useQuery({
    queryKey: ["messages", LId],
    queryFn: pesquisarMensagens,
    enabled: !!LId,
  });

  useEffect(() => {
    if (!LId) return;
    const LChannel = supabase
      .channel(`messages-${LId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensagens",
          filter: `conver_me=eq.${LId}`,
        },
        (LPayload) => {
          LQueryClient.setQueryData(["messages", LId], (AOldData: any[]) => {
            if (!AOldData) return [LPayload.new];
            if (AOldData.some((AMsg) => AMsg.id_me === LPayload.new.id_me)) {
              return AOldData;
            }
            return [...AOldData, LPayload.new];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(LChannel);
    };
  }, [LId, LQueryClient]);

  const marcarComoLido = useCallback(async () => {
    if (!LId || !LUser) return;
    await supabase
      .from("leituras")
      .upsert(
        { conver_le: LId, usuari_le: LUser.id, ultima_le: new Date().toISOString() },
        { onConflict: "conver_le,usuari_le" }
      );
    LQueryClient.invalidateQueries({ queryKey: ["unread-chats"] });
  }, [LId, LUser, LQueryClient]);

  useEffect(() => {
    marcarComoLido();
  }, [marcarComoLido, LMessages]);

  useEffect(() => {
    // Adicionamos um pequeno delay para garantir que o scroll role depois que
    // o padding do teclado já for aplicado no DOM
    setTimeout(() => {
      LBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, [LMessages, keyboardHeight]);

  const incluirMensagem = useMutation({
    mutationFn: async () => {
      if (!LText.trim()) return;
      const { error: LError } = await supabase.from("mensagens").insert({
        conver_me: LId!,
        remete_me: LUser!.id,
        text_me: LText.trim(),
      });
      if (LError) throw LError;
    },
    onSuccess: () => {
      setText("");
      LQueryClient.invalidateQueries({ queryKey: ["messages", LId] });
    },
  });

  const enviarMensagem = () => {
    if (LText.trim()) incluirMensagem.mutate();
  };

  const LItem = LConversation?.itens as any;
  const LPartnerName = LPartnerProfile?.nome_pe || "Usuário";

  // Montagem da tela de Chat em blocos (Painéis)
  const pnlTopo = (
    <header className="flex flex-col border-b border-border bg-background">
      <div className="h-[env(safe-area-inset-top,0px)] w-full" />
      <div className="flex min-h-[56px] items-center gap-3 px-4 py-3">
        <button onClick={() => LNavigate("/chats")} className="flex h-8 w-8 items-center justify-center text-foreground transition-opacity hover:opacity-70 active:opacity-50">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p className="truncate text-sm font-bold leading-tight text-foreground">{LPartnerName}</p>
          {LItem && (
            <p className="mt-0.5 truncate text-xs leading-tight text-muted-foreground">{LItem.titulo_it}</p>
          )}
        </div>
      </div>
    </header>
  );

  const pnlItemBanner = LItem ? (
    <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-2">
      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {LItem.imagem_it ? (
          <img src={LItem.imagem_it} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm">📦</div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{LItem.titulo_it}</p>
        <p className="text-sm font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-emerald-800 drop-shadow-sm" style={{ fontFamily: "'Nunito', sans-serif" }}>
          {LItem.preco_it === 0 ? "Grátis" : `R$ ${Number(LItem.preco_it).toFixed(2).replace(".", ",")}`}
        </p>
      </div>
    </div>
  ) : null;

  const lstMensagens = (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      <div className="space-y-2">
        {/* Iteração usando prefixo "A" para parâmetro de callback */}
        {LMessages.map((AMsg: any) => {
          const LIsMine = AMsg.remete_me === LUser?.id;
          return (
            <div key={AMsg.id_me} className={`flex ${LIsMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  LIsMine
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-muted text-foreground"
                }`}
              >
                {AMsg.text_me}
                <p className={`mt-0.5 text-[10px] ${LIsMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(AMsg.criado_me).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={LBottomRef} />
      </div>
    </div>
  );

  const pnlInput = (
    <div className="border-t border-border bg-background p-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={LText}
          onChange={(AEvent) => setText(AEvent.target.value)}
          onKeyDown={(AEvent) => AEvent.key === "Enter" && !AEvent.shiftKey && enviarMensagem()}
          placeholder="Digite sua mensagem..."
          className="h-10 flex-1 rounded-full border border-input bg-muted px-4 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          className="h-10 w-10 shrink-0 rounded-full btn-glass-neon"
          onClick={enviarMensagem}
          disabled={!LText.trim() || incluirMensagem.isPending}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div 
      className="flex h-screen flex-col bg-background transition-all duration-100 ease-out"
      style={{ paddingBottom: keyboardHeight }}
    >
      {pnlTopo}
      {pnlItemBanner}
      {lstMensagens}
      {pnlInput}
    </div>
  );
};

export default ChatDetail;
