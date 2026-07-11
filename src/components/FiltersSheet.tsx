import { useState, useEffect } from "react";
import { SlidersHorizontal, Check } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";

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
    <DrawerTrigger asChild>
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
    </DrawerTrigger>
  );

  const pnlCabecalho = (
    <DrawerHeader className="text-left">
      <DrawerTitle>Filtros</DrawerTitle>
    </DrawerHeader>
  );

  const pnlCorpo = (
    <div className="space-y-6 py-6 max-h-[70vh] overflow-y-auto px-4">
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
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                  LIsActive
                    ? "bg-[#8fce9e]/40 hover:bg-[#8fce9e]/50 text-foreground border border-[#8fce9e]/50 backdrop-blur-md shadow-[0_4px_12px_rgba(143,206,158,0.2)]"
                    : "bg-muted text-muted-foreground hover:bg-accent border border-transparent"
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
        <div className="relative">
          <Input
            id="cep"
            inputMode="numeric"
            placeholder="00000-000"
            value={LCep}
            onChange={(AEvent) => setCep(formatarCep(AEvent.target.value))}
            className="h-12 rounded-xl pr-12"
          />
          {LCep.length > 0 && (
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                document.getElementById('cep')?.blur();
              }}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors active:bg-primary/20"
              aria-label="Confirmar CEP"
            >
              <Check className="h-5 w-5" />
            </button>
          )}
        </div>
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
                className={`rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  LIsActive
                    ? "bg-[#8fce9e]/40 hover:bg-[#8fce9e]/50 text-foreground border border-[#8fce9e]/50 backdrop-blur-md shadow-[0_4px_12px_rgba(143,206,158,0.2)]"
                    : "bg-muted text-muted-foreground hover:bg-accent border border-transparent"
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
    <DrawerFooter className="flex-row gap-2 sm:flex-row sm:justify-stretch">
      <DrawerClose asChild>
        <Button variant="outline" onClick={limparFiltros} className="h-12 flex-1 rounded-xl">
          Limpar
        </Button>
      </DrawerClose>
      <button onClick={aplicarFiltros} className="h-12 flex-1 rounded-xl font-bold btn-glass-neon text-sm">
        Aplicar
      </button>
    </DrawerFooter>
  );

  const { isOpen: isKeyboardOpen, keyboardHeight } = useKeyboardOpen();

  // 5. O return da tela fica extremamente simples e sem lógica
  return (
    <Drawer open={LOpen} onOpenChange={setOpen}>
      {pnlGatilho}
      <DrawerContent 
        className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-2xl transition-transform"
        style={{
          transform: isKeyboardOpen ? `translateY(-${keyboardHeight}px)` : 'translateY(0)',
        }}
      >
        {pnlCabecalho}
        {pnlCorpo}
        {pnlRodape}
      </DrawerContent>
    </Drawer>
  );
};

export default FiltersSheet;
