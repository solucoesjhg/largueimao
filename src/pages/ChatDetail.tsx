import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, X, Reply, Copy, MoreVertical, Flag, ShieldAlert, Ban, CheckCircle2, PackageX, Lock, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

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
      className={`flex flex-col relative w-full ${AMsg.reacao_me ? "mb-5" : "mb-[2px]"} ${LIsMine ? "items-end" : "items-start"}`} 
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
        onClick={(e) => e.stopPropagation()}
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
          <div className={`absolute -bottom-4 ${LIsMine ? "left-2" : "right-2"} flex h-7 w-7 items-center justify-center rounded-full bg-background border border-border text-sm shadow-sm z-10 animate-in zoom-in duration-200`}>
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

  const [LIsOptionsOpen, setIsOptionsOpen] = useState(false);
  const [LIsReportOpen, setIsReportOpen] = useState(false);
  const [LReportReason, setReportReason] = useState("");

  // Verbos para ações de busca no banco
  const pesquisarConversa = async () => {
    const { data: LData, error: LError } = await supabase
      .from("conversas")
      .select("*, itens(id_it, titulo_it, imagem_it, preco_it, usuari_it, status_it, comprador_it)")
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
      .maybeSingle();
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
      }).select('id_me');
      if (LError) throw LError;
    },
    onSuccess: () => {
      setText("");
      setReplyingTo(null);
      LQueryClient.invalidateQueries({ queryKey: ["messages", LId] });
    },
    onError: (error) => {
      console.error("FULL SUPABASE ERROR OBJECT:", JSON.stringify(error, null, 2));
      alert("Erro ao enviar: " + error.message);
    }
  });

  const bloquearUsuario = useMutation({
    mutationFn: async () => {
      if (!LUser) {
        LNavigate("/login");
        throw new Error("not-authed");
      }
      if (!LPartnerId) throw new Error("Missing partner");
      
      const { error } = await supabase
        .from('bloqueios')
        .insert({
          bloqueador_id: LUser.id,
          bloqueado_id: LPartnerId
        });
      if (error && error.code !== '23505') throw error; // Ignora erro se já estiver bloqueado
    },
    onSuccess: () => {
      toast.success("Usuário bloqueado com sucesso.");
      setIsOptionsOpen(false);
      LNavigate("/chats");
    },
    onError: (error: Error) => {
      if (error.message !== "not-authed") toast.error("Erro ao bloquear usuário");
    }
  });

  const enviarDenuncia = useMutation({
    mutationFn: async () => {
      if (!LUser) {
        LNavigate("/login");
        throw new Error("not-authed");
      }
      if (!LPartnerId || !LReportReason.trim()) throw new Error("Invalid report");
      
      const { error } = await supabase
        .from('denuncias')
        .insert({
          denunciante_id: LUser.id,
          denunciado_id: LPartnerId,
          item_id: null,
          motivo: LReportReason,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Denúncia enviada! Nossa equipe analisará em breve.");
      setIsReportOpen(false);
      setIsOptionsOpen(false);
      setReportReason("");
    },
    onError: (error: Error) => {
      if (error.message !== "not-authed") toast.error("Erro ao enviar denúncia");
    }
  });

  const reagirMensagem = useMutation({
    mutationFn: async ({ msgId, reaction }: { msgId: string, reaction: string | null }) => {
      const { error, data } = await supabase.from("mensagens").update({ reacao_me: reaction }).eq("id_me", msgId).select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Falha ao salvar reação (possível bloqueio de RLS no banco).");
      }
      return { msgId, reaction };
    },
    onSuccess: ({ msgId, reaction }) => {
      LQueryClient.setQueryData(["messages", LId], (oldData: any[]) => {
        if (!oldData) return oldData;
        return oldData.map((msg) => msg.id_me === msgId ? { ...msg, reacao_me: reaction } : msg);
      });
    },
    onError: (error) => {
      toast.error(error.message);
      // Força a re-busca das mensagens para desfazer a reação falha na UI
      LQueryClient.invalidateQueries({ queryKey: ["messages", LId] });
    }
  });

  const alterarStatusItem = useMutation({
    mutationFn: async (novoStatus: string) => {
      const LItem = LConversation?.itens as any;
      if (!LItem || !LItem.id_it) throw new Error("Item inválido");
      const payload: any = { status_it: novoStatus };
      if (novoStatus === 'reserved' || novoStatus === 'sold') {
        payload.comprador_it = LPartnerId;
      } else if (novoStatus === 'active') {
        payload.comprador_it = null;
      }
      
      const { error } = await supabase.from("itens").update(payload).eq("id_it", LItem.id_it);
      if (error) throw error;
    },
    onSuccess: (_, novoStatus) => {
      let msg = "Item atualizado com sucesso!";
      if (novoStatus === 'reserved') msg = "Item reservado!";
      else if (novoStatus === 'active') msg = "Reserva desfeita. Item ativo novamente.";
      else if (novoStatus === 'sold') msg = "Que bão Tchê! Negócio fechado com sucesso! 🎉";
      
      toast.success(msg);
      LQueryClient.invalidateQueries({ queryKey: ["conversation", LId] });
      LQueryClient.invalidateQueries({ queryKey: ["my-items"] });
      setIsOptionsOpen(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar o status do item.");
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
  const LPartnerName = LPartnerProfile?.nome_pe || "Usuário excluído";

  // Montagem da tela de Chat em blocos (Painéis)
  const pnlTopo = (
    <header className="flex flex-col border-b border-border bg-background pt-[env(safe-area-inset-top)]">
      <div className="flex min-h-[56px] items-center gap-3 px-4 py-3">
        <button onClick={() => window.history.length > 2 ? LNavigate(-1) : LNavigate("/chats")} className="flex h-8 w-8 items-center justify-center text-foreground transition-opacity hover:opacity-70 active:opacity-50">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p className={`truncate text-base font-bold leading-tight ${!LPartnerProfile ? 'text-muted-foreground italic' : 'text-foreground'}`}>
            {LPartnerName}
          </p>
        </div>
        <button 
          onClick={() => setIsOptionsOpen(true)}
          className="flex h-8 w-8 items-center justify-center text-foreground transition-opacity hover:opacity-70 active:opacity-50"
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
    </header>
  );

  const LTituloSnap = LItem?.titulo_it || LConversation?.item_titulo_snap || "Anúncio excluído";
  const LPrecoSnap = LItem?.preco_it ?? LConversation?.item_preco_snap ?? 0;
  
  const pnlItemBanner = (LItem || LConversation?.item_titulo_snap) ? (
    <div 
      onClick={() => LItem && LNavigate(`/item/${LConversation?.item_co}`)}
      className={`flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-2 transition-colors ${LItem ? 'cursor-pointer hover:bg-muted/50 active:bg-muted' : ''}`}
    >
      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {LItem?.imagem_it ? (
          <img src={LItem.imagem_it} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm bg-gray-200 text-gray-500">🚫</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{LTituloSnap}</p>
          {LItem?.status_it === 'reserved' && (
            <span className="shrink-0 bg-amber-500/20 text-amber-500 text-[10px] font-bold px-1.5 py-0.5 rounded">RESERVADO</span>
          )}
          {LItem?.status_it === 'sold' && (
            <span className="shrink-0 bg-muted-foreground/20 text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">FINALIZADO</span>
          )}
        </div>
        <p className="text-sm font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-emerald-800 drop-shadow-sm" style={{ fontFamily: "'Nunito', sans-serif" }}>
          {LPrecoSnap === 0 ? "Grátis" : `R$ ${Number(LPrecoSnap).toFixed(2).replace(".", ",")}`}
        </p>
      </div>
      {LItem && (
        <div className="flex-shrink-0 text-muted-foreground opacity-50">
          <ArrowLeft className="h-4 w-4 rotate-180" />
        </div>
      )}
    </div>
  ) : null;

  const pnlQuickActions = (LItem && LItem.usuari_it === LUser?.id && LItem.status_it !== 'sold') ? (
    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-muted/20 border-b border-border overflow-x-auto whitespace-nowrap">
      {LItem.status_it === 'active' && (
        <button
          onClick={() => {
            if (window.confirm(`Tem certeza que deseja reservar este item para ${LPartnerName}?\n\nEle ficará invisível para novas pessoas.`)) {
              alterarStatusItem.mutate('reserved');
            }
          }}
          disabled={alterarStatusItem.isPending}
          className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 active:bg-amber-500/30 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border border-amber-500/20"
        >
          <Lock className="h-3.5 w-3.5" />
          Reservar para {LPartnerName.split(" ")[0]}
        </button>
      )}
      {LItem.status_it === 'reserved' && (
        <button
          onClick={() => {
            if (window.confirm("Tem certeza que deseja desfazer a reserva?\n\nO item voltará para a Home.")) {
              alterarStatusItem.mutate('active');
            }
          }}
          disabled={alterarStatusItem.isPending}
          className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 active:bg-amber-500/30 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border border-amber-500/20"
        >
          <Unlock className="h-3.5 w-3.5" />
          Desfazer Reserva
        </button>
      )}
      <button
        onClick={() => {
          if (window.confirm(`Opa! Fechou o brique mesmo?\n\nO anúncio será finalizado e irá para o teu histórico.`)) {
            alterarStatusItem.mutate('sold');
          }
        }}
        disabled={alterarStatusItem.isPending}
        className="flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 active:bg-primary/30 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border border-primary/20"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Concluir Negócio
      </button>
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

  const isThisTheReservedChat = LItem && (LItem.comprador_it === LUser?.id || LItem.comprador_it === LPartnerId);
  const isInputDisabled = LConversation?.status_co === 'closed' || (LItem && (
    LItem.status_it === 'sold' || 
    (LItem.status_it === 'reserved' && !isThisTheReservedChat)
  ));

  const pnlInput = isInputDisabled ? (
    <div className="border-t border-border bg-background p-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] flex justify-center text-center">
      <p className="text-sm font-medium text-muted-foreground">
        {LConversation?.status_co === 'closed' 
          ? "Esta conversa foi encerrada porque o outro usuário excluiu a conta."
          : LItem?.status_it === 'sold' 
            ? "Negócio fechado. Não é possível enviar novas mensagens."
            : "Anúncio reservado. Novas mensagens estão desabilitadas."}
      </p>
    </div>
  ) : (
    <div className="border-t border-border bg-background p-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] flex flex-col gap-2">
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
      style={{ paddingBottom: Capacitor.getPlatform() === 'ios' ? keyboardHeight : 0 }}
    >
      {pnlTopo}
      {pnlItemBanner}
      {pnlQuickActions}
      {lstMensagens}
      {pnlInput}

      {/* Drawer de Opções */}
      <Drawer open={LIsOptionsOpen} onOpenChange={setIsOptionsOpen}>
        <DrawerContent className="px-4 pb-8 pt-2">
          <DrawerHeader className="px-0 mb-2">
            <DrawerTitle className="text-xl font-bold">Opções da Conversa</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-2">
            <div className="px-2 pb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Segurança</h3>
            </div>
            <button
              onClick={() => {
                setIsReportOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-xl p-4 text-left font-medium hover:bg-muted active:scale-[0.98] transition-all"
            >
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              Denunciar Usuário
            </button>
            <button
              onClick={() => {
                if (window.confirm("Tem certeza que deseja bloquear este usuário? Vocês não poderão mais trocar mensagens.")) {
                  bloquearUsuario.mutate();
                }
              }}
              className="flex w-full items-center gap-3 rounded-xl p-4 text-left font-medium text-destructive hover:bg-destructive/10 active:scale-[0.98] transition-all"
            >
              <Ban className="h-5 w-5" />
              Bloquear Usuário
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Drawer de Denúncia */}
      <Drawer open={LIsReportOpen} onOpenChange={setIsReportOpen}>
        <DrawerContent className="px-6 pb-8 pt-4">
          <DrawerHeader className="px-0 mb-2">
            <DrawerTitle className="text-xl font-bold">Denunciar Usuário</DrawerTitle>
            <DrawerDescription>
              Por favor, explique o motivo da denúncia para podermos analisar.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Ex: Ofensas, spam, fraude..."
              value={LReportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl h-12" 
                onClick={() => setIsReportOpen(false)}
                disabled={enviarDenuncia.isPending}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1 rounded-xl h-12 font-bold"
                onClick={() => enviarDenuncia.mutate()}
                disabled={!LReportReason.trim() || enviarDenuncia.isPending}
              >
                {enviarDenuncia.isPending ? "Enviando..." : "Enviar Denúncia"}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default ChatDetail;
