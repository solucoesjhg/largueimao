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
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterValues>(() => loadFilters());
  const navigate = useNavigate();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items", searchQuery, filters],
    queryFn: async () => {
      let query = supabase
        .from("itens")
        .select("*")
        .eq("status_it", "active")
        .order("criado_it", { ascending: false });

      if (filters.category && filters.category.length > 0 && !filters.category.includes("todos")) {
        query = query.in("catego_it", filters.category);
      }
      if (searchQuery.trim()) {
        query = query.ilike("titulo_it", `%${searchQuery.trim()}%`);
      }
      if (filters.cep.trim()) {
        // Filter by CEP prefix in location field (basic match until geocoding is added)
        const cepPrefix = filters.cep.replace(/\D/g, "").slice(0, 5);
        if (cepPrefix) {
          query = query.ilike("local_it", `%${cepPrefix}%`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filtersActive = filters.cep.trim().length > 0 || !filters.category.includes("todos");

  return (
    <div className="min-h-[100dvh] bg-background pt-16 pb-[220px] flex flex-col">
      {/* Top header with brand logo */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-lg items-center pl-4 pr-0 overflow-hidden">
          <HeaderLogo size={26} />
        </div>
      </header>

      <BottomNav />

      {/* Items Grid */}
      <div className="px-4 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex flex-row flex-wrap gap-2 mt-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-[calc((100%-0.5rem)/2)] aspect-[3/4] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center mt-auto mb-auto">
            <span className="text-4xl">🤷</span>
            <p className="text-muted-foreground">Nenhum item por aqui ainda.</p>
            <Link to="/post-item">
              <Button variant="outline" className="mt-2 rounded-xl">
                Seja o primeiro a largar!
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-row flex-wrap gap-2 mt-4">
            {items.map((item) => (
              <div key={item.id_it} className="w-[calc((100%-0.5rem)/2)]">
                <ItemCard
                  id={item.id_it}
                  title={item.titulo_it}
                  price={item.preco_it}
                  location={item.local_it}
                  imageUrl={item.imagem_it}
                  images={(item as { fotos_it?: string[] | null }).fotos_it ?? null}
                  onClick={() => navigate(`/item/${item.id_it}`)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <PnlNavegacao
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filtersActive={filtersActive}
        setFilters={setFilters}
      />
    </div>
  );
};

export default Index;
