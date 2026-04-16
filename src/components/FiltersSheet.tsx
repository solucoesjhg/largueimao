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
}

const RADIUS_OPTIONS = [5, 10, 25, 50];
const STORAGE_KEY = "larguei-mao:filters";

export const loadFilters = (): FilterValues => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { cep: "", radius: 10 };
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

  useEffect(() => {
    const saved = loadFilters();
    setCep(saved.cep);
    setRadius(saved.radius);
  }, []);

  const handleApply = () => {
    const values = { cep, radius };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    onApply(values);
    setOpen(false);
  };

  const handleClear = () => {
    const values = { cep: "", radius: 10 };
    setCep("");
    setRadius(10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    onApply(values);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-12 w-12 shrink-0 rounded-xl"
          aria-label="Filtros"
        >
          <SlidersHorizontal className="h-5 w-5" />
          {active && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>Filtros</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
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
