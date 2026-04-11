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
      <div className="space-y-1 p-3">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="text-base font-bold text-primary">{formattedPrice}</p>
        {location && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {location}
          </p>
        )}
      </div>
    </button>
  );
};

export default ItemCard;
