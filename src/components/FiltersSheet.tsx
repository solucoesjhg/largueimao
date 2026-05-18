import { useState, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface FilterValues {
  cep: string;
  radius: number;
  category: string[];
}

export const CATEGORIES = [
  { value: "todos", label: "Todas" },
  { value: "moveis", label: "Móveis" },
  { value: "eletronicos", label: "Eletrônicos" },
  { value: "roupas", label: "Roupas" },
  { value: "livros", label: "Livros" },
  { value: "esportes", label: "Esportes" },
  { value: "brinquedos", label: "Brinquedos" },
  { value: "outros", label: "Outros" },
];

const RADIUS_OPTIONS = [5, 10, 25, 50];
const STORAGE_KEY = "larguei-mao:filters";

export const loadFilters = (): FilterValues => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.category === 'string') {
        parsed.category = [parsed.category];
      }
      if (!parsed.category || !Array.isArray(parsed.category) || parsed.category.length === 0) {
        parsed.category = ["todos"];
      }
      return parsed;
    }
  } catch {
    // ignore
  }
  return { cep: "", radius: 10, category: ["todos"] };
};

interface FiltersSheetProps {
  onApply: (values: FilterValues) => void;
  active?: boolean;
}

const formatCep = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return digits;
};

const FiltersSheet = ({ onApply, active }: FiltersSheetProps) => {
  const [open, setOpen] = useState(false);
  const [cep, setCep] = useState("");
  const [radius, setRadius] = useState(10);
  const [category, setCategory] = useState<string[]>(["todos"]);

  useEffect(() => {
    const saved = loadFilters();
    setCep(saved.cep);
    setRadius(saved.radius);
    setCategory(saved.category || ["todos"]);
  }, []);

  const handleApply = () => {
    const values = { cep, radius, category };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    onApply(values);
    setOpen(false);
  };

  const handleClear = () => {
    const values: FilterValues = { cep: "", radius: 10, category: ["todos"] };
    setCep("");
    setRadius(10);
    setCategory(["todos"]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    onApply(values);
    setOpen(false);
  };

  const handleCategoryToggle = (value: string) => {
    if (value === "todos") {
      setCategory(["todos"]);
      return;
    }

    let newCategory = category.filter((c) => c !== "todos");

    if (newCategory.includes(value)) {
      newCategory = newCategory.filter((c) => c !== value);
    } else {
      newCategory.push(value);
    }

    if (newCategory.length === 0 || newCategory.length === CATEGORIES.length - 1) {
      setCategory(["todos"]);
    } else {
      setCategory(newCategory);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-10 w-10 shrink-0 rounded-xl"
          aria-label="Filtros"
        >
          <SlidersHorizontal className="h-5 w-5" />
          {active && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader className="text-left">
          <SheetTitle>Filtros</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6 max-h-[70vh] overflow-y-auto px-1">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isActive = category.includes(cat.value);
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleCategoryToggle(cat.value)}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="cep">Localização (CEP)</Label>
            <Input
              id="cep"
              inputMode="numeric"
              placeholder="00000-000"
              value={cep}
              onChange={(e) => setCep(formatCep(e.target.value))}
              className="h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>Raio de busca</Label>
            <div className="grid grid-cols-4 gap-2">
              {RADIUS_OPTIONS.map((opt) => {
                const isActive = radius === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setRadius(opt)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {opt}km
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row gap-2 sm:flex-row sm:justify-stretch">
          <SheetClose asChild>
            <Button variant="outline" onClick={handleClear} className="h-12 flex-1 rounded-xl">
              Limpar
            </Button>
          </SheetClose>
          <Button onClick={handleApply} className="h-12 flex-1 rounded-xl font-bold">
            Aplicar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default FiltersSheet;
