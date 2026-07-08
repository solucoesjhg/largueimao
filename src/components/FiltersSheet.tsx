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

export const carregarFiltros = (): FilterValues => {
  try {
    const LRaw = localStorage.getItem(STORAGE_KEY);
    if (LRaw) {
      const LParsed = JSON.parse(LRaw);
      if (typeof LParsed.category === 'string') {
        LParsed.category = [LParsed.category];
      }
      if (!LParsed.category || !Array.isArray(LParsed.category) || LParsed.category.length === 0) {
        LParsed.category = ["todos"];
      }
      return LParsed;
    }
  } catch {
    // ignore
  }
  return { cep: "", radius: 10, category: ["todos"] };
};

const formatarCep = (AValue: string) => {
  const LDigits = AValue.replace(/\D/g, "").slice(0, 8);
  if (LDigits.length > 5) return `${LDigits.slice(0, 5)}-${LDigits.slice(5)}`;
  return LDigits;
};

interface FiltersSheetProps {
  onApply: (AValues: FilterValues) => void;
  active?: boolean;
}

const FiltersSheet = ({ onApply: AOnApply, active: AActive }: FiltersSheetProps) => {
  // 1. Variáveis ganham o prefixo "L" de Local
  const [LOpen, setOpen] = useState(false);
  const [LCep, setCep] = useState("");
  const [LRadius, setRadius] = useState(10);
  const [LCategory, setCategory] = useState<string[]>(["todos"]);

  useEffect(() => {
    const LSaved = carregarFiltros();
    setCep(LSaved.cep);
    setRadius(LSaved.radius);
    setCategory(LSaved.category || ["todos"]);
  }, []);

  // 2. Extração de lógica pesada para um método focado usando verbos
  const aplicarFiltros = () => {
    const LValues = { cep: LCep, radius: LRadius, category: LCategory };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(LValues));
    AOnApply(LValues);
    setOpen(false);
  };

  const limparFiltros = () => {
    const LValues: FilterValues = { cep: "", radius: 10, category: ["todos"] };
    setCep("");
    setRadius(10);
    setCategory(["todos"]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(LValues));
    AOnApply(LValues);
    setOpen(false);
  };

  const alternarCategoria = (AValue: string) => {
    if (AValue === "todos") {
      setCategory(["todos"]);
      return;
    }

    let LNewCategory = LCategory.filter((AC) => AC !== "todos");

    if (LNewCategory.includes(AValue)) {
      LNewCategory = LNewCategory.filter((AC) => AC !== AValue);
    } else {
      LNewCategory.push(AValue);
    }

    if (LNewCategory.length === 0 || LNewCategory.length === CATEGORIES.length - 1) {
      setCategory(["todos"]);
    } else {
      setCategory(LNewCategory);
    }
  };

  // 3. Quebra da view em variáveis com prefixos de interface
  const pnlGatilho = (
    <SheetTrigger asChild>
      <Button
        variant="outline"
        size="icon"
        className="relative h-10 w-10 shrink-0 rounded-xl"
        aria-label="Filtros"
      >
        <SlidersHorizontal className="h-5 w-5" />
        {AActive && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        )}
      </Button>
    </SheetTrigger>
  );

  const pnlCabecalho = (
    <SheetHeader className="text-left">
      <SheetTitle>Filtros</SheetTitle>
    </SheetHeader>
  );

  const pnlCorpo = (
    <div className="space-y-6 py-6 max-h-[70vh] overflow-y-auto px-1">
      <div className="space-y-2">
        <Label>Categoria</Label>
        <div className="flex flex-wrap gap-2">
          {/* 4. Parâmetros iterativos e callbacks ganham prefixo "A" */}
          {CATEGORIES.map((ACat) => {
            const LIsActive = LCategory.includes(ACat.value);
            return (
              <button
                key={ACat.value}
                type="button"
                onClick={() => alternarCategoria(ACat.value)}
                className={`rounded-xl px-4 py-2 text-sm font-medium ${
                  LIsActive
                    ? "text-white bg-gradient-to-b from-[#3d5e44] to-[#253b2a] shadow-[inset_0_-2px_4px_rgba(0,0,0,0.4),_inset_0_2px_4px_rgba(255,255,255,0.1),_0_4px_8px_rgba(0,0,0,0.15)] border-b border-[#4d7555]"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {ACat.label}
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
          value={LCep}
          onChange={(AEvent) => setCep(formatarCep(AEvent.target.value))}
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label>Raio de busca</Label>
        <div className="grid grid-cols-4 gap-2">
          {RADIUS_OPTIONS.map((AOpt) => {
            const LIsActive = LRadius === AOpt;
            return (
              <button
                key={AOpt}
                type="button"
                onClick={() => setRadius(AOpt)}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium ${
                  LIsActive
                    ? "text-white bg-gradient-to-b from-[#3d5e44] to-[#253b2a] shadow-[inset_0_-2px_4px_rgba(0,0,0,0.4),_inset_0_2px_4px_rgba(255,255,255,0.1),_0_4px_8px_rgba(0,0,0,0.15)] border-b border-[#4d7555]"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {AOpt}km
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const pnlRodape = (
    <SheetFooter className="flex-row gap-2 sm:flex-row sm:justify-stretch">
      <SheetClose asChild>
        <Button variant="outline" onClick={limparFiltros} className="h-12 flex-1 rounded-xl">
          Limpar
        </Button>
      </SheetClose>
      <Button onClick={aplicarFiltros} className="h-12 flex-1 rounded-xl font-bold">
        Aplicar
      </Button>
    </SheetFooter>
  );

  // 5. O return da tela fica extremamente simples e sem lógica, como um lego
  return (
    <Sheet open={LOpen} onOpenChange={setOpen}>
      {pnlGatilho}
      <SheetContent side="bottom" className="rounded-t-2xl" onOpenAutoFocus={(AEvent) => AEvent.preventDefault()}>
        {pnlCabecalho}
        {pnlCorpo}
        {pnlRodape}
      </SheetContent>
    </Sheet>
  );
};

export default FiltersSheet;
