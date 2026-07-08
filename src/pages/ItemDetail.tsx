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

const DESCRIPTION_PREVIEW_LIMIT = 120;

const ItemDetail = () => {
  // 1. Variáveis ganham o prefixo "L" de Local
  const { id: LId } = useParams<{ id: string }>();
  const LNavigate = useNavigate();
  const { user: LUser } = useAuth();
  const LQueryClient = useQueryClient();
  const [LShowFullDescription, setShowFullDescription] = useState(false);
  const [LFavBounce, setFavBounce] = useState(false);
  const [LCarouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [LCurrentSlide, setCurrentSlide] = useState(0);
  const [LIsNavigatingToChat, setIsNavigatingToChat] = useState(false);

  useEffect(() => {
    if (!LCarouselApi) return;
    const LUpdate = () => setCurrentSlide(LCarouselApi.selectedScrollSnap());
    LUpdate();
    LCarouselApi.on("select", LUpdate);
    LCarouselApi.on("reInit", LUpdate);
    return () => {
      LCarouselApi.off("select", LUpdate);
      LCarouselApi.off("reInit", LUpdate);
    };
  }, [LCarouselApi]);

  // 2. Extração de lógica pesada para um método focado usando verbos (pesquisar)
  const pesquisarItem = async () => {
    const { data: LData, error: LError } = await supabase
      .from("itens")
      .select("*")
      .eq("id_it", LId!)
      .single();
    if (LError) throw LError;
    return LData;
  };

  const { data: LItem, isLoading: LIsLoading } = useQuery({
    queryKey: ["item", LId],
    queryFn: pesquisarItem,
    enabled: !!LId,
  });

  const pesquisarFavorito = async () => {
    const { data: LData } = await supabase
      .from("favoritos")
      .select("id_fa")
      .eq("item_fa", LId!)
      .eq("usuari_fa", LUser!.id)
      .maybeSingle();
    return !!LData;
  };

  const { data: LIsFavorited = false } = useQuery({
    queryKey: ["favorite", LId, LUser?.id],
    queryFn: pesquisarFavorito,
    enabled: !!LId && !!LUser,
  });

  const alternarFavorito = useMutation({
    mutationFn: async () => {
      if (!LUser) {
        LNavigate("/login");
        throw new Error("not-authed");
      }
      if (LIsFavorited) {
        const { error: LError } = await supabase
          .from("favoritos")
          .delete()
          .eq("item_fa", LId!)
          .eq("usuari_fa", LUser.id);
        if (LError) throw LError;
      } else {
        const { error: LError } = await supabase
          .from("favoritos")
          .insert({ item_fa: LId!, usuari_fa: LUser.id });
        if (LError) throw LError;
      }
    },
    onMutate: () => {
      setFavBounce(true);
      window.setTimeout(() => setFavBounce(false), 350);
    },
    onSuccess: () => {
      LQueryClient.invalidateQueries({ queryKey: ["favorite", LId] });
    },
    onError: (AError: Error) => {
      if (AError.message !== "not-authed") toast.error("Erro ao favoritar");
    },
  });

  const iniciarChat = useMutation({
    mutationFn: async () => {
      if (!LUser) {
        LNavigate("/login");
        throw new Error("not-authed");
      }
      if (!LItem) throw new Error("Missing item");
      if (LItem.usuari_it === LUser.id) return null;

      const { data: LExisting } = await supabase
        .from("conversas")
        .select("id_co")
        .eq("item_co", LItem.id_it)
        .eq("compra_co", LUser.id)
        .maybeSingle();
      if (LExisting) return LExisting.id_co;

      const { data: LData, error: LError } = await supabase
        .from("conversas")
        .insert({ item_co: LItem.id_it, compra_co: LUser.id, vended_co: LItem.usuari_it })
        .select("id_co")
        .maybeSingle();
      
      if (LError) {
        // 23505 = unique_violation no Postgres
        if (LError.code === "23505") {
          const { data: LRecovered } = await supabase
            .from("conversas")
            .select("id_co")
            .eq("item_co", LItem.id_it)
            .eq("compra_co", LUser.id)
            .maybeSingle();
          if (LRecovered) return LRecovered.id_co;
        }
        throw LError;
      }
      return LData?.id_co;
    },
    onSuccess: (AConvId) => {
      if (AConvId) {
        setIsNavigatingToChat(true);
        LNavigate(`/chat/${AConvId}`);
      }
    },
    onError: (AError: Error) => {
      if (AError.message !== "not-authed") toast.error("Erro ao iniciar conversa");
    },
  });

  const compartilharItem = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: LItem?.titulo_it,
          text: `Confere este item: ${LItem?.titulo_it}`,
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copiado!");
      }
    } catch (AErr) {
      // Ignora o erro de cancelamento do usuário
    }
  };

  if (LIsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[40vh] w-full animate-pulse bg-muted" />
        <div className="space-y-3 p-4">
          <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-8 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-20 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!LItem) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <span className="text-4xl">😕</span>
        <p className="text-muted-foreground">Item não encontrado.</p>
        <Button variant="outline" className="rounded-xl" onClick={() => LNavigate("/")}>
          Voltar
        </Button>
      </div>
    );
  }

  const LIsOwner = !!LUser && LUser.id === LItem.usuari_it;
  const LFormattedPrice =
    Number(LItem.preco_it) === 0 ? "Grátis" : Number(LItem.preco_it).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const LRawDescription = LItem.descri_it ?? "";
  
  let LExtractedCondition = "";
  let LCleanDescription = LRawDescription;
  
  const LEstadoMatch = LRawDescription.match(/^\[Estado:\s*([^\]]+)\](?:\n+)?/);
  if (LEstadoMatch) {
    LExtractedCondition = LEstadoMatch[1];
    LCleanDescription = LRawDescription.replace(LEstadoMatch[0], "").trim();
  }

  const LCondition = LExtractedCondition || (LItem as { condition?: string }).condition;
  const LDescription = LCleanDescription;
  const LIsLongDescription = LDescription.length > DESCRIPTION_PREVIEW_LIMIT;
  const LVisibleDescription =
    LIsLongDescription && !LShowFullDescription
      ? `${LDescription.slice(0, DESCRIPTION_PREVIEW_LIMIT).trimEnd()}…`
      : LDescription;

  const LItemImages: string[] =
    ((LItem as { fotos_it?: string[] | null }).fotos_it ?? []).filter(Boolean);
  const LGalleryImages =
    LItemImages.length > 0 ? LItemImages : LItem.imagem_it ? [LItem.imagem_it] : [];
  const LHasMultiple = LGalleryImages.length > 1;

  // 3. Quebra da view em variáveis com prefixos de interface
  const pnlImagem = (
    <div className="relative h-[40vh] w-full bg-muted overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-black/60 to-transparent" />

      {LGalleryImages.length === 0 ? (
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
            {LGalleryImages.map((AUrl, AIdx) => (
              <CarouselItem key={`${AUrl}-${AIdx}`} className="pl-0 basis-full h-full">
                <ProductImage src={AUrl} alt={`${LItem.titulo_it} — foto ${AIdx + 1}`} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}

      {LHasMultiple && (
        <>
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
            {LCurrentSlide + 1}/{LGalleryImages.length}
          </div>
          <div className="pointer-events-none absolute bottom-3 right-3 z-20 flex gap-1">
            {LGalleryImages.map((_, AIdx) => (
              <span
                key={AIdx}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-colors",
                  AIdx === LCurrentSlide ? "bg-primary" : "bg-background/70",
                )}
              />
            ))}
          </div>
        </>
      )}

      <button
        onClick={() => LNavigate(-1)}
        aria-label="Voltar"
        className="absolute left-2 top-[calc(env(safe-area-inset-top,0px)+8px)] z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white shadow-sm backdrop-blur-md transition-colors hover:bg-black/60"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="absolute right-2 top-[calc(env(safe-area-inset-top,0px)+8px)] z-20 flex items-center gap-2">
        {!LIsOwner && (
          <button
            onClick={() => alternarFavorito.mutate()}
            disabled={alternarFavorito.isPending}
            aria-label={LIsFavorited ? "Remover dos favoritos" : "Favoritar"}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white shadow-sm backdrop-blur-md transition-all hover:bg-black/60",
              LFavBounce && "scale-125"
            )}
          >
            <Heart 
              className="h-5 w-5 transition-colors"
              style={LIsFavorited ? { fill: "url(#fav-gradient)", stroke: "url(#fav-gradient)", filter: "url(#fav-shadow)" } : {}}
            />
          </button>
        )}
        <button
          onClick={compartilharItem}
          aria-label="Compartilhar"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white shadow-sm backdrop-blur-md transition-all hover:bg-black/60"
        >
          <Share className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const pnlInfoPrincipal = (
    <div className="space-y-6 px-4 pt-5">
      <div className="space-y-3">
        <h1 className="text-[22px] font-bold leading-tight text-foreground">{LItem.titulo_it}</h1>

        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-bold tracking-tight text-primary">{LFormattedPrice}</span>
        </div>

        <div className="space-y-2 pt-1 text-sm text-muted-foreground">
          {LItem.local_it && (
            <div className="flex items-center">
              <ItemLocation
                location={LItem.local_it}
                latitude={(LItem as any).latitu_it ?? null}
                longitude={(LItem as any).longit_it ?? null}
              />
            </div>
          )}

          <div className="flex items-center gap-6 pt-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(LItem.criado_it || new Date()), "'Hoje', HH:mm", { locale: ptBR })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>68</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        {LCondition && (
          <div className="flex items-center justify-between border-t border-border py-4">
            <span className="text-[15px] font-medium text-foreground">Condição</span>
            <span className="text-[15px] text-muted-foreground">{LCondition}</span>
          </div>
        )}

        {LDescription && (
          <div className={`space-y-2 border-t border-border ${LCondition ? 'pt-5' : 'pt-6'}`}>
            <h2 className="text-sm font-semibold text-foreground">Descrição</h2>
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-muted-foreground">
            {LVisibleDescription}
          </p>
          {LIsLongDescription && (
            <button
              onClick={() => setShowFullDescription((AV) => !AV)}
              className="text-sm font-medium text-primary hover:underline"
            >
              {LShowFullDescription ? "Ver menos" : "Ver mais"}
            </button>
          )}
        </div>
      )}
      </div>

      {LIsOwner && (
        <div className="mt-4 flex items-center justify-center rounded-xl border border-border bg-muted/40 p-3">
          <Badge variant="secondary" className="rounded-full">
            Este item é seu
          </Badge>
        </div>
      )}
    </div>
  );

  const pnlAcaoFixa = !LIsOwner ? (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-screen-sm items-center gap-3 p-4">
        <Button
          variant="outline"
          aria-label={LIsFavorited ? "Remover dos favoritos" : "Favoritar"}
          aria-pressed={LIsFavorited}
          className={cn(
            "h-12 w-12 shrink-0 rounded-xl p-0 transition-transform",
            LFavBounce && "scale-110",
          )}
          onClick={() => alternarFavorito.mutate()}
          disabled={alternarFavorito.isPending}
        >
          <Heart
            className={cn("h-5 w-5 transition-colors", !LIsFavorited && "text-foreground")}
            style={LIsFavorited ? { fill: "url(#fav-gradient)", stroke: "url(#fav-gradient)", filter: "url(#fav-shadow)" } : {}}
          />
        </Button>
        <Button
          className="h-12 flex-1 rounded-xl text-base font-semibold"
          onClick={() => iniciarChat.mutate()}
          disabled={iniciarChat.isPending || LIsNavigatingToChat}
        >
          {iniciarChat.isPending || LIsNavigatingToChat ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <>
              <MessageCircle className="mr-2 h-5 w-5" />
              Chamar no chat
            </>
          )}
        </Button>
      </div>
    </div>
  ) : null;

  // 5. O return da tela fica extremamente simples e sem lógica, como um lego
  return (
    <div className="min-h-screen bg-background pb-28">
      {pnlImagem}
      {pnlInfoPrincipal}
      {pnlAcaoFixa}
    </div>
  );
};

const ProductImage = ({ src: ASrc, alt: AAlt }: { src: string; alt: string }) => {
  const [LLoaded, setLoaded] = useState(false);
  const [LErrored, setErrored] = useState(false);
  return (
    <div className="relative h-full w-full bg-muted">
      {!LLoaded && !LErrored && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      {LErrored ? (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-6xl">📦</span>
        </div>
      ) : (
        <img
          src={ASrc}
          alt={AAlt}
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
