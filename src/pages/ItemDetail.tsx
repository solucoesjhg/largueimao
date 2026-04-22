import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Heart, MessageCircle, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DESCRIPTION_PREVIEW_LIMIT = 240;

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [favBounce, setFavBounce] = useState(false);

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
      if (!user) {
        navigate("/login");
        throw new Error("not-authed");
      }
      if (isFavorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("item_id", id!)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ item_id: id!, user_id: user.id });
        if (error) throw error;
      }
    },
    onMutate: () => {
      setFavBounce(true);
      window.setTimeout(() => setFavBounce(false), 350);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite", id] });
    },
    onError: (e: Error) => {
      if (e.message !== "not-authed") toast.error("Erro ao favoritar");
    },
  });

  const startChat = useMutation({
    mutationFn: async () => {
      if (!user) {
        navigate("/login");
        throw new Error("not-authed");
      }
      if (!item) throw new Error("Missing item");
      if (item.user_id === user.id) return null;

      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("item_id", item.id)
        .eq("buyer_id", user.id)
        .maybeSingle();
      if (existing) return existing.id;

      const { data, error } = await supabase
        .from("conversations")
        .insert({ item_id: item.id, buyer_id: user.id, seller_id: item.user_id })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (convId) => {
      if (convId) navigate(`/chat/${convId}`);
    },
    onError: (e: Error) => {
      if (e.message !== "not-authed") toast.error("Erro ao iniciar conversa");
    },
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

  const isOwner = !!user && user.id === item.user_id;
  const formattedPrice =
    Number(item.price) === 0 ? "Grátis" : `R$ ${Number(item.price).toFixed(2).replace(".", ",")}`;

  const condition = (item as { condition?: string }).condition;
  const description = item.description ?? "";
  const isLongDescription = description.length > DESCRIPTION_PREVIEW_LIMIT;
  const visibleDescription =
    isLongDescription && !showFullDescription
      ? `${description.slice(0, DESCRIPTION_PREVIEW_LIMIT).trimEnd()}…`
      : description;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* IMAGEM */}
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
          aria-label="Voltar"
          className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-background/85 shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>

        {!isOwner && (
          <button
            onClick={() => toggleFavorite.mutate()}
            disabled={toggleFavorite.isPending}
            aria-label={isFavorited ? "Remover dos favoritos" : "Favoritar"}
            aria-pressed={isFavorited}
            className={cn(
              "absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-background/85 shadow-sm backdrop-blur-sm transition-all hover:bg-background",
              favBounce && "scale-125",
            )}
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-colors",
                isFavorited ? "fill-primary text-primary" : "text-foreground",
              )}
            />
          </button>
        )}
      </div>

      {/* INFO PRINCIPAL */}
      <div className="space-y-5 px-4 pt-5">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold leading-tight text-foreground">{item.title}</h1>
          <p className="text-3xl font-bold tracking-tight text-primary">{formattedPrice}</p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {item.location && (
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {item.location}
              </span>
            )}
            {condition && (
              <Badge variant="secondary" className="rounded-full font-medium">
                {condition}
              </Badge>
            )}
          </div>
        </div>

        {/* DESCRIÇÃO */}
        {description && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Descrição</h2>
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-muted-foreground">
              {visibleDescription}
            </p>
            {isLongDescription && (
              <button
                onClick={() => setShowFullDescription((v) => !v)}
                className="text-sm font-medium text-primary hover:underline"
              >
                {showFullDescription ? "Ver menos" : "Ver mais"}
              </button>
            )}
          </div>
        )}

        {/* STATUS — item próprio */}
        {isOwner && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3">
            <Badge variant="secondary" className="rounded-full">
              Este item é seu
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-primary hover:text-primary"
              onClick={() => navigate(`/post?edit=${item.id}`)}
            >
              <Pencil className="h-4 w-4" />
              Editar anúncio
            </Button>
          </div>
        )}
      </div>

      {/* AÇÃO FIXA */}
      {!isOwner && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-screen-sm items-center gap-3 p-4">
            <Button
              variant="outline"
              aria-label={isFavorited ? "Remover dos favoritos" : "Favoritar"}
              aria-pressed={isFavorited}
              className={cn(
                "h-12 w-12 shrink-0 rounded-xl p-0 transition-transform",
                isFavorited && "border-primary",
                favBounce && "scale-110",
              )}
              onClick={() => toggleFavorite.mutate()}
              disabled={toggleFavorite.isPending}
            >
              <Heart
                className={cn(
                  "h-5 w-5 transition-colors",
                  isFavorited ? "fill-primary text-primary" : "text-foreground",
                )}
              />
            </Button>
            <Button
              className="h-12 flex-1 rounded-xl text-base font-semibold"
              onClick={() => startChat.mutate()}
              disabled={startChat.isPending}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Chamar no chat
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetail;
