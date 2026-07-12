import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, X, Reply, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";

const MessageBubble = ({ AMsg, LIsMine, LReplyMsg, LPartnerName, lidarComReacao, setReplyingTo, LActiveMsgId, setActiveMsgId, LUser, LIsFirstInGroup, LIsLastInGroup, isFirstMessage }: any) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);
  const swipeOffset = useRef(0);
  const LLongPressTimer = useRef<NodeJS.Timeout | null>(null);

  const isMenuOpen = LActiveMsgId === AMsg.id_me;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;

    if (LLongPressTimer.current) clearTimeout(LLongPressTimer.current);
    LLongPressTimer.current = setTimeout(() => {
      if (!isSwiping.current) {
        setActiveMsgId(AMsg.id_me);
      }
    }, 500);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const LDeltaX = e.touches[0].clientX - touchStartX.current;
    const LDeltaY = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(LDeltaX) > 10 || Math.abs(LDeltaY) > 10) {
      isSwiping.current = true;
      if (LLongPressTimer.current) clearTimeout(LLongPressTimer.current);
    }
    if (Math.abs(LDeltaX) > 20 && Math.abs(LDeltaY) < 30) {
      swipeOffset.current = LDeltaX;
      if (bubbleRef.current) {
        bubbleRef.current.style.transform = `translateX(${Math.max(-50, Math.min(50, LDeltaX))}px)`;
      }
    }
  };

  const onTouchEnd = () => {
    if (LLongPressTimer.current) clearTimeout(LLongPressTimer.current);
    if (bubbleRef.current) {
      bubbleRef.current.style.transform = 'translateX(0)';
      if (Math.abs(swipeOffset.current) > 40) {
        setReplyingTo(AMsg);
      }
    }
    swipeOffset.current = 0;
  };

  // Instagram-style Border Radius logic
  let radiusClass = "rounded-[22px]";
  if (LIsMine) {
    if (LIsFirstInGroup && LIsLastInGroup) radiusClass = "rounded-[22px]";
    else if (LIsFirstInGroup) radiusClass = "rounded-[22px] rounded-br-sm";
    else if (LIsLastInGroup) radiusClass = "rounded-[22px] rounded-tr-sm";
    else radiusClass = "rounded-[22px] rounded-tr-sm rounded-br-sm";
  } else {
    if (LIsFirstInGroup && LIsLastInGroup) radiusClass = "rounded-[22px]";
    else if (LIsFirstInGroup) radiusClass = "rounded-[22px] rounded-bl-sm";
    else if (LIsLastInGroup) radiusClass = "rounded-[22px] rounded-tl-sm";
    else radiusClass = "rounded-[22px] rounded-tl-sm rounded-bl-sm";
  }

  return (
    <div 
      className={`flex flex-col relative w-full mb-[2px] ${LIsMine ? "items-end" : "items-start"}`} 
    >
      {isMenuOpen && (
        <div className={`absolute z-20 ${isFirstMessage ? "top-full mt-1" : "bottom-full mb-1"} flex items-center gap-1 rounded-full bg-background/95 backdrop-blur-md border border-border shadow-lg px-2 py-1 transform-gpu transition-all duration-200`}>
          {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => (
            <button
              key={emoji}
              onClick={(e) => {
                e.stopPropagation();
                lidarComReacao(AMsg.id_me, AMsg.reacao_me === emoji ? null : emoji);
              }}
              className={`text-xl hover:scale-125 transition-transform p-1 rounded-full ${AMsg.reacao_me === emoji ? "bg-muted" : ""}`}
            >
              {emoji}
            </button>
          ))}
          <div className="w-px h-5 bg-border mx-1" />
          <button
            onClick={(e) => { e.stopPropagation(); setReplyingTo(AMsg); setActiveMsgId(null); }}
            className="p-1.5 text-muted-foreground hover:text-foreground"
          >
            <Reply className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              navigator.clipboard.writeText(AMsg.text_me); 
              setActiveMsgId(null); 
            }}
            className="p-1.5 text-muted-foreground hover:text-foreground"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <div 
        ref={bubbleRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onContextMenu={(e) => { e.preventDefault(); setActiveMsgId(AMsg.id_me); }}
        className={`relative max-w-[75%] flex flex-col select-none [-webkit-touch-callout:none] ${isMenuOpen ? "scale-[0.98] brightness-90 transition-transform" : ""}`}
      >
        {LReplyMsg && (
          <div className="flex flex-col mb-1 text-xs text-muted-foreground">
            <div className={`flex items-center gap-2 ${LIsMine ? "justify-end" : "justify-start"} mb-1`}>
              <span className="font-medium text-[11px]">{LIsMine ? "Você respondeu" : `${LPartnerName} respondeu`}</span>
            </div>
            <div className={`rounded-xl px-3 py-2 text-xs border border-border/50 bg-muted/40 shadow-sm opacity-90 ${LIsMine ? "self-end items-end text-right" : "self-start items-start text-left"} relative overflow-hidden max-w-[90%]`}>
              <div className={`absolute top-0 bottom-0 w-1 ${LIsMine ? "right-0 bg-primary/40" : "left-0 bg-primary/40"}`} />
              <span className="line-clamp-2">{LReplyMsg.text_me}</span>
            </div>
          </div>
        )}
        
        <div className={`${radiusClass} px-[14px] py-[10px] text-[15px] leading-[1.3] shadow-sm ${LIsMine ? "bg-primary text-primary-foreground" : "bg-[#2a2a2c] text-white"}`}>
          <span className="break-words">{AMsg.text_me}</span>
        </div>
        
        {AMsg.reacao_me && (
          <div className={`absolute -bottom-3 ${LIsMine ? "left-2" : "right-2"} flex h-7 w-7 items-center justify-center rounded-full bg-background border border-border text-sm shadow-sm z-10 animate-in zoom-in duration-200`}>
            {AMsg.reacao_me}
          </div>
        )}
      </div>
    </div>
  );
};

const ChatDetail = () => {
  const { id: LId } = useParams<{ id: string }>();
  const LNavigate = useNavigate();
  const { user: LUser } = useAuth();
  const LQueryClient = useQueryClient();
  // Estado local e referências ganham o prefixo "L"
  const [LText, setText] = useState("");
  const [LReplyingTo, setReplyingTo] = useState<any | null>(null);
  const [LActiveMsgId, setActiveMsgId] = useState<string | null>(null);
  const LBottomRef = useRef<HTMLDivElement>(null);
  const LLongPressTimer = useRef<NodeJS.Timeout | null>(null);
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
          event: "*",
          schema: "public",
          table: "mensagens",
          filter: `conver_me=eq.${LId}`,
        },
        (LPayload) => {
          LQueryClient.setQueryData(["messages", LId], (AOldData: any[]) => {
            if (!AOldData) return [LPayload.new];
            if (LPayload.eventType === "INSERT") {
              if (AOldData.some((AMsg) => AMsg.id_me === LPayload.new.id_me)) {
                return AOldData;
              }
              return [...AOldData, LPayload.new];
            } else if (LPayload.eventType === "UPDATE") {
              return AOldData.map((AMsg) => AMsg.id_me === LPayload.new.id_me ? LPayload.new : AMsg);
            }
            return AOldData;
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
        resp_me: LReplyingTo?.id_me || null,
      });
      if (LError) throw LError;
    },
    onSuccess: () => {
      setText("");
      setReplyingTo(null);
      LQueryClient.invalidateQueries({ queryKey: ["messages", LId] });
    },
    onError: (error) => {
      alert("Erro ao enviar: " + error.message);
    }
  });

  const reagirMensagem = useMutation({
    mutationFn: async ({ msgId, reaction }: { msgId: string, reaction: string | null }) => {
      const { error } = await supabase.from("mensagens").update({ reacao_me: reaction }).eq("id_me", msgId);
      if (error) throw error;
    }
  });

  const lidarComReacao = (msgId: string, reaction: string) => {
    reagirMensagem.mutate({ msgId, reaction });
    setActiveMsgId(null);
  };

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
        <button onClick={() => window.history.length > 2 ? LNavigate(-1) : LNavigate("/chats")} className="flex h-8 w-8 items-center justify-center text-foreground transition-opacity hover:opacity-70 active:opacity-50">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p className="truncate text-base font-bold leading-tight text-foreground">{LPartnerName}</p>
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
    <div className="flex-1 overflow-y-auto px-4 py-3 pb-8 relative" onClick={() => setActiveMsgId(null)}>
      <div className="flex flex-col">
        {LMessages.map((AMsg: any, AIndex: number) => {
          const LIsMine = AMsg.remete_me === LUser?.id;
          const LReplyMsg = AMsg.resp_me ? LMessages.find((M: any) => M.id_me === AMsg.resp_me) : null;
          
          const LPreviousMsg = AIndex > 0 ? LMessages[AIndex - 1] : null;
          const LNextMsg = AIndex < LMessages.length - 1 ? LMessages[AIndex + 1] : null;
          
          const LIsFirstInGroup = !LPreviousMsg || LPreviousMsg.remete_me !== AMsg.remete_me;
          const LIsLastInGroup = !LNextMsg || LNextMsg.remete_me !== AMsg.remete_me;
          
          return (
            <Fragment key={AMsg.id_me}>
              {LIsFirstInGroup && AIndex > 0 && <div className="h-6 w-full flex-shrink-0" />}
              <MessageBubble
                AMsg={AMsg}
                LIsMine={LIsMine}
                LReplyMsg={LReplyMsg}
                LPartnerName={LPartnerName}
                lidarComReacao={lidarComReacao}
                setReplyingTo={setReplyingTo}
                LActiveMsgId={LActiveMsgId}
                setActiveMsgId={setActiveMsgId}
                LUser={LUser}
                LIsFirstInGroup={LIsFirstInGroup}
                LIsLastInGroup={LIsLastInGroup}
                isFirstMessage={AIndex === 0}
              />
            </Fragment>
          );
        })}
        <div ref={LBottomRef} className="h-2" />
      </div>
    </div>
  );

  const pnlInput = (
    <div className="border-t border-border bg-background p-3 flex flex-col gap-2">
      {LReplyingTo && (
        <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm border-l-2 border-primary">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-xs text-primary">{LReplyingTo.remete_me === LUser?.id ? "Respondendo a você" : `Respondendo a ${LPartnerName}`}</p>
            <p className="truncate text-muted-foreground">{LReplyingTo.text_me}</p>
          </div>
          <button onClick={() => setReplyingTo(null)} className="p-1 rounded-full text-muted-foreground hover:bg-background transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
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
          className="h-10 w-10 shrink-0 rounded-full btn-glass-neon flex items-center justify-center"
          onTouchStart={(e) => {
            e.preventDefault();
            enviarMensagem();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            enviarMensagem();
          }}
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
