import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ItemCard from "@/components/ItemCard";
import BottomNav from "@/components/BottomNav";
import PnlNavegacao from "@/components/PnlNavegacao";
import { FilterValues, loadFilters } from "@/components/FiltersSheet";
import HeaderLogo from "@/components/HeaderLogo";
import { Button } from "@/components/ui/button";

const Index = () => {
  // 1. Variáveis ganham o prefixo "L" de Local
  const [LSearchQuery, setSearchQuery] = useState("");
  const [LFilters, setFilters] = useState<FilterValues>(() => loadFilters());
  const LNavigate = useNavigate();

  // 2. Extração de lógica pesada para um método focado usando verbos (pesquisar, incluir, carregar)
  const pesquisarItens = async () => {
    let LQuery = supabase
      .from("itens")
      .select("*")
      .eq("status_it", "active")
      .order("criado_it", { ascending: false });

    if (LFilters.category && LFilters.category.length > 0 && !LFilters.category.includes("todos")) {
      LQuery = LQuery.in("catego_it", LFilters.category);
    }
    if (LSearchQuery.trim()) {
      LQuery = LQuery.ilike("titulo_it", `%${LSearchQuery.trim()}%`);
    }
    if (LFilters.cep.trim()) {
      const LCepPrefix = LFilters.cep.replace(/\D/g, "").slice(0, 5);
      if (LCepPrefix) {
        LQuery = LQuery.ilike("local_it", `%${LCepPrefix}%`);
      }
    }

    const { data: LData, error: LError } = await LQuery;
    if (LError) throw LError;
    return LData;
  };

  const { data: LItens = [], isLoading: LIsLoading } = useQuery({
    queryKey: ["items", LSearchQuery, LFilters],
    queryFn: pesquisarItens,
  });

  const LFiltersActive = LFilters.cep.trim().length > 0 || !LFilters.category.includes("todos");
  // 3. Quebra da view em variáveis com prefixos de interface
  const pnlTopo = (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-lg items-center pl-4 pr-0 overflow-hidden">
        <HeaderLogo size={26} />
      </div>
    </header>
  );

  const pnlRodape = <BottomNav />;

  const pnlLoading = (
    <div className="flex flex-row flex-wrap gap-2 mt-4">
      {[...Array(6)].map((_, AIndex) => (
        <div key={AIndex} className="w-[calc((100%-0.5rem)/2)] aspect-[3/4] animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );

  const pnlVazio = (
    <div className="flex flex-col items-center gap-2 py-16 text-center mt-auto mb-auto">
      <span className="text-4xl">🤷</span>
      <p className="text-muted-foreground">Nenhum item por aqui ainda.</p>
      <Link to="/post-item">
        <Button variant="outline" className="mt-2 rounded-xl">
          Seja o primeiro a largar!
        </Button>
      </Link>
    </div>
  );

  const grdItens = (
    <div className="flex flex-row flex-wrap gap-2 mt-4">
      {/* 4. Parâmetros iterativos e callbacks ganham prefixo "A" */}
      {LItens.map((AItem) => (
        <div key={AItem.id_it} className="w-[calc((100%-0.5rem)/2)]">
          <ItemCard
            id={AItem.id_it}
            title={AItem.titulo_it}
            price={AItem.preco_it}
            location={AItem.local_it}
            imageUrl={AItem.imagem_it}
            images={(AItem as { fotos_it?: string[] | null }).fotos_it ?? null}
            onClick={() => LNavigate(`/item/${AItem.id_it}`)}
          />
        </div>
      ))}
    </div>
  );

  // 5. O return da tela fica extremamente simples e sem lógica, como um lego
  return (
    <div className="min-h-[100dvh] bg-background pt-16 pb-[220px] flex flex-col">
      {pnlTopo}
      {pnlRodape}

      <div className="px-4 flex-1 flex flex-col">
        {LIsLoading ? pnlLoading : LItens.length === 0 ? pnlVazio : grdItens}
      </div>

      <PnlNavegacao
        searchQuery={LSearchQuery}
        setSearchQuery={setSearchQuery}
        filtersActive={LFiltersActive}
        setFilters={setFilters}
      />
    </div>
  );
};

export default Index;
