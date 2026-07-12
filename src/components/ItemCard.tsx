import { useState } from "react";
import { MapPin, ImageIcon, Heart, Eye } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { getCachedUserCoords, haversine, formatDistance } from "@/components/ItemLocation";

interface ItemCardProps {
  id?: string;
  title: string;
  price: number | string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
  images?: string[] | null;
  views?: number;
  onClick?: () => void;
}
//testesdfsfd
const ItemCard = ({ id: AId, title: ATitle, price: APrice, location: ALocation, latitude: ALatitude, longitude: ALongitude, imageUrl: AImageUrl, images: AImages, views: AViews, onClick: AOnClick }: ItemCardProps) => {
  // 1. Variáveis ganham o prefixo "L" de Local
  const [LLoaded, setLoaded] = useState(false);
  const [LErrored, setErrored] = useState(false);
  const { user: LUser } = useAuth();
  const LNavigate = useNavigate();
  const LQueryClient = useQueryClient();

  const LTotal = AImages?.length || (AImageUrl ? 1 : 0);
  const LCover = AImageUrl || AImages?.[0] || null;

  const LFormattedPrice =
    Number(APrice) === 0
      ? "Grátis"
      : `R$ ${Number(APrice) % 1 === 0 ? Number(APrice).toLocaleString("pt-BR") : Number(APrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const LUserCoords = getCachedUserCoords();
  const LDistance = 
    typeof ALatitude === "number" && typeof ALongitude === "number" && LUserCoords
      ? haversine(LUserCoords, { lat: ALatitude, lon: ALongitude })
      : null;

  // 2. Extração de lógica pesada para um método focado usando verbos (pesquisar)
  const pesquisarFavoritosUsuario = async () => {
    const { data: LData } = await supabase.from("favoritos").select("item_fa").eq("usuari_fa", LUser!.id);
    return new Set((LData || []).map(AFav => AFav.item_fa));
  };

  const { data: LIsFavorited = false } = useQuery({
    queryKey: ["user-favorites", LUser?.id],
    queryFn: pesquisarFavoritosUsuario,
    enabled: !!LUser,
    staleTime: 1000 * 60 * 5,
    select: (favSet) => (AId ? favSet.has(AId) : false),
  });

  const alternarFavorito = useMutation({
    mutationFn: async () => {
      if (!LUser) {
        LNavigate("/login");
        throw new Error("not-authed");
      }
      if (!AId) throw new Error("No item ID");
      
      if (LIsFavorited) {
        const { error: LError } = await supabase
          .from("favoritos")
          .delete()
          .eq("item_fa", AId)
          .eq("usuari_fa", LUser.id);
        if (LError) throw LError;
      } else {
        const { error: LError } = await supabase
          .from("favoritos")
          .insert({ item_fa: AId, usuari_fa: LUser.id });
        if (LError) throw LError;
      }
    },
    onMutate: async () => {
      if (!LUser || !AId) return;
      await LQueryClient.cancelQueries({ queryKey: ["user-favorites", LUser.id] });
      const LPreviousFavs = LQueryClient.getQueryData<Set<string>>(["user-favorites", LUser.id]);
      
      LQueryClient.setQueryData<Set<string>>(["user-favorites", LUser.id], (AOld) => {
        const LNewFavs = new Set(AOld || []);
        if (LIsFavorited) LNewFavs.delete(AId);
        else LNewFavs.add(AId);
        return LNewFavs;
      });
      return { LPreviousFavs };
    },
    onError: (AError, AVariables, AContext) => {
      if (AError.message !== "not-authed") toast.error("Erro ao favoritar");
      if (AContext?.LPreviousFavs && LUser) {
        LQueryClient.setQueryData(["user-favorites", LUser.id], AContext.LPreviousFavs);
      }
    },
    onSettled: () => {
      if (LUser) {
        LQueryClient.invalidateQueries({ queryKey: ["user-favorites", LUser.id] });
        LQueryClient.invalidateQueries({ queryKey: ["favorite", AId, LUser.id] });
        LQueryClient.invalidateQueries({ queryKey: ["favorites-items", LUser.id] });
      }
    },
  });

  // 4. Parâmetros iterativos e callbacks ganham prefixo "A"
  const lidarComCurtida = (AEvent: React.MouseEvent) => {
    AEvent.stopPropagation();
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    alternarFavorito.mutate();
  };

  // 5. O return da tela fica extremamente simples e sem lógica
  return (
    <div
      onClick={AOnClick}
      className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left cursor-pointer transition-shadow hover:shadow-md relative select-none [-webkit-touch-callout:none] transform-gpu translate-z-0 will-change-transform"
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-muted group">
        {LCover && !LErrored ? (
          <>
            {!LLoaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
            <img
              src={LCover}
              alt={ATitle}
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
        

        {LTotal > 1 && (
          <div className="absolute right-1.5 bottom-1.5 flex items-center gap-0.5 rounded-md bg-background/85 px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow-sm backdrop-blur-sm">
            <ImageIcon className="h-2.5 w-2.5" />
            {LTotal}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-2">
        <p className="line-clamp-2 text-xs font-medium text-foreground">{ATitle}</p>
        <div className="mt-auto pt-1 flex items-end justify-between gap-1">
          <div className="space-y-0.5 overflow-hidden">
            <span className="block truncate text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-emerald-800" style={{ fontFamily: "'Nunito', sans-serif" }}>{LFormattedPrice}</span>
            <div className="flex h-3.5 items-center gap-1 text-[10px] text-muted-foreground">
              {LDistance !== null && (
                <>
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  <span className="shrink-0 font-medium whitespace-nowrap text-primary">{formatDistance(LDistance)}</span>
                </>
              )}
            </div>
          </div>
          
          {AViews !== undefined ? (
            <div className="flex h-7 shrink-0 items-center gap-1.5 px-1 text-muted-foreground" aria-label={`${AViews} visualizações`}>
              <Eye className="h-4 w-4" />
              <span className="text-xs font-semibold">{AViews}</span>
            </div>
          ) : AId ? (
            <button
              type="button"
              onClick={lidarComCurtida}
              disabled={alternarFavorito.isPending}
              className="flex h-7 w-7 shrink-0 items-center justify-center transition-transform active:scale-90"
              aria-label={LIsFavorited ? "Remover dos favoritos" : "Favoritar"}
            >
              <Heart 
                className={cn("h-5 w-5 transition-colors", LIsFavorited ? "text-[#253b2a] dark:text-[#8fce9e]" : "text-muted-foreground hover:text-foreground")} 
                style={LIsFavorited ? { fill: "url(#fav-gradient)", filter: "url(#fav-shadow)" } : {}}
              />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
