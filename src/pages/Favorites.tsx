import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ItemCard from "@/components/ItemCard";
import BottomNav from "@/components/BottomNav";

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
      if (!favs.length) return [];

      const ids = favs.map((f) => f.item_fa);
      const { data, error } = await supabase
        .from("itens")
        .select("*")
        .in("id_it", ids)
        .eq("status_it", "active");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-background px-4 py-3">
        <button onClick={() => navigate("/")} className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Favoritos</h1>
      </header>

      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Heart className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum favorito ainda.</p>
            <p className="text-sm text-muted-foreground">Toque no ❤️ nos itens pra salvar aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <ItemCard
                key={item.id_it}
                title={item.titulo_it}
                price={item.preco_it}
                location={item.local_it}
                imageUrl={item.imagem_it}
                onClick={() => navigate(`/item/${item.id_it}`)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Favorites;
