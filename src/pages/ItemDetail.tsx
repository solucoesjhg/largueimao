import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, MessageCircle, Pencil, Share, Camera, Calendar, Eye, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ItemLocation } from "@/components/ItemLocation";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
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
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;
    const update = () => setCurrentSlide(carouselApi.selectedScrollSnap());
    update();
    carouselApi.on("select", update);
    carouselApi.on("reInit", update);
    return () => {
      carouselApi.off("select", update);
      carouselApi.off("reInit", update);
    };
  }, [carouselApi]);

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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: item?.title,
          text: `Confere este item: ${item?.title}`,
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copiado!");
      }
    } catch (err) {
      // Ignora o erro de cancelamento do usuário
    }
  };

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

  const itemImages: string[] =
    ((item as { images?: string[] | null }).images ?? []).filter(Boolean);
  const galleryImages =
    itemImages.length > 0 ? itemImages : item.image_url ? [item.image_url] : [];
  const hasMultiple = galleryImages.length > 1;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* IMAGEM */}
      <div className="relative aspect-[4/3] w-full bg-muted">
        {/* Top gradient for visibility of icons */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-black/60 to-transparent" />

        {galleryImages.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-6xl">📦</span>
          </div>
        ) : (
          <Carousel
            setApi={setCarouselApi}
            opts={{ loop: false, align: "start" }}
            className="h-full w-full"
          >
            <CarouselContent className="ml-0 h-full">
              {galleryImages.map((url, idx) => (
                <CarouselItem key={`${url}-${idx}`} className="pl-0 basis-full">
                  <ProductImage src={url} alt={`${item.title} — foto ${idx + 1}`} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        )}

        {hasMultiple && (
          <>
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
              {currentSlide + 1}/{galleryImages.length}
            </div>
            <div className="pointer-events-none absolute bottom-3 right-3 z-20 flex gap-1">
              {galleryImages.map((_, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors",
                    idx === currentSlide ? "bg-primary" : "bg-background/70",
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Action Icons (Top) */}
        <button
          onClick={() => navigate(-1)}
          aria-label="Voltar"
          className="absolute left-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white shadow-sm backdrop-blur-md transition-colors hover:bg-black/60"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="absolute right-2 top-2 z-20 flex items-center gap-2">
          {!isOwner && (
            <button
              onClick={() => toggleFavorite.mutate()}
              disabled={toggleFavorite.isPending}
              aria-label={isFavorited ? "Remover dos favoritos" : "Favoritar"}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white shadow-sm backdrop-blur-md transition-all hover:bg-black/60",
                favBounce && "scale-125"
              )}
            >
              <Heart className={cn("h-5 w-5 transition-colors", isFavorited ? "fill-white" : "")} />
            </button>
          )}
          <button
            onClick={handleShare}
            aria-label="Compartilhar"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white shadow-sm backdrop-blur-md transition-all hover:bg-black/60"
          >
            <Share className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* INFO PRINCIPAL */}
      <div className="space-y-6 px-4 pt-5">
        <div className="space-y-4">
          <h1 className="text-[22px] font-semibold leading-tight text-foreground">{item.title}</h1>
          
          <div>
            <p className="text-[28px] font-bold tracking-tight text-primary">{formattedPrice}</p>
            {condition && (
              <p className="mt-1 text-sm font-medium text-muted-foreground">{condition}</p>
            )}
          </div>

          {/* Meta Data (Local, Data, Views) */}
          <div className="space-y-3 pt-2 text-sm text-foreground">
            {item.location && (
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <ItemLocation
                    location={item.location}
                    latitude={(item as any).latitude ?? null}
                    longitude={(item as any).longitude ?? null}
                  />
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(item.created_at || new Date()), "'Hoje', HH:mm", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>68</span>
              </div>
            </div>
          </div>
        </div>

        {/* DESCRIÇÃO */}
        {description && (
          <div className="space-y-2 border-t border-border pt-6">
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
          <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3">
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

const ProductImage = ({ src, alt }: { src: string; alt: string }) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  return (
    <div className="relative aspect-[4/3] w-full bg-muted">
      {!loaded && !errored && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      {errored ? (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-6xl">📦</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className="h-full w-full object-cover"
          draggable={false}
        />
      )}
    </div>
  );
};

export default ItemDetail;
