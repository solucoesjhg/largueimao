import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, MessageCircle, Pencil, Share as ShareIcon, Camera, Calendar, Eye, ChevronRight, X } from "lucide-react";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";
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

const DESCRIPTION_PREVIEW_LIMIT = 150;

const ItemDetail = () => {
  // 1. Variáveis ganham o prefixo "L" de Local
  const { id: LId } = useParams<{ id: string }>();
  const LNavigate = useNavigate();
  const LLocation = useLocation();
  const { user: LUser } = useAuth();
  const LQueryClient = useQueryClient();
  const [LShowFullDescription, setShowFullDescription] = useState(false);
  const [LFavBounce, setFavBounce] = useState(false);
  const [LCarouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [LCurrentSlide, setCurrentSlide] = useState(0);
  const [LIsNavigatingToChat, setIsNavigatingToChat] = useState(false);
  
  const [LIsImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [LViewerInitialSlide, setViewerInitialSlide] = useState(0);
  const [LViewerStartY, setViewerStartY] = useState(0);

  const LInitialItem = LLocation.state?.initialItem as any;

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
    initialData: LInitialItem,
  });

  // Efeito para incrementar as visualizações
  useEffect(() => {
    if (LItem && LUser && LItem.dono_it !== LUser.id) {
      // Chama a função RPC para incrementar de forma segura
      supabase.rpc('incrementar_visualizacao', { item_id: LId })
        .then(() => {
          // Opcional: invalidar a query para forçar atualização ou assumir que +1 já tá bom.
          // Como é detalhe, na próxima vez que abrir já vem atualizado.
        })
        .catch(console.error);
    }
  }, [LItem?.id_it, LUser?.id]);

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
      const shareUrl = `https://largueimao.com.br/item/${LItem?.id_it}`;
      const title = `Larguei Mão - ${LItem?.titulo_it || "Item"}`;
      const text = `🔥 Olha o que eu achei no Larguei Mão!\n\n🏷️ *${LItem?.titulo_it || "Item"}*\n💰 ${LFormattedPrice}\n\nPara ver mais detalhes ou falar com o dono, acesse o link abaixo:\n${shareUrl}`;

      let localImageUri = "";

      // Try to download the first image to share it directly
      if (LGalleryImages.length > 0) {
        try {
          const imageUrl = LGalleryImages[0];
          // Fetch image and convert to Base64
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              // Remove the prefix "data:image/jpeg;base64,"
              const base64String = result.split(',')[1] || result;
              resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          // Save to Cache Directory
          const fileName = `share_item_${LItem?.id_it}.jpg`;
          const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Cache,
          });
          
          localImageUri = savedFile.uri;
        } catch (imgErr) {
          console.error("Erro ao preparar imagem para compartilhamento", imgErr);
        }
      }

      await Share.share({
        title,
        text,
        url: shareUrl, // The link to the app/website
        dialogTitle: 'Compartilhar',
        ...(localImageUri ? { files: [localImageUri] } : {}),
      });
    } catch (AErr) {
      // Fallback
      navigator.clipboard.writeText(`https://largueimao.com.br/item/${LItem?.id_it}`);
      toast.success("Link copiado!");
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
    Number(LItem?.preco_it) === 0
      ? "Grátis"
      : `R$ ${Number(LItem?.preco_it) % 1 === 0 ? Number(LItem?.preco_it).toLocaleString("pt-BR") : Number(LItem?.preco_it).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

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
                <ProductImage 
                  src={AUrl} 
                  alt={`${LItem.titulo_it} — foto ${AIdx + 1}`} 
                  onClick={() => {
                    setViewerInitialSlide(AIdx);
                    setIsImageViewerOpen(true);
                  }}
                />
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
          <div className="pointer-events-none absolute bottom-3 right-3 z-20 flex gap-1.5">
            {LGalleryImages.map((_, AIdx) => (
              <span
                key={AIdx}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-all",
                  AIdx === LCurrentSlide 
                    ? "bg-primary dark:bg-[#8fce9e] dark:shadow-[0_0_8px_rgba(143,206,158,0.8)] w-3" 
                    : "bg-background/70 dark:bg-background/50",
                )}
              />
            ))}
          </div>
        </>
      )}

      <button
        onClick={() => LNavigate(-1)}
        aria-label="Voltar"
        className="absolute left-2 top-[env(safe-area-inset-top)] mt-2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white shadow-sm backdrop-blur-md transition-colors hover:bg-black/60"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

    </div>
  );

  const pnlInfoPrincipal = (
    <div className="space-y-6 px-4 pt-5">
      <div className="space-y-3">
        <h1 className="text-[22px] font-bold leading-tight text-foreground">{LItem.titulo_it}</h1>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-emerald-800 drop-shadow-sm" style={{ fontFamily: "'Nunito', sans-serif" }}>{LFormattedPrice}</span>
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
              <span>{LItem?.visualizacoes || 0}</span>
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

  const pnlAcaoFixa = (
    <div className="fixed bottom-6 mb-[env(safe-area-inset-bottom,0px)] left-0 right-0 z-50 flex justify-center gap-3 px-4 pointer-events-none">
      {LIsOwner ? (
        <button
          onClick={compartilharItem}
          className="pointer-events-auto h-14 w-full max-w-[240px] rounded-full flex items-center justify-center bg-[#8fce9e]/50 dark:bg-background/80 shadow-[0_8px_30px_rgb(0,0,0,0.1),_inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#8fce9e]/50 dark:border-[#8fce9e]/30 backdrop-blur-xl saturate-150 text-[#253b2a] dark:text-[#8fce9e] transition-transform active:scale-[0.98] font-bold text-base"
        >
          <ShareIcon className="h-5 w-5 mr-2" />
          Compartilhar anúncio
        </button>
      ) : (
        <>
          <button
            type="button"
            className="pointer-events-auto h-14 flex-1 max-w-[240px] rounded-full text-base font-bold bg-[#8fce9e]/50 dark:bg-background/80 shadow-[0_8px_30px_rgb(0,0,0,0.1),_inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#8fce9e]/50 dark:border-[#8fce9e]/30 backdrop-blur-xl saturate-150 text-[#253b2a] dark:text-[#8fce9e] transition-transform active:scale-[0.98] flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
            onClick={() => iniciarChat.mutate()}
            disabled={iniciarChat.isPending || LIsNavigatingToChat}
          >
            {iniciarChat.isPending || LIsNavigatingToChat ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <>
                <MessageCircle className="mr-2 h-5 w-5 text-current" />
                Chamar no chat
              </>
            )}
          </button>

          <button
            onClick={() => alternarFavorito.mutate()}
            disabled={alternarFavorito.isPending}
            aria-label={LIsFavorited ? "Remover dos favoritos" : "Favoritar"}
            className={cn(
              "pointer-events-auto h-14 w-14 shrink-0 rounded-full flex items-center justify-center bg-[#8fce9e]/50 dark:bg-background/80 shadow-[0_8px_30px_rgb(0,0,0,0.1),_inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#8fce9e]/50 dark:border-[#8fce9e]/30 backdrop-blur-xl saturate-150 text-[#253b2a] dark:text-[#8fce9e] transition-transform active:scale-[0.98]",
              LFavBounce && "scale-125"
            )}
          >
            <Heart 
              className="h-6 w-6 transition-colors"
              style={LIsFavorited ? { fill: "url(#fav-gradient)", filter: "url(#fav-shadow)" } : {}}
            />
          </button>

          <button
            onClick={compartilharItem}
            aria-label="Compartilhar"
            className="pointer-events-auto h-14 w-14 shrink-0 rounded-full flex items-center justify-center bg-[#8fce9e]/50 dark:bg-background/80 shadow-[0_8px_30px_rgb(0,0,0,0.1),_inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#8fce9e]/50 dark:border-[#8fce9e]/30 backdrop-blur-xl saturate-150 text-[#253b2a] dark:text-[#8fce9e] transition-transform active:scale-[0.98]"
          >
            <ShareIcon className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  );

  // 5. O return da tela fica extremamente simples e sem lógica, como um lego
  return (
    <div className="min-h-screen bg-background pb-36">
      {pnlImagem}
      {pnlInfoPrincipal}
      {pnlAcaoFixa}

      {/* Image Viewer Full Screen Overlay */}
      {LIsImageViewerOpen && (
        <div 
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md"
          onTouchStart={(e) => setViewerStartY(e.touches[0].clientY)}
          onTouchEnd={(e) => {
            if (e.changedTouches[0].clientY - LViewerStartY > 70) setIsImageViewerOpen(false);
          }}
        >
          <button 
            onClick={() => setIsImageViewerOpen(false)}
            aria-label="Fechar visualização de imagem"
            className="absolute right-4 top-[calc(env(safe-area-inset-top,20px)+8px)] z-[110] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          
          <Carousel
            opts={{ loop: false, align: "start", startIndex: LViewerInitialSlide }}
            className="h-full w-full"
          >
            <CarouselContent className="ml-0 h-full">
              {LGalleryImages.map((AUrl, AIdx) => (
                <CarouselItem key={`${AUrl}-${AIdx}-viewer`} className="pl-0 basis-full h-full flex items-center justify-center">
                  <div className="relative flex h-full w-full items-center justify-center p-4">
                    <img 
                      src={AUrl} 
                      alt={`Visualização em tela cheia ${AIdx + 1}`} 
                      className="max-h-full max-w-full object-contain"
                      draggable={false}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      )}
    </div>
  );
};

const ProductImage = ({ src: ASrc, alt: AAlt, onClick }: { src: string; alt: string; onClick?: () => void }) => {
  const [LLoaded, setLoaded] = useState(false);
  const [LErrored, setErrored] = useState(false);
  return (
    <div className="relative h-full w-full bg-muted" onClick={onClick}>
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
          className="h-full w-full object-cover cursor-pointer"
          draggable={false}
        />
      )}
    </div>
  );
};

export default ItemDetail;
