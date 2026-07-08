import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ItemCard from "@/components/ItemCard";
import BottomNav from "@/components/BottomNav";
import PnlNavegacao from "@/components/PnlNavegacao";
import { FilterValues, carregarFiltros } from "@/components/FiltersSheet";
import { Button } from "@/components/ui/button";

const Index = () => {
  // 1. Variáveis ganham o prefixo "L" de Local
  const [LSearchQuery, setSearchQuery] = useState("");
  const [LDebouncedSearch, setDebouncedSearch] = useState("");
  const [LFilters, setFilters] = useState<FilterValues>(() => carregarFiltros());
  const LNavigate = useNavigate();

  useEffect(() => {
    const LTimer = setTimeout(() => setDebouncedSearch(LSearchQuery), 500);
    return () => clearTimeout(LTimer);
  }, [LSearchQuery]);

  // 2. Extração de lógica pesada para um método focado usando verbos (pesquisar, incluir, carregar)
  const pesquisarItens = async ({ pageParam = 0 }) => {
    const LPageSize = 20;
    const LStart = pageParam * LPageSize;
    const LEnd = LStart + LPageSize - 1;

    let LQuery = supabase
      .from("itens")
      .select("*")
      .eq("status_it", "active")
      .order("criado_it", { ascending: false })
      .range(LStart, LEnd);

    if (LFilters.category && LFilters.category.length > 0 && !LFilters.category.includes("todos")) {
      LQuery = LQuery.in("catego_it", LFilters.category);
    }
    if (LDebouncedSearch.trim()) {
      LQuery = LQuery.ilike("titulo_it", `%${LDebouncedSearch.trim()}%`);
    }
    if (LFilters.cep.trim()) {
      const LCepPrefix = LFilters.cep.replace(/\D/g, "").slice(0, 5);
      if (LCepPrefix) {
        LQuery = LQuery.ilike("local_it", `%${LCepPrefix}%`);
      }
    }

    const { data: LData, error: LError } = await LQuery;
    if (LError) throw LError;
    return { data: LData, nextCursor: LData.length === LPageSize ? pageParam + 1 : undefined };
  };

  const {
    data: LDataPage,
    isLoading: LIsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ["items", LDebouncedSearch, LFilters],
    queryFn: pesquisarItens,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const LItens = LDataPage ? LDataPage.pages.flatMap((page) => page.data) : [];

  const { ref: LRefInView, inView: LInView } = useInView();

  useEffect(() => {
    if (LInView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [LInView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const LFiltersActive = LFilters.cep.trim().length > 0 || !LFilters.category.includes("todos");
  // 3. Quebra da view em variáveis com prefixos de interface
  const pnlTopo = null;

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
      <div ref={LRefInView} className="w-full h-10 flex items-center justify-center">
        {isFetchingNextPage && <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    </div>
  );

  // 5. O return da tela fica extremamente simples e sem lógica, como um lego
  return (
    <div className="min-h-[100dvh] bg-background pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+220px)] flex flex-col">
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
