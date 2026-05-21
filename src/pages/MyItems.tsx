import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ItemCard from "@/components/ItemCard";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const MyItems = () => {
  // 1. Variáveis ganham o prefixo "L" de Local
  const LNavigate = useNavigate();
  const { user: LUser } = useAuth();

  // 2. Extração de lógica pesada para um método focado usando verbos (pesquisar)
  const pesquisarMeusItens = async () => {
    if (!LUser) return [];
    const { data: LData, error: LError } = await supabase
      .from("itens")
      .select("*")
      .eq("usuari_it", LUser.id)
      .order("criado_it", { ascending: false });
    if (LError) throw LError;
    return LData;
  };

  const { data: LItems = [], isLoading: LIsLoading, refetch: LRefetch } = useQuery({
    queryKey: ["my-items", LUser?.id],
    queryFn: pesquisarMeusItens,
    enabled: !!LUser,
  });

  const excluirItem = async (AItemId: string) => {
    const { error: LError } = await supabase.from("itens").delete().eq("id_it", AItemId);
    if (LError) {
      toast.error("Erro ao remover item.");
    } else {
      toast.success("Item removido!");
      LRefetch();
    }
  };

  // 3. Quebra da view em variáveis com prefixos de interface
  const pnlTopo = (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background px-4 py-3">
      <button onClick={() => LNavigate("/")} className="text-foreground">
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="text-lg font-bold text-foreground">Meus itens</h1>
    </header>
  );

  const pnlLoading = (
    <div className="grid grid-cols-2 gap-3">
      {[...Array(2)].map((_, AIndex) => (
        <div key={AIndex} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );

  const pnlVazio = (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <span className="text-4xl">📭</span>
      <p className="text-muted-foreground">Tu ainda não largou nada.</p>
      <Link to="/post-item">
        <Button variant="outline" className="mt-2 rounded-xl">Largar primeiro item</Button>
      </Link>
    </div>
  );

  const grdItens = (
    <div className="grid grid-cols-2 gap-3">
      {/* 4. Parâmetros iterativos e callbacks ganham prefixo "A" */}
      {LItems.map((AItem) => (
        <div key={AItem.id_it} className="relative">
          <ItemCard
            id={AItem.id_it}
            title={AItem.titulo_it}
            price={AItem.preco_it}
            location={AItem.local_it}
            imageUrl={AItem.imagem_it}
          />
          <button
            onClick={() => excluirItem(AItem.id_it)}
            className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 text-destructive backdrop-blur-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );

  const pnlRodape = <BottomNav />;

  // 5. O return da tela fica extremamente simples e sem lógica, como um lego
  return (
    <div className="min-h-screen bg-background pb-20">
      {pnlTopo}
      <div className="p-4">
        {LIsLoading ? pnlLoading : LItems.length === 0 ? pnlVazio : grdItens}
      </div>
      {pnlRodape}
    </div>
  );
};

export default MyItems;
