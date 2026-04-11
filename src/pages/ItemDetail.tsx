import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Heart, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: item, isLoading } = useQuery({
    queryKey: ["item", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: isFavorited = false } = useQuery({
    queryKey: ["favorite", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("item_id", id!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!id && !!user,
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("item_id", id!)
          .eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ item_id: id!, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite", id] });
      toast.success(isFavorited ? "Removido dos favoritos" : "Adicionado aos favoritos");
    },
    onError: () => toast.error("Erro ao favoritar"),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="aspect-square w-full animate-pulse bg-muted" />
        <div className="space-y-3 p-4">
          <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-20 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <span className="text-4xl">😕</span>
        <p className="text-muted-foreground">Item não encontrado.</p>
        <Button variant="outline" className="rounded-xl" onClick={() => navigate("/")}>
          Voltar
        </Button>
      </div>
    );
  }

  const formattedPrice = item.price === 0 ? "Grátis" : `R$ ${Number(item.price).toFixed(2).replace(".", ",")}`;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="relative aspect-square w-full bg-muted">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-6xl">📦</span>
          </div>
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">{item.title}</h1>
          <p className="mt-1 text-2xl font-bold text-primary">{formattedPrice}</p>
        </div>

        {item.location && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {item.location}
          </p>
        )}

        {item.description && (
          <div>
            <h2 className="mb-1 text-sm font-semibold text-foreground">Descrição</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 flex gap-3 border-t border-border bg-background p-4">
        <Button
          variant="outline"
          className={`h-12 rounded-xl ${isFavorited ? "border-primary text-primary" : ""}`}
          onClick={() => toggleFavorite.mutate()}
          disabled={toggleFavorite.isPending}
        >
          <Heart className={`h-5 w-5 ${isFavorited ? "fill-primary" : ""}`} />
        </Button>
        <Button
          className="h-12 flex-1 rounded-xl text-base font-bold"
          onClick={() => toast.info("Chat em breve!")}
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          Chamar no chat
        </Button>
      </div>
    </div>
  );
};

export default ItemDetail;
