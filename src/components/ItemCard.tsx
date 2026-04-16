import { MapPin } from "lucide-react";

interface ItemCardProps {
  title: string;
  price: number;
  location?: string | null;
  imageUrl?: string | null;
  onClick?: () => void;
}

const ItemCard = ({ title, price, location, imageUrl, onClick }: ItemCardProps) => {
  const formattedPrice = price === 0 ? "Grátis" : `R$ ${price.toFixed(2).replace(".", ",")}`;

  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-shadow hover:shadow-md"
    >
      <div className="aspect-square w-full bg-muted">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <span className="text-3xl">📦</span>
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
