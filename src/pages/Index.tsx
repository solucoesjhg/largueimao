import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SearchHeader from "@/components/SearchHeader";
import CategoryFilter from "@/components/CategoryFilter";
import ItemCard from "@/components/ItemCard";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("todos");
  const navigate = useNavigate();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items", category, searchQuery],
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

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background pt-16 pb-20">
      <BottomNav />

      {/* Title */}
      <div className="px-4 pt-3 pb-2">
        <h1 className="text-center font-display text-lg font-bold text-primary">
          LARGUEI MÃO
        </h1>
      </div>

      <CategoryFilter selected={category} onSelect={setCategory} />

      {/* CTA */}
      <div className="px-4 pb-4">
        <Link to="/post-item">
          <Button className="h-12 w-full rounded-xl text-base font-bold">
            <Plus className="mr-2 h-5 w-5" />
            LARGAR ITEM
          </Button>
        </Link>
      </div>

      {/* Items Grid */}
      <div className="px-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
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
          <div className="grid grid-cols-2 gap-3">
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

      <SearchHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
    </div>
  );
};

export default Index;
