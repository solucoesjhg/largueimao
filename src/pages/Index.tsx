import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SearchHeader from "@/components/SearchHeader";
import CategoryFilter from "@/components/CategoryFilter";
import ItemCard from "@/components/ItemCard";
import BottomNav from "@/components/BottomNav";
import FiltersSheet, { FilterValues, loadFilters } from "@/components/FiltersSheet";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("todos");
  const [filters, setFilters] = useState<FilterValues>(() => loadFilters());
  const navigate = useNavigate();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items", category, searchQuery, filters],
    queryFn: async () => {
      let query = supabase
        .from("items")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (category !== "todos") {
        query = query.eq("category", category);
      }
      if (searchQuery.trim()) {
        query = query.ilike("title", `%${searchQuery.trim()}%`);
      }
      if (filters.cep.trim()) {
        // Filter by CEP prefix in location field (basic match until geocoding is added)
        const cepPrefix = filters.cep.replace(/\D/g, "").slice(0, 5);
        if (cepPrefix) {
          query = query.ilike("location", `%${cepPrefix}%`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const filtersActive = filters.cep.trim().length > 0;

  return (
    <div className="min-h-screen bg-background pt-16 pb-32">
      <BottomNav />

      <CategoryFilter selected={category} onSelect={setCategory} />

      {/* Items Grid */}
      <div className="px-4">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-4xl">🤷</span>
            <p className="text-muted-foreground">Nenhum item por aqui ainda.</p>
            <Link to="/post-item">
              <Button variant="outline" className="mt-2 rounded-xl">
                Seja o primeiro a largar!
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                title={item.title}
                price={item.price}
                location={item.location}
                imageUrl={item.image_url}
                onClick={() => navigate(`/item/${item.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar: CTA + Search */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background px-4 py-3">
        <div className="mx-auto flex max-w-lg flex-col gap-2">
          <Link to="/post-item" className="w-full">
            <Button className="h-12 w-full rounded-xl text-base font-bold">
              <Plus className="mr-2 h-5 w-5" />
              LARGAR ITEM
            </Button>
          </Link>
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
            </div>
            <FiltersSheet onApply={setFilters} active={filtersActive} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
