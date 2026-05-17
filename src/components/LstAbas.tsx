import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const CATEGORIES = [
  { value: "todos", label: "Todos" },
  { value: "moveis", label: "Móveis" },
  { value: "eletronicos", label: "Eletrônicos" },
  { value: "roupas", label: "Roupas" },
  { value: "livros", label: "Livros" },
  { value: "esportes", label: "Esportes" },
  { value: "brinquedos", label: "Brinquedos" },
  { value: "outros", label: "Outros" },
];

interface LstAbasProps {
  selected: string;
  onSelect: (category: string) => void;
}

const LstAbas = ({ selected, onSelect }: LstAbasProps) => {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex items-center gap-2 pr-4 pl-2">
        {CATEGORIES.map((cat) => {
          const isActive = selected === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => onSelect(cat.value)}
              className={`shrink-0 rounded-full px-3 h-[26px] flex items-center justify-center text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" className="hidden" />
    </ScrollArea>
  );
};

export { CATEGORIES };
export default LstAbas;
