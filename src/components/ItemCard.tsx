import { useState } from "react";
import { ImageIcon, MapPin } from "lucide-react";

interface ItemCardProps {
  title: string;
  price: number;
  location?: string | null;
  imageUrl?: string | null;
  images?: string[] | null;
  onClick?: () => void;
}

const ItemCard = ({ title, price, location, imageUrl, images, onClick }: ItemCardProps) => {
  const formattedPrice = price === 0 ? "Grátis" : `R$ ${price.toFixed(2).replace(".", ",")}`;
  const cover = images?.[0] ?? imageUrl ?? null;
  const total = images?.length ?? (imageUrl ? 1 : 0);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-full bg-muted">
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
        {total > 1 && (
          <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-md bg-background/85 px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow-sm backdrop-blur-sm">
            <ImageIcon className="h-2.5 w-2.5" />
            {total}
          </div>
        )}
      </div>
      <div className="space-y-0.5 p-2">
        <p className="truncate text-xs font-medium text-foreground">{title}</p>
        <p className="text-sm font-bold text-primary">{formattedPrice}</p>
        {location && (
          <p className="flex items-center gap-0.5 truncate text-[10px] text-muted-foreground">
            <MapPin className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{location}</span>
          </p>
        )}
      </div>
    </button>
  );
};

export default ItemCard;
