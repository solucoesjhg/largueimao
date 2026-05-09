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

type Coords = { lat: number; lon: number };

const LOCATION_CACHE_PREFIX = "geo:";
const USER_COORDS_KEY = "user-coords";
const USER_COORDS_TTL = 1000 * 60 * 30; // 30 min
const GEO_DENIED_KEY = "geo-denied";

const isGeoDenied = () => {
  try {
    return sessionStorage.getItem(GEO_DENIED_KEY) === "1";
  } catch {
    return false;
  }
};
const markGeoDenied = () => {
  try {
    sessionStorage.setItem(GEO_DENIED_KEY, "1");
  } catch {
    /* noop */
  }
};

const isIOS = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

function haversine(a: Coords, b: Coords) {
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

function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m de você`;
  }
  return `${km.toFixed(1).replace(".", ",")} km de você`;
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

function getCachedUserCoords(): Coords | null {
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

function setCachedUserCoords(coords: Coords) {
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
        <MapPin className="h-4 w-4 shrink-0 text-primary" />
        <span className="truncate text-sm font-medium text-foreground">
          {location}
        </span>
        {distance !== null && (
          <span className="shrink-0 text-xs text-muted-foreground">
            · {formatDistance(distance)}
          </span>
        )}
        {distance === null && itemCoords && !userCoords && (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              setPermissionOpen(true);
            }}
            className="shrink-0 text-xs font-medium text-primary hover:underline"
          >
            Ver distância
          </span>
        )}
      </button>

      {/* Bottom sheet — actions */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0">
          <SheetHeader className="px-5 pb-3 pt-5 text-left">
            <SheetTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              {location}
            </SheetTitle>
            {distance !== null && (
              <SheetDescription>{formatDistance(distance)}</SheetDescription>
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
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
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
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
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

            {!userCoords && itemCoords && (
              <button
                onClick={() => {
                  setOpen(false);
                  setPermissionOpen(true);
                }}
                className="flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted active:bg-muted/70"
              >
                <Navigation className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Calcular distância até você
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Usa sua localização atual
                  </p>
                </div>
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Permission sheet */}
      <Sheet open={permissionOpen} onOpenChange={setPermissionOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle>Mostrar distância até o item?</SheetTitle>
            <SheetDescription>
              Usamos sua localização apenas para calcular a distância até o
              item. Nada é enviado para o servidor.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={requestUserLocation}
              disabled={requesting}
              className="h-12 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {requesting ? "Obtendo localização…" : "Permitir"}
            </button>
            <button
              onClick={() => setPermissionOpen(false)}
              className="h-12 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Agora não
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
