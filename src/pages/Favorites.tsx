import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ItemCard from "@/components/ItemCard";
import BottomNav from "@/components/BottomNav";
import SearchHeader from "@/components/SearchHeader";
import DelayedSpinner from "@/components/DelayedSpinner";

const Favorites = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["favorites-items", user?.id],
    queryFn: async () => {
      const { data: favs, error: favError } = await supabase
        .from("favoritos")
        .select("item_fa")
        .eq("usuari_fa", user!.id);
        
      if (favError) throw favError;
      if (!favs?.length) return [];

      const itemIds = favs.map((f) => f.item_fa);
      
      const { data: itemsData, error: itemsError } = await supabase
        .from("itens")
        .select("*")
        .in("id_it", itemIds)
        .eq("status_it", "active");
        
      if (itemsError) throw itemsError;
      return itemsData || [];
    },
    enabled: !!user,
  });

  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = items.filter((item) =>
    item.titulo_it?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pnlLoading = (
    <div className="relative w-full">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <DelayedSpinner isLoading={isLoading} />
      </div>
    </div>
  );

  const pnlTopo = (
    <header className="sticky top-0 z-40 bg-background pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-center border-b border-border px-4 py-3">
        <h1 className="text-lg font-bold text-foreground">Favoritos</h1>
      </div>
    </header>
  );

  return (
    <div className="flex h-[100dvh] flex-col bg-background overflow-hidden">
      {pnlTopo}

      <div className="flex-1 overflow-y-auto px-4 pt-4">
        {isLoading ? (
          pnlLoading
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Heart className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum favorito encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-6">
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id_it}
                id={item.id_it}
                title={item.titulo_it}
                price={item.preco_it}
                location={item.local_it}
                latitude={item.latitu_it}
                longitude={item.longit_it}
                imageUrl={item.imagem_it}
                images={item.fotos_it}
                onClick={() => navigate(`/item/${item.id_it}`, { state: { initialItem: item } })}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav 
        topContent={
          <div className="w-full pt-3 pb-1.5 px-4">
            <SearchHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          </div>
        }
      />
    </div>
  );
};

export default Favorites;
