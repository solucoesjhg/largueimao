import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import BottomNav from "@/components/BottomNav";
import PullToRefresh from "@/components/PullToRefresh";

const Chats = () => {
  const LNavigate = useNavigate();
  const { user: LUser } = useAuth();
  const LQueryClient = useQueryClient();

  // Abstração das Querys usando Verbos (pesquisar)
  const pesquisarConversas = async () => {
    const { data: LData, error: LError } = await supabase
      .from("conversas")
      .select("*, itens(titulo_it, imagem_it, preco_it)")
      .order("atuali_co", { ascending: false });
    if (LError) throw LError;
    return LData || [];
  };

  // O React Query apenas consome a função, mantendo o código limpo
  const { data: LConversas = [], isLoading: LIsLoading } = useQuery({
    queryKey: ["conversations", LUser?.id],
    queryFn: pesquisarConversas,
    enabled: !!LUser,
  });

  const LPartnerIds = LConversas.map((AConv) =>
    AConv.compra_co === LUser?.id ? AConv.vended_co : AConv.compra_co
  );

  const pesquisarPerfis = async () => {
    if (!LPartnerIds.length) return [];
    const { data: LData } = await supabase
      .from("perfis")
      .select("usuari_pe, nome_pe")
      .in("usuari_pe", LPartnerIds);
    return LData || [];
  };

  const { data: LProfiles = [] } = useQuery({
    queryKey: ["chat-profiles", LPartnerIds],
    queryFn: pesquisarPerfis,
    enabled: LPartnerIds.length > 0,
  });

  const LConvIds = LConversas.map((AConv) => AConv.id_co);
  const { data: LUnreadCounts = {} } = useUnreadCounts(LConvIds);

  const carregarNomeParceiro = (AConv: any) => {
    const LPartnerId = AConv.compra_co === LUser?.id ? AConv.vended_co : AConv.compra_co;
    const LProfile = LProfiles.find((AProf) => AProf.usuari_pe === LPartnerId);
    return LProfile?.nome_pe || "Usuário";
  };

  const pnlTopo = (
    <header className="sticky top-0 z-40 bg-background pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-center border-b border-border px-4 py-3">
        <h1 className="text-lg font-bold text-foreground">Conversas</h1>
      </div>
    </header>
  );

  const pnlLoading = (
    <div className="space-y-0">
      {[...Array(3)].map((_, AIndex) => (
        <div key={AIndex} className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="h-12 w-12 animate-pulse rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );

  const pnlVazio = (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <MessageCircle className="h-10 w-10 text-muted-foreground" />
      <p className="text-muted-foreground">Nenhuma conversa ainda.</p>
      <p className="text-sm text-muted-foreground">
        Abra um item e toque em "Chamar no chat".
      </p>
    </div>
  );

  const lstConversas = (
    <div>
      {/* Exemplo de iteração (parâmetro de loop usando "A") */}
      {LConversas.map((AConv) => {
        const LItem = AConv.itens as any;
        const LPrice = LItem?.preco_it === 0 ? "Grátis" : `R$ ${Number(LItem?.preco_it || 0).toFixed(2).replace(".", ",")}`;
        return (
          <button
            key={AConv.id_co}
            onClick={() => LNavigate(`/chat/${AConv.id_co}`)}
            className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/50"
          >
            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
              {LItem?.imagem_it ? (
                <img src={LItem.imagem_it} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg">📦</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {carregarNomeParceiro(AConv)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {LItem?.titulo_it} · {LPrice}
              </p>
            </div>
            {LUnreadCounts[AConv.id_co] > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {LUnreadCounts[AConv.id_co]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  const pnlRodape = <BottomNav />;

  // O return da tela apenas orquestra os painéis
  return (
    <div className="flex h-[100dvh] flex-col bg-background overflow-hidden">
      {pnlTopo}
      
      <div className="flex-1 overflow-y-auto">
        <PullToRefresh onRefresh={async () => { await LQueryClient.invalidateQueries({ queryKey: ["conversations", LUser?.id] }); }}>
          {LIsLoading ? pnlLoading : LConversas.length === 0 ? pnlVazio : lstConversas}
        </PullToRefresh>
      </div>

      {pnlRodape}
    </div>
  );
};

export default Chats;
