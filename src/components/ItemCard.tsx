import { useState } from "react";
import { MapPin, ImageIcon, Heart } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ItemCardProps {
  id?: string;
  title: string;
  price: number | string;
  location?: string | null;
  imageUrl?: string | null;
  images?: string[] | null;
  onClick?: () => void;
}

const ItemCard = ({ id, title, price, location, imageUrl, images, onClick }: ItemCardProps) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const total = images?.length || (imageUrl ? 1 : 0);
  const cover = imageUrl || images?.[0] || null;

  const formattedPrice =
    Number(price) === 0 ? "Grátis" : `R$ ${Number(price).toFixed(2).replace(".", ",")}`;

  // Query otimizada: busca todos os favoritos do usuário logado e guarda num Set
  const { data: userFavs } = useQuery({
    queryKey: ["user-favorites", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("favoritos").select("item_fa").eq("usuari_fa", user!.id);
      return new Set((data || []).map(f => f.item_fa));
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  const isFavorited = id && userFavs?.has(id);

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!user) {
        navigate("/login");
        throw new Error("not-authed");
      }
      if (!id) throw new Error("No item ID");
      
      if (isFavorited) {
        const { error } = await supabase
          .from("favoritos")
          .delete()
          .eq("item_fa", id)
          .eq("usuari_fa", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favoritos")
          .insert({ item_fa: id, usuari_fa: user.id });
        if (error) throw error;
      }
    },
    onMutate: async () => {
      if (!user || !id) return;
      await queryClient.cancelQueries({ queryKey: ["user-favorites", user.id] });
      const previousFavs = queryClient.getQueryData<Set<string>>(["user-favorites", user.id]);
      
      queryClient.setQueryData<Set<string>>(["user-favorites", user.id], (old) => {
        const newFavs = new Set(old || []);
        if (isFavorited) newFavs.delete(id);
        else newFavs.add(id);
        return newFavs;
      });
      return { previousFavs };
    },
    onError: (err, variables, context) => {
      if (err.message !== "not-authed") toast.error("Erro ao favoritar");
      if (context?.previousFavs && user) {
        queryClient.setQueryData(["user-favorites", user.id], context.previousFavs);
      }
    },
    onSettled: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ["user-favorites", user.id] });
        queryClient.invalidateQueries({ queryKey: ["favorite", id, user.id] });
        queryClient.invalidateQueries({ queryKey: ["favorites-items", user.id] });
      }
    },
  });

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite.mutate();
  };

  return (
    <div
      onClick={onClick}
      className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left cursor-pointer transition-shadow hover:shadow-md relative"
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-muted group">
        {cover && !errored ? (
          <>
            {!loaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
            <img
              src={cover}
              alt={title}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              onError={() => setErrored(true)}
              className="h-full w-full object-cover"
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <span className="text-3xl">📦</span>
          </div>
        )}
        
        {/* Botão de Curtir */}
        {id && (
          <button
            type="button"
            onClick={handleLikeClick}
            disabled={toggleFavorite.isPending}
            className="absolute bottom-1.5 right-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur-sm transition-transform active:scale-90 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            aria-label={isFavorited ? "Remover dos favoritos" : "Favoritar"}
          >
            <Heart className={cn("h-4 w-4 transition-colors", isFavorited ? "fill-primary text-primary" : "")} />
          </button>
        )}

        {total > 1 && (
          <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-md bg-background/85 px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow-sm backdrop-blur-sm">
            <ImageIcon className="h-2.5 w-2.5" />
            {total}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-2">
        <p className="line-clamp-2 text-xs font-medium text-foreground">{title}</p>
        <div className="mt-auto pt-1 space-y-0.5">
          <p className="text-sm font-bold text-primary">{formattedPrice}</p>
          <div className="flex h-3.5 items-center gap-0.5 text-[10px] text-muted-foreground">
            {location && (
              <>
                <MapPin className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{location}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
