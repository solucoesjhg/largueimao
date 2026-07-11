import { useEffect, useState } from "react";
import { MapPin, Navigation, Copy, ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type Coords = { lat: number; lon: number };

export const LOCATION_CACHE_PREFIX = "geo:";
export const USER_COORDS_KEY = "user-coords";
export const USER_COORDS_TTL = 1000 * 60 * 30; // 30 min
export const GEO_DENIED_KEY = "geo-denied";

export const isGeoDenied = () => {
  try {
    return sessionStorage.getItem(GEO_DENIED_KEY) === "1";
  } catch {
    return false;
  }
};
export const markGeoDenied = () => {
  try {
    sessionStorage.setItem(GEO_DENIED_KEY, "1");
  } catch {
    /* noop */
  }
};

const isIOS = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

export function haversine(a: Coords, b: Coords) {
  const R = 6371; // km
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters}m`;
  }
  return `${km.toFixed(1).replace(".", ",")}km`;
}

export function getShortLocation(location: string): string {
  if (!location) return "";

  // Remove a parte do CEP (formato "Endereço • CEP 12345")
  let short = location.split(" • ")[0].trim();

  // Remove a parte do Estado (formato "Cidade - UF")
  short = short.split(" - ")[0].trim();

  // Para endereços muito longos separados por vírgula (ex: Rua, Bairro, Cidade, Estado)
  const parts = short.split(",").map((p) => p.trim());
  if (parts.length >= 4) {
    // Pegamos apenas o Bairro e Cidade (geralmente posições 1 e 2 após a rua)
    return parts.slice(1, 3).join(", ");
  }

  return short;
}

async function geocode(query: string): Promise<Coords | null> {
  try {
    const cached = localStorage.getItem(LOCATION_CACHE_PREFIX + query);
    if (cached) return JSON.parse(cached);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
        query,
      )}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data?.length) return null;
    const coords: Coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    localStorage.setItem(LOCATION_CACHE_PREFIX + query, JSON.stringify(coords));
    return coords;
  } catch {
    return null;
  }
}

export function getCachedUserCoords(): Coords | null {
  try {
    const raw = localStorage.getItem(USER_COORDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { coords: Coords; ts: number };
    if (Date.now() - parsed.ts > USER_COORDS_TTL) return null;
    return parsed.coords;
  } catch {
    return null;
  }
}

export function setCachedUserCoords(coords: Coords) {
  localStorage.setItem(
    USER_COORDS_KEY,
    JSON.stringify({ coords, ts: Date.now() }),
  );
}

interface ItemLocationProps {
  location: string;
  latitude?: number | null;
  longitude?: number | null;
}

export const ItemLocation = ({ location, latitude, longitude }: ItemLocationProps) => {
  const presetCoords: Coords | null =
    typeof latitude === "number" && typeof longitude === "number"
      ? { lat: latitude, lon: longitude }
      : null;

  const [open, setOpen] = useState(false);
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [itemCoords, setItemCoords] = useState<Coords | null>(presetCoords);
  const [userCoords, setUserCoords] = useState<Coords | null>(getCachedUserCoords());
  const [requesting, setRequesting] = useState(false);

  // Geocode the item location only if no preset coords are provided.
  useEffect(() => {
    if (presetCoords) {
      setItemCoords(presetCoords);
      return;
    }
    let cancelled = false;
    geocode(location).then((c) => {
      if (!cancelled) setItemCoords(c);
    });
    return () => {
      cancelled = true;
    };
  }, [location, presetCoords?.lat, presetCoords?.lon]);

  const distance =
    itemCoords && userCoords ? haversine(userCoords, itemCoords) : null;

  const requestUserLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocalização não disponível neste dispositivo");
      setPermissionOpen(false);
      return;
    }
    setRequesting(true);
    // Triggers the native OS / browser permission prompt.
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setUserCoords(coords);
        setCachedUserCoords(coords);
        setRequesting(false);
        setPermissionOpen(false);
      },
      (err) => {
        setRequesting(false);
        setPermissionOpen(false);
        if (err.code === err.PERMISSION_DENIED) {
          markGeoDenied();
        } else {
          toast.error("Não foi possível obter sua localização");
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 1000 * 60 * 5 },
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(location);
      toast.success("Localização copiada", { position: "top-center" });
    } catch {
      toast.error("Não foi possível copiar");
    }
    setOpen(false);
  };

  const buildMapUrl = (provider: "google" | "apple" | "geo") => {
    const q = encodeURIComponent(location);
    if (provider === "google") {
      return itemCoords
        ? `https://www.google.com/maps/dir/?api=1&destination=${itemCoords.lat},${itemCoords.lon}`
        : `https://www.google.com/maps/search/?api=1&query=${q}`;
    }
    if (provider === "apple") {
      return itemCoords
        ? `https://maps.apple.com/?daddr=${itemCoords.lat},${itemCoords.lon}&dirflg=d`
        : `https://maps.apple.com/?q=${q}`;
    }
    return itemCoords
      ? `geo:${itemCoords.lat},${itemCoords.lon}?q=${itemCoords.lat},${itemCoords.lon}(${q})`
      : `geo:0,0?q=${q}`;
  };

  const openMap = (provider: "google" | "apple") => {
    window.open(buildMapUrl(provider), "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const showAppleOption = isIOS();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group inline-flex max-w-full items-center gap-2 rounded-lg px-2 py-1 -mx-2 text-left",
          "transition-colors hover:bg-muted active:bg-muted/70",
        )}
        aria-label={`Ver opções de localização: ${location}`}
      >
        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm font-medium text-foreground">
          {getShortLocation(location)}
        </span>
        {distance !== null && (
          <span className="shrink-0 text-xs text-muted-foreground">
            · {formatDistance(distance)}
          </span>
        )}
        {/* O texto "Ver distância" foi removido a pedido do usuário */}
      </button>

      {/* Bottom sheet — actions */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0">
          <SheetHeader className="px-5 pb-3 pt-5 text-left">
            <SheetTitle className="flex flex-col gap-1 text-base leading-relaxed">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-primary">Localização</span>
              </div>
              <div className="text-sm font-medium text-foreground opacity-90 pl-6">
                {(() => {
                  let parts = location.split(/,\s*|\s+-\s+|\s+•\s+/).filter(Boolean).map(p => p.trim());
                  parts = parts.map(p => p.replace(/^cep:?\s*/i, ''));
                  
                  const stateRegex = /^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO|Acre|Alagoas|Amap[áa]|Amazonas|Bahia|Cear[áa]|Distrito Federal|Esp[íi]rito Santo|Goi[áa]s|Maranh[ãa]o|Mato Grosso|Mato Grosso do Sul|Minas Gerais|Par[áa]|Para[íi]ba|Paran[áa]|Pernambuco|Piau[íi]|Rio de Janeiro|Rio Grande do Norte|Rio Grande do Sul|Rond[ôo]nia|Roraima|Santa Catarina|S[ãa]o Paulo|Sergipe|Tocantins)$/i;
                  
                  const lines = [];
                  for (let i = 0; i < parts.length; i++) {
                    if (i > 0 && stateRegex.test(parts[i]) && !stateRegex.test(parts[i-1])) {
                      const prev = lines.pop();
                      if (prev) {
                        lines.push(`${prev}, ${parts[i]}`);
                      } else {
                        lines.push(parts[i]);
                      }
                    } else {
                      lines.push(parts[i]);
                    }
                  }
                  
                  return lines.map((line, i) => (
                    <span key={i} className="block">{line}</span>
                  ));
                })()}
              </div>
            </SheetTitle>
            {distance !== null && (
              <SheetDescription className="pl-6 font-medium text-primary">
                A {formatDistance(distance)} de você
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="flex flex-col pb-4">
            <button
              onClick={() => openMap("google")}
              className="flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted active:bg-muted/70"
            >
              <Navigation className="h-5 w-5 text-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Abrir no Google Maps
                </p>
                <p className="text-xs text-muted-foreground">
                  Ver rota até o item
                </p>
              </div>
            </button>

            {showAppleOption && (
              <button
                onClick={() => openMap("apple")}
                className="flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted active:bg-muted/70"
              >
                <Navigation className="h-5 w-5 text-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Abrir no Apple Maps
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ver rota até o item
                  </p>
                </div>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted active:bg-muted/70"
            >
              <Copy className="h-5 w-5 text-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Copiar localização
                </p>
                <p className="text-xs text-muted-foreground">
                  Copia o endereço para a área de transferência
                </p>
              </div>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
